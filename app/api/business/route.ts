import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - Get business data for current user
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
      include: { business: true },
    })

    if (!dbUser || !dbUser.business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json(dbUser.business)
  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Utility: parse sheet IDs (menu, reservasi, tempat) dari linkdata jika ada
const parseSheetIdsFromLink = (link?: string | null): { menuSheetId: string | null; reservationSheetId: string | null; tempatSheetId: string | null } => {
  if (!link) return { menuSheetId: null, reservationSheetId: null, tempatSheetId: null }

  let menuSheetId: string | null = null
  let reservationSheetId: string | null = null
  let tempatSheetId: string | null = null

  const gidMatch = link.match(/[#&]gid=(\d+)/)
  const reservMatch = link.match(/[#&]reservasiGid=(\d+)/)
  const tempatMatch = link.match(/[#&]tempatGid=(\d+)/)

  if (gidMatch) menuSheetId = gidMatch[1]
  if (reservMatch) reservationSheetId = reservMatch[1]
  if (tempatMatch) tempatSheetId = tempatMatch[1]

  return { menuSheetId, reservationSheetId, tempatSheetId }
}

// PUT - Update business data
export async function PUT(request: Request) {
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

    if (!dbUser || !dbUser.business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const body = await request.json()
    const { nama, linkdata, prompt, idDriveGambarMenu } = body as { nama?: string; linkdata?: string | null; prompt?: string | null; idDriveGambarMenu?: string | null }
    
    console.log('Business update request body:', { nama, linkdata, prompt, idDriveGambarMenu })

    if (!nama || nama.trim() === '') {
      return NextResponse.json({ error: 'Nama business is required' }, { status: 400 })
    }

    const normalizedLink =
      linkdata && linkdata.trim() !== '' ? linkdata.trim() : null

    const normalizedPrompt =
      prompt && prompt.trim() !== '' ? prompt.trim() : null

    const normalizedIdDriveGambarMenu =
      idDriveGambarMenu && idDriveGambarMenu.trim() !== '' ? idDriveGambarMenu.trim() : null

    const updatedBusiness = await prisma.business.update({
      where: { id: dbUser.business.id },
      data: {
        nama: nama.trim(),
        linkdata: normalizedLink,
        prompt: normalizedPrompt,
        idDriveGambarMenu: normalizedIdDriveGambarMenu,
      },
    })
    
    console.log('Updated business:', { id: updatedBusiness.id, idDriveGambarMenu: updatedBusiness.idDriveGambarMenu })

    // After updating business, trigger optional n8n init webhook (non-blocking)
    // Always trigger webhook when saving from business page
    const n8nInitUrl = process.env.N8N_WEBHOOK_URL_INIT
    if (n8nInitUrl) {
      console.log('Triggering webhook...')
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (process.env.N8N_WEBHOOK_AUTH_INIT) {
          headers['diuksolution'] = process.env.N8N_WEBHOOK_AUTH_INIT
        }

        const { menuSheetId, reservationSheetId, tempatSheetId } = parseSheetIdsFromLink(updatedBusiness.linkdata)

        const payload = {
          business: {
            id: updatedBusiness.id,
            nama: updatedBusiness.nama,
            linkdata: updatedBusiness.linkdata,
            prompt: updatedBusiness.prompt,
            idDriveGambarMenu: updatedBusiness.idDriveGambarMenu,
            menuSheetId,
            reservationSheetId,
            tempatSheetId,
          },
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
          },
        }

        const resp = await fetch(n8nInitUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (!resp.ok) {
          const errorText = await resp.text()
          console.error('N8N init webhook failed:', errorText)
        } else {
          console.log('N8N init webhook triggered successfully')
        }
      } catch (webhookError) {
        console.error('Error calling n8n init webhook:', webhookError)
      }
    } else {
      console.log('Webhook not triggered: N8N_WEBHOOK_URL_INIT not set')
    }

    return NextResponse.json(updatedBusiness)
  } catch (error) {
    console.error('Error updating business:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

