import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - Get tempat data from Google Sheets
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

    // Extract gid for tempat sheet:
    // - Kalau ada tempatGid → pakai itu
    // - Kalau tidak ada, fallback ke '0'
    const tempatGidMatch = spreadsheetUrl.match(/[#&]tempatGid=(\d+)/)
    const gid = tempatGidMatch ? tempatGidMatch[1] : '0'

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
      return NextResponse.json({ places: [], dates: [] })
    }

    // First row is headers - one column should be "Tanggal", the rest are place names
    // Note: some header cells can be empty; those columns should be skipped.
    const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim())
    
    // Find tanggal column index (should be first column, but we'll search for it)
    const tanggalIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower.includes('tanggal') || lower.includes('date') || lower === 'tanggal'
    })

    // If tanggal column not found, assume first column is tanggal
    const tanggalColIndex = tanggalIndex >= 0 ? tanggalIndex : 0

    // Place columns: all columns except tanggal column, and skip empty headers
    const placeColumns = headers
      .map((name, index) => ({ name: name.trim(), index }))
      .filter(({ name, index }) => index !== tanggalColIndex && name.length > 0)

    // Parse data rows
    const placesData: Record<string, Record<string, string | number>> = {}
    const dates: string[] = []

    // Initialize places data structure
    placeColumns.forEach(({ name }) => {
      placesData[name] = {}
    })

    // Process data rows (skip header row)
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].map(v => v.replace(/^"|"$/g, '').trim())
      
      if (values.length <= tanggalColIndex) continue

      const tanggal = values[tanggalColIndex]?.trim() || ''
      
      if (!tanggal) continue

      // Normalize date format - handle various date formats from Google Sheets
      let normalizedDate = tanggal
      try {
        // Try parsing as date string (handles formats like "2024-01-15", "1/15/2024", etc.)
        let dateObj: Date
        
        // Check if it's already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
          dateObj = new Date(tanggal + 'T00:00:00')
        } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(tanggal.trim())) {
          // Handle DD/MM/YYYY or DD-MM-YYYY (common in ID locale)
          const parts = tanggal.trim().split(/[\/\-]/)
          const day = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10) - 1 // 0-indexed
          const year = parseInt(parts[2], 10)
          dateObj = new Date(year, month, day)
        } else {
          // Try parsing as date (handles various formats)
          dateObj = new Date(tanggal)
        }
        
        if (!isNaN(dateObj.getTime())) {
          // Format as YYYY-MM-DD
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          normalizedDate = `${year}-${month}-${day}`
        }
      } catch (e) {
        // Keep original if parsing fails
        console.warn(`Failed to parse date: ${tanggal}`, e)
      }

      if (!dates.includes(normalizedDate)) {
        dates.push(normalizedDate)
      }

      // Process each place column (use original column index so skipping empty headers won't shift mapping)
      placeColumns.forEach(({ name, index: colIndex }) => {
        if (values.length > colIndex) {
          const raw = values[colIndex]?.trim() ?? ''

          // If the cell contains a number, keep as number for backward compatibility.
          // Otherwise keep the string as-is (e.g. "Tersedia" / "Tidak Tersedia").
          const looksNumeric = /^-?\d+(\.\d+)?$/.test(raw)
          if (looksNumeric) {
            const numValue = parseFloat(raw)
            placesData[name][normalizedDate] = Number.isFinite(numValue) ? numValue : raw
          } else {
            placesData[name][normalizedDate] = raw
          }
        }
      })
    }

    // Sort dates and ensure they're in YYYY-MM-DD format
    dates.sort()
    
    // Ensure all dates are properly formatted as YYYY-MM-DD
    const normalizedDates = dates.map(date => {
      try {
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date
        }
        // Otherwise, parse and normalize
        const dateObj = new Date(date)
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        return date
      } catch {
        return date
      }
    })

    // Format response - ensure dates in availability are also normalized
    const places = placeColumns.map(({ name }) => ({
      name,
      availability: normalizedDates.map(date => ({
        date,
        available: placesData[name][date] ?? '',
      })),
    }))

    return NextResponse.json({ 
      places,
      dates: normalizedDates,
      rawData: placesData, // Include raw data for debugging
    })
  } catch (error) {
    console.error('Error fetching tempat data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

