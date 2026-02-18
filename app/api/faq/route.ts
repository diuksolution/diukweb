import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSheetsAuthedClient } from '@/lib/google/sheets'

type FaqRow = {
  rowNumber: number // 1-based sheet row index
  data: Record<string, string>
}

const parseCSV = (text: string): string[][] => {
  const rows: string[][] = []
  let currentRow: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(current.trim())
      current = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current || currentRow.length > 0) {
        currentRow.push(current.trim())
        if (currentRow.some((field) => field !== '')) rows.push(currentRow)
        currentRow = []
        current = ''
      }
      if (char === '\r' && nextChar === '\n') i++
    } else {
      current += char
    }
  }

  if (current || currentRow.length > 0) {
    currentRow.push(current.trim())
    if (currentRow.some((field) => field !== '')) rows.push(currentRow)
  }

  return rows
}

function toA1Col(colNumber1Based: number): string {
  let n = colNumber1Based
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s || 'A'
}

// GET - Get FAQ data from Google Sheets (sama seperti reservasi, via CSV)
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

    if (!dbUser || !dbUser.business || !dbUser.business.linkdata) {
      console.error('[FAQ API] Business or linkdata not found:', { 
        hasUser: !!dbUser, 
        hasBusiness: !!dbUser?.business, 
        hasLinkdata: !!dbUser?.business?.linkdata 
      })
      return NextResponse.json({ error: 'Business or linkdata not found' }, { status: 404 })
    }

    const spreadsheetUrl = dbUser.business.linkdata
    console.log('[FAQ API] Spreadsheet URL:', spreadsheetUrl)

    // Extract spreadsheet ID from URL
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      console.error('[FAQ API] Invalid spreadsheet URL format:', spreadsheetUrl)
      return NextResponse.json({ error: 'Invalid spreadsheet URL' }, { status: 400 })
    }

    const spreadsheetId = match[1]

    // Extract gid for FAQ sheet:
    // - Kalau ada faqGid → pakai itu
    // - Kalau tidak ada, fallback ke gid biasa
    // - Kalau tidak ada juga, fallback ke '0'
    const faqGidMatch = spreadsheetUrl.match(/[#&]faqGid=(\d+)/)
    const gidMatch = spreadsheetUrl.match(/[#&]gid=(\d+)/)
    const gid = faqGidMatch ? faqGidMatch[1] : gidMatch ? gidMatch[1] : '0'

    console.log('[FAQ API] Fetching FAQ from spreadsheet:', { spreadsheetId, gid, faqGid: faqGidMatch?.[1] })

    // Try to fetch as CSV - this works if spreadsheet is public
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`

    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Gagal mengakses spreadsheet (Status: ${response.status}). Pastikan spreadsheet sudah di-share dengan akses view atau buat menjadi public.`,
          instructions: [
            'Buka spreadsheet di Google Sheets',
            'Klik "Share" → "Change to anyone with the link"',
            'Pilih "Viewer" (bukan Editor)',
            'Klik "Done"',
          ],
        },
        { status: 400 }
      )
    }

    const csvText = await response.text()
    console.log('[FAQ API] CSV fetched, length:', csvText.length)
    
    if (!csvText || csvText.trim().length === 0) {
      console.warn('[FAQ API] CSV is empty')
      return NextResponse.json({ headers: [], rows: [] })
    }

    const rows = parseCSV(csvText)
    console.log('[FAQ API] Parsed CSV rows:', rows.length)
    
    if (rows.length === 0) {
      return NextResponse.json({ headers: [], rows: [] })
    }

    const headers = rows[0].map((h) => h.replace(/^"|"$/g, '').trim()).filter((h) => h.length > 0)
    console.log('[FAQ API] Headers found:', headers)
    
    if (headers.length === 0) {
      console.warn('[FAQ API] No headers found in first row')
      return NextResponse.json({ headers: [], rows: [] })
    }

    const faqRows: FaqRow[] = []

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].map((v) => v.replace(/^"|"$/g, '').trim())
      if (!values.some((v) => v && v.trim())) continue
      const data: Record<string, string> = {}
      headers.forEach((h, idx) => {
        data[h] = values[idx] || ''
      })
      faqRows.push({ rowNumber: i + 1, data })
    }

    console.log('[FAQ API] Returning', faqRows.length, 'FAQ rows')

    return NextResponse.json({ headers, rows: faqRows })
  } catch (error: any) {
    console.error('Error fetching FAQ data:', error)
    const errorMessage = error?.message || String(error) || 'Internal server error'
    return NextResponse.json(
      { 
        error: `Gagal mengambil data FAQ: ${errorMessage}`,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Tambah FAQ baru (butuh service account untuk write)
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

    if (!dbUser || !dbUser.business || !dbUser.business.linkdata) {
      return NextResponse.json({ error: 'Business or linkdata not found' }, { status: 404 })
    }

    const spreadsheetUrl = dbUser.business.linkdata
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid spreadsheet URL' }, { status: 400 })
    }

    const spreadsheetId = match[1]
    const faqGidMatch = spreadsheetUrl.match(/[#&]faqGid=(\d+)/)
    const gidMatch = spreadsheetUrl.match(/[#&]gid=(\d+)/)
    const gid = faqGidMatch ? faqGidMatch[1] : gidMatch ? gidMatch[1] : '0'
    const sheetId = Number(gid)

    // Check service account
    const { sheets, sheetAuthConfigured } = await getSheetsAuthedClient()
    if (!sheetAuthConfigured) {
      return NextResponse.json(
        {
          error: 'Fitur tambah/edit/hapus FAQ butuh service account. Service account belum dikonfigurasi.',
          instructions: [
            '1. Buat Service Account di Google Cloud Console',
            '2. Download JSON key file',
            '3. Set env GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
            '4. Share spreadsheet ke email service account dengan akses Editor (bukan Viewer)',
            '5. Enable Google Sheets API di Google Cloud Console',
            '6. Restart aplikasi',
            '',
            'Lihat dokumentasi lengkap di: docs/GOOGLE_SHEETS_SETUP.md',
          ],
        },
        { status: 500 }
      )
    }

    // Get sheet title from sheetId
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.sheetId === sheetId)
    if (!sheet?.properties?.title) {
      return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 400 })
    }
    const sheetTitle = sheet.properties.title

    const body = (await request.json()) as { row?: Record<string, string> }
    const row = body?.row ?? {}

    // Read headers from first row
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetTitle}'!1:1`,
    })
    const headers = (headerRes.data.values?.[0] ?? []).map((h) => String(h ?? '').trim()).filter(Boolean)
    if (headers.length === 0) {
      return NextResponse.json(
        { error: 'Header FAQ kosong. Pastikan baris pertama berisi nama kolom.' },
        { status: 400 }
      )
    }

    const newValues = headers.map((h) => String(row[h] ?? '').trim())

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${sheetTitle}'`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [newValues] },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT - Edit FAQ (butuh service account untuk write)
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

    if (!dbUser || !dbUser.business || !dbUser.business.linkdata) {
      return NextResponse.json({ error: 'Business or linkdata not found' }, { status: 404 })
    }

    const spreadsheetUrl = dbUser.business.linkdata
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid spreadsheet URL' }, { status: 400 })
    }

    const spreadsheetId = match[1]
    const faqGidMatch = spreadsheetUrl.match(/[#&]faqGid=(\d+)/)
    const gidMatch = spreadsheetUrl.match(/[#&]gid=(\d+)/)
    const gid = faqGidMatch ? faqGidMatch[1] : gidMatch ? gidMatch[1] : '0'
    const sheetId = Number(gid)

    const { sheets, sheetAuthConfigured } = await getSheetsAuthedClient()
    if (!sheetAuthConfigured) {
      return NextResponse.json(
        {
          error: 'Fitur edit FAQ butuh service account. Service account belum dikonfigurasi.',
          instructions: [
            'Set env GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
            'Share spreadsheet ke email service account dengan akses Editor',
            'Lihat: docs/GOOGLE_SHEETS_SETUP.md',
          ],
        },
        { status: 500 }
      )
    }

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.sheetId === sheetId)
    if (!sheet?.properties?.title) {
      return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 400 })
    }
    const sheetTitle = sheet.properties.title

    const body = (await request.json()) as { rowNumber?: number; row?: Record<string, string> }
    const rowNumber = Number(body?.rowNumber)
    const patch = body?.row ?? {}

    if (!Number.isFinite(rowNumber) || rowNumber < 2) {
      return NextResponse.json({ error: 'rowNumber tidak valid (minimal baris 2, tidak boleh edit header).' }, { status: 400 })
    }

    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetTitle}'!1:1`,
    })
    const headers = (headerRes.data.values?.[0] ?? []).map((h) => String(h ?? '').trim()).filter(Boolean)
    if (headers.length === 0) {
      return NextResponse.json({ error: 'Header FAQ kosong.' }, { status: 400 })
    }

    const lastCol = toA1Col(headers.length)
    const rowRange = `'${sheetTitle}'!A${rowNumber}:${lastCol}${rowNumber}`
    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rowRange,
    })
    const existing = (existingRes.data.values?.[0] ?? []).map((v) => String(v ?? '').trim())

    const merged = headers.map((h, idx) => {
      const v = patch[h]
      if (v === undefined) return existing[idx] ?? ''
      return String(v ?? '').trim()
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: rowRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [merged] },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Hapus FAQ (butuh service account untuk write)
export async function DELETE(request: Request) {
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

    if (!dbUser || !dbUser.business || !dbUser.business.linkdata) {
      return NextResponse.json({ error: 'Business or linkdata not found' }, { status: 404 })
    }

    const spreadsheetUrl = dbUser.business.linkdata
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid spreadsheet URL' }, { status: 400 })
    }

    const spreadsheetId = match[1]
    const faqGidMatch = spreadsheetUrl.match(/[#&]faqGid=(\d+)/)
    const gidMatch = spreadsheetUrl.match(/[#&]gid=(\d+)/)
    const gid = faqGidMatch ? faqGidMatch[1] : gidMatch ? gidMatch[1] : '0'
    const sheetId = Number(gid)

    const { sheets, sheetAuthConfigured } = await getSheetsAuthedClient()
    if (!sheetAuthConfigured) {
      return NextResponse.json(
        {
          error: 'Fitur hapus FAQ butuh service account. Service account belum dikonfigurasi.',
          instructions: [
            'Set env GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
            'Share spreadsheet ke email service account dengan akses Editor',
            'Lihat: docs/GOOGLE_SHEETS_SETUP.md',
          ],
        },
        { status: 500 }
      )
    }

    const body = (await request.json()) as { rowNumber?: number }
    const rowNumber = Number(body?.rowNumber)

    if (!Number.isFinite(rowNumber) || rowNumber < 2) {
      return NextResponse.json({ error: 'rowNumber tidak valid (minimal baris 2, tidak boleh hapus header).' }, { status: 400 })
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber - 1, // 0-based, inclusive
                endIndex: rowNumber, // 0-based, exclusive
              },
            },
          },
        ],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


