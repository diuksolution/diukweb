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

    const body = await request.json()
    const { pesan, selectedCustomers, tanggal } = body

    if (!pesan || !selectedCustomers || selectedCustomers.length === 0) {
      return NextResponse.json(
        { error: 'Pesan dan customer harus diisi' },
        { status: 400 }
      )
    }

    // Create broadcast record
    let broadcast = await prisma.broadcast.create({
      data: {
        pesan,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        userId: dbUser.id,
        status: 'pending',
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
    }

    // Trigger n8n webhook
    // Use env var, fallback to provided webhook URL for development/testing
    const n8nWebhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      'http://localhost:5678/webhook/send-broadcast'
    if (n8nWebhookUrl) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        // Optional: pass auth header to n8n (e.g. Authorization: Bearer xxx)
        // Set in .env: N8N_WEBHOOK_AUTH="Bearer your-token" (or whatever format n8n expects)
        if (process.env.N8N_WEBHOOK_AUTH) {
          headers['diuksolution'] = process.env.N8N_WEBHOOK_AUTH
        }

        const webhookResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers,
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

