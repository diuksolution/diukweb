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

    // First row is headers - first column is "Tanggal", rest are place names
    const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim())
    
    // Find tanggal column index (should be first column, but we'll search for it)
    const tanggalIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower.includes('tanggal') || lower.includes('date') || lower === 'tanggal'
    })

    // If tanggal column not found, assume first column is tanggal
    const tanggalColIndex = tanggalIndex >= 0 ? tanggalIndex : 0

    // Place names are all columns except tanggal column
    const placeNames = headers.filter((_, index) => index !== tanggalColIndex)

    // Parse data rows
    const placesData: Record<string, Record<string, number>> = {}
    const dates: string[] = []

    // Initialize places data structure
    placeNames.forEach(place => {
      placesData[place] = {}
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

      // Process each place column
      placeNames.forEach((place, placeIndex) => {
        // Calculate actual column index (accounting for tanggal column position)
        const actualColIndex = placeIndex < tanggalColIndex ? placeIndex : placeIndex + 1
        
        if (values.length > actualColIndex) {
          const value = values[actualColIndex]?.trim() || '0'
          // Try to parse as number
          const numValue = parseFloat(value) || 0
          placesData[place][normalizedDate] = numValue
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
    const places = placeNames.map(placeName => ({
      name: placeName,
      availability: normalizedDates.map(date => ({
        date,
        available: placesData[placeName][date] || 0,
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

