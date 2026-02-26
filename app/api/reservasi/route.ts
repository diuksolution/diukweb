import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - Get reservation data from Google Sheets
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

    // Extract gid for reservation sheet:
    // - Kalau ada reservasiGid → pakai itu
    // - Kalau tidak ada, fallback ke gid biasa
    // - Kalau tidak ada juga, fallback ke '0'
    const reservGidMatch = spreadsheetUrl.match(/[#&]reservasiGid=(\d+)/)
    const gidMatch = spreadsheetUrl.match(/[#&]gid=(\d+)/)
    const gid = reservGidMatch ? reservGidMatch[1] : gidMatch ? gidMatch[1] : '0'

    // Build reservation link for display
    const reservationLink = reservGidMatch
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${reservGidMatch[1]}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

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
        reservationLink,
      }, { status: 400 })
    }

    const csvText = await response.text()
    
    // Parse CSV - handle quoted values and multi-line values properly
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
      return NextResponse.json({ reservations: [], reservationLink })
    }

    const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim())
    
    // Find column indices - look for reservation date column
    const tanggalIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower.includes('tanggal') && 
             (lower.includes('reservasi') || lower.includes('booking') || lower.includes('date'))
    })
    
    // If not found, try to find any date column
    const dateIndex = tanggalIndex >= 0 ? tanggalIndex : headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower.includes('tanggal') || lower.includes('date') || lower.includes('tgl')
    })

    // Find other common columns
    const namaIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return (lower.includes('nama') || lower.includes('tt nama') || lower === 'nama') && 
             !lower.includes('jumlah')
    })

    // Parse data rows
    const reservations: any[] = []
    
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].map(v => v.replace(/^"|"$/g, '').trim())
      
      // Get all column values, using headers as keys
      const reservationData: any = {
        index: i - 1,
      }

      // Store all column values
      headers.forEach((header, idx) => {
        reservationData[header] = values[idx] || ''
      })

      // Extract date if date column exists
      let reservationDate: string | null = null
      if (dateIndex >= 0 && values.length > dateIndex) {
        const dateValue = values[dateIndex]?.trim() || ''
        
        if (dateValue) {
          // Normalize date format - convert to YYYY-MM-DD
          try {
            let dateObj: Date
            
            // Check if it's already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              dateObj = new Date(dateValue + 'T00:00:00')
            } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateValue.trim())) {
              // Handle DD/MM/YYYY or DD-MM-YYYY (common in ID locale)
              const parts = dateValue.trim().split(/[\/\-]/)
              const day = parseInt(parts[0], 10)
              const month = parseInt(parts[1], 10) - 1 // 0-indexed
              const year = parseInt(parts[2], 10)
              dateObj = new Date(year, month, day)
            } else {
              // Try parsing as date (handles various formats)
              dateObj = new Date(dateValue)
            }
            
            if (!isNaN(dateObj.getTime())) {
              // Format as YYYY-MM-DD (date only, not timestamp)
              const year = dateObj.getFullYear()
              const month = String(dateObj.getMonth() + 1).padStart(2, '0')
              const day = String(dateObj.getDate()).padStart(2, '0')
              reservationDate = `${year}-${month}-${day}`
            } else {
              reservationDate = dateValue // Keep original if parsing fails
            }
          } catch (e) {
            reservationDate = dateValue // Keep original if parsing fails
          }
        }
      }

      reservationData._reservationDate = reservationDate
      reservationData._headers = headers

      // Include row if it has at least one non-empty value
      if (values.some(v => v && v.trim())) {
        reservations.push(reservationData)
      }
    }

    return NextResponse.json({ 
      reservations,
      reservationLink,
      headers,
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

