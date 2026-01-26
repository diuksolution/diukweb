import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - Get list of broadcasts
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const broadcasts = await prisma.broadcast.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ broadcasts })
  } catch (error) {
    console.error('Error fetching broadcasts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new broadcast and trigger n8n webhook
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { business: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const contentType = request.headers.get('content-type') || ''
    let pesan: string | null = null
    let selectedCustomers: any[] = []
    let tanggal: string | null = null
    let imageFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const fd = await request.formData()
      pesan = (fd.get('pesan') as string | null) ?? null
      tanggal = (fd.get('tanggal') as string | null) ?? null
      const selectedCustomersRaw = (fd.get('selectedCustomers') as string | null) ?? null
      if (selectedCustomersRaw) {
        try {
          selectedCustomers = JSON.parse(selectedCustomersRaw)
        } catch {
          return NextResponse.json(
            { error: 'selectedCustomers tidak valid (harus JSON)' },
            { status: 400 }
          )
        }
      }
      const img = fd.get('image')
      if (img && img instanceof File) {
        imageFile = img
      }
    } else {
      const body = await request.json()
      pesan = body?.pesan ?? null
      selectedCustomers = body?.selectedCustomers ?? []
      tanggal = body?.tanggal ?? null
    }

    if (!pesan || !selectedCustomers || selectedCustomers.length === 0) {
      return NextResponse.json(
        { error: 'Pesan dan customer harus diisi' },
        { status: 400 }
      )
    }

    // Optional: validate image upload (only if provided)
    if (imageFile) {
      const isImage = (imageFile.type || '').toLowerCase().startsWith('image/')
      const maxBytes = 5 * 1024 * 1024 // 5MB
      if (!isImage) {
        return NextResponse.json(
          { error: 'File harus berupa gambar' },
          { status: 400 }
        )
      }
      if (imageFile.size > maxBytes) {
        return NextResponse.json(
          { error: 'Ukuran gambar terlalu besar (maks 5MB)' },
          { status: 400 }
        )
      }
    }

    // Normalize recipients to store in DB for history popup
    const recipients = (selectedCustomers as any[]).map((customer: any) => ({
      nama: customer?.nama ?? '',
      noWa: customer?.noWa ?? '',
      idWa: customer?.idWa ?? '',
    }))

    // Create broadcast record
    let broadcast = await prisma.broadcast.create({
      data: {
        pesan,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        userId: dbUser.id,
        status: 'pending',
        recipients,
      },
    })

    // Prepare data for n8n webhook
    // Parse sheet ids (menu & reservasi) dari linkdata jika ada
    let menuSheetId: string | null = null
    let reservationSheetId: string | null = null
    const linkdata = dbUser.business?.linkdata || ''
    if (linkdata) {
      const gidMatch = linkdata.match(/[#&]gid=(\d+)/)
      const reservMatch = linkdata.match(/[#&]reservasiGid=(\d+)/)
      if (gidMatch) menuSheetId = gidMatch[1]
      if (reservMatch) reservationSheetId = reservMatch[1]
    }

    const n8nPayload = {
      broadcastId: broadcast.id,
      pesan,
      tanggal: broadcast.tanggal.toISOString(),
      // field flat tambahan untuk kemudahan di n8n
      businessId: dbUser.business?.id,
      businessLinkdata: dbUser.business?.linkdata,
      menuSheetId,
      reservationSheetId,
      customers: selectedCustomers.map((customer: any) => ({
        nama: customer.nama,
        noWa: customer.noWa,
        idWa: customer.idWa,
      })),
      business: {
        id: dbUser.business?.id,
        nama: dbUser.business?.nama,
        linkdata: dbUser.business?.linkdata,
        idDriveGambarMenu: dbUser.business?.idDriveGambarMenu,
      },
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
      hasImage: Boolean(imageFile),
    }

    // Trigger n8n webhook
    // Use env var, fallback to provided webhook URL for development/testing
    const n8nWebhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      'http://localhost:5678/webhook/send-broadcast'
    if (n8nWebhookUrl) {
      try {
        const headers: Record<string, string> = {}

        // Optional: pass auth header to n8n
        if (process.env.N8N_WEBHOOK_AUTH) headers['diuksolution'] = process.env.N8N_WEBHOOK_AUTH

        const webhookResponse = imageFile
          ? await (async () => {
              // Send multipart so n8n can receive binary + payload
              const out = new FormData()
              out.append('payload', JSON.stringify(n8nPayload))

              // Clone file bytes to be safe across runtimes
              const buf = await imageFile.arrayBuffer()
              const blob = new Blob([buf], { type: imageFile.type || 'application/octet-stream' })
              out.append('image', blob, imageFile.name || 'image')

              return fetch(n8nWebhookUrl, {
                method: 'POST',
                headers, // do NOT set Content-Type; fetch will set boundary
                body: out,
              })
            })()
          : await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify(n8nPayload),
            })

        if (!webhookResponse.ok) {
          console.error('N8N webhook failed:', await webhookResponse.text())
          // Mark broadcast as failed if webhook returns non-2xx
          broadcast = await prisma.broadcast.update({
            where: { id: broadcast.id },
            data: { status: 'failed' },
          })
        } else {
          // Mark broadcast as sent if webhook succeeds
          broadcast = await prisma.broadcast.update({
            where: { id: broadcast.id },
            data: { status: 'sent' },
          })
        }
      } catch (webhookError) {
        console.error('Error calling n8n webhook:', webhookError)
        // Mark broadcast as failed if webhook call throws
        broadcast = await prisma.broadcast.update({
          where: { id: broadcast.id },
          data: { status: 'failed' },
        })
      }
    }

    return NextResponse.json({
      broadcast,
      message: 'Broadcast berhasil dibuat dan dikirim ke n8n',
    })
  } catch (error) {
    console.error('Error creating broadcast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

