import { NextResponse } from 'next/server'

// POST - Get list of sheets for a given Google Sheets URL
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { linkdata } = body as { linkdata?: string }

    if (!linkdata || linkdata.trim() === '') {
      return NextResponse.json({ error: 'Link spreadsheet tidak boleh kosong' }, { status: 400 })
    }

    const spreadsheetUrl = linkdata.trim()

    // Extract spreadsheet ID from URL
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return NextResponse.json({ error: 'URL spreadsheet tidak valid' }, { status: 400 })
    }

    const spreadsheetId = match[1]

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'GOOGLE_SHEETS_API_KEY belum dikonfigurasi. Ikuti petunjuk di docs/GOOGLE_SHEETS_SETUP.md untuk menambahkan API key.',
        },
        { status: 500 }
      )
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      const text = await response.text()
      console.error('Error fetching sheets metadata:', text)
      return NextResponse.json(
        {
          error: `Gagal mengambil daftar sheet (Status: ${response.status}). Pastikan spreadsheet dapat diakses oleh API key.`,
        },
        { status: 400 }
      )
    }

    const data = (await response.json()) as {
      sheets?: { properties?: { sheetId?: number; title?: string } }[]
    }

    const sheets =
      data.sheets?.map((s) => ({
        id: s.properties?.sheetId?.toString() ?? '',
        title: s.properties?.title ?? '',
      })) ?? []

    return NextResponse.json({ sheets })
  } catch (error) {
    console.error('Error fetching sheets list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

