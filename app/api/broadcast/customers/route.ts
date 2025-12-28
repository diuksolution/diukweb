import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - Get customers from Google Sheets
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
      return NextResponse.json({ error: 'Business or linkdata not found' }, { status: 404 })
    }

    const spreadsheetUrl = dbUser.business.linkdata

    // Extract spreadsheet ID from URL
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid spreadsheet URL' }, { status: 400 })
    }

    const spreadsheetId = match[1]

    // Extract gid for sheet yang akan dipakai:
    // - Kalau ada reservasiGid → pakai itu (sheet kedua / reservasi)
    // - Kalau tidak ada, fallback ke gid biasa
    // - Kalau tidak ada juga, fallback ke '0'
    const reservGidMatch = spreadsheetUrl.match(/[#&]reservasiGid=(\d+)/)
    const gidMatch = spreadsheetUrl.match(/[#&]gid=(\d+)/)
    const gid = reservGidMatch ? reservGidMatch[1] : gidMatch ? gidMatch[1] : '0'

    // Try to fetch as CSV - this works if spreadsheet is public
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json({
        error: `Gagal mengakses spreadsheet (Status: ${response.status}). Pastikan spreadsheet sudah di-share dengan akses view atau buat menjadi public.`,
        instructions: [
          'Buka spreadsheet di Google Sheets',
          'Klik "Share" → "Change to anyone with the link"',
          'Pilih "Viewer" (bukan Editor)',
          'Klik "Done"',
        ],
      }, { status: 400 })
    }

    const csvText = await response.text()
    
    // Parse CSV - handle quoted values and multi-line values properly
    // First, properly handle multi-line quoted values
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
            // Escaped quote
            current += '"'
            i++ // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          currentRow.push(current.trim())
          current = ''
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
          // Row separator (only if not in quotes)
          if (current || currentRow.length > 0) {
            currentRow.push(current.trim())
            if (currentRow.some(field => field !== '')) {
              rows.push(currentRow)
            }
            currentRow = []
            current = ''
          }
          // Skip \r\n combination
          if (char === '\r' && nextChar === '\n') {
            i++
          }
        } else {
          current += char
        }
      }
      
      // Add last field and row
      if (current || currentRow.length > 0) {
        currentRow.push(current.trim())
        if (currentRow.some(field => field !== '')) {
          rows.push(currentRow)
        }
      }
      
      return rows
    }

    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      return NextResponse.json({ customers: [] })
    }

    const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim())
    
    // Find column indices
    const namaIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return (lower.includes('nama') || lower.includes('tt nama') || lower === 'nama') && 
             !lower.includes('jumlah')
    })
    const noWaIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return (lower.includes('no wa') || 
              lower.includes('no. wa') || 
              lower.includes('nomor wa') ||
              lower === 'no wa') &&
             !lower.includes('id')
    })
    const idWaIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower.includes('id wa') || 
             lower.includes('id. wa') ||
             lower === 'id wa'
    })

    if (namaIndex === -1) {
      return NextResponse.json({ 
        error: 'Kolom "Nama" tidak ditemukan di spreadsheet. Header yang ditemukan: ' + headers.join(', '),
        headers,
      }, { status: 400 })
    }

    // Note: ID WA dan NO WA tidak wajib, kita tetap tampilkan data yang punya nama

    // Parse data rows
    const customers = []
    const maxIndex = Math.max(
      namaIndex, 
      noWaIndex >= 0 ? noWaIndex : -1, 
      idWaIndex >= 0 ? idWaIndex : -1
    )
    
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].map(v => v.replace(/^"|"$/g, '').trim())
      
      // Check if we have enough columns
      if (values.length > maxIndex) {
        const nama = values[namaIndex]?.trim() || ''
        const noWa = noWaIndex >= 0 ? (values[noWaIndex]?.trim() || '') : ''
        const idWa = idWaIndex >= 0 ? (values[idWaIndex]?.trim() || '') : ''

        // Include row if it has a nama and nama is not empty and not the header text
        if (nama && nama.length > 0 && nama.toLowerCase() !== 'nama' && nama.toLowerCase() !== 'tt nama') {
          customers.push({
            nama,
            noWa: noWa || '',
            idWa: idWa || '',
            index: i - 1,
          })
        }
      }
    }

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

