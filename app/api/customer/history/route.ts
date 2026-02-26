import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - Get customer history (reservations) by ID WA
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const idWa = searchParams.get('idWa')

    if (!idWa) {
      return NextResponse.json({ error: 'ID WA is required' }, { status: 400 })
    }

    const spreadsheetUrl = dbUser.business.linkdata

    // Extract spreadsheet ID from URL
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid spreadsheet URL' }, { status: 400 })
    }

    const spreadsheetId = match[1]

    // Extract gid for reservation sheet
    const reservGidMatch = spreadsheetUrl.match(/[#&]reservasiGid=(\d+)/)
    const gidMatch = spreadsheetUrl.match(/[#&]gid=(\d+)/)
    const gid = reservGidMatch ? reservGidMatch[1] : gidMatch ? gidMatch[1] : '0'

    // Fetch CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch reservation data' }, { status: 400 })
    }

    const csvText = await response.text()
    
    // Parse CSV
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
            if (currentRow.some(field => field !== '')) {
              rows.push(currentRow)
            }
            currentRow = []
            current = ''
          }
          if (char === '\r' && nextChar === '\n') {
            i++
          }
        } else {
          current += char
        }
      }
      
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
      return NextResponse.json({ reservations: [], menus: [] })
    }

    const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim())
    
    // Find column indices
    const idWaIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower.includes('id wa') || lower.includes('id. wa') || lower === 'id wa'
    })
    
    const namaIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return (lower.includes('nama') || lower.includes('tt nama') || lower === 'nama') && 
             !lower.includes('jumlah')
    })

    const menuIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower.includes('menu') || lower.includes('pesanan')
    })

    const dateIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower.includes('tanggal') || lower.includes('date') || lower.includes('tgl')
    })

    // Filter reservations by ID WA
    const reservations: any[] = []
    const menuCountMap = new Map<string, number>()
    
    // Helper function to parse menu and extract name and quantity
    const parseMenu = (menuText: string): Array<{ name: string, quantity: number }> => {
      const results: Array<{ name: string, quantity: number }> = []
      
      // Split by comma first
      const items = menuText.split(',').map(item => item.trim()).filter(item => item)
      
      for (const item of items) {
        // Try to extract quantity from patterns like:
        // "Aren Signature: 1"
        // "Baileys Coffee 2 Reguler"
        // "Cheesecake: 1"
        
        // Pattern 1: "Menu Name: quantity"
        const colonMatch = item.match(/^(.+?):\s*(\d+)$/i)
        if (colonMatch) {
          const name = colonMatch[1].trim()
          const quantity = parseInt(colonMatch[2], 10)
          results.push({ name, quantity })
          continue
        }
        
        // Pattern 2: "Menu Name quantity" (number at the end or middle)
        const numberMatch = item.match(/^(.+?)\s+(\d+)(?:\s+\w+)?$/i)
        if (numberMatch) {
          const name = numberMatch[1].trim()
          const quantity = parseInt(numberMatch[2], 10)
          results.push({ name, quantity })
          continue
        }
        
        // Pattern 3: Just menu name (default quantity 1)
        results.push({ name: item.trim(), quantity: 1 })
      }
      
      return results
    }
    
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].map(v => v.replace(/^"|"$/g, '').trim())
      
      if (idWaIndex >= 0 && values.length > idWaIndex) {
        const rowIdWa = values[idWaIndex]?.trim() || ''
        
        // Match ID WA (case insensitive, remove spaces)
        if (rowIdWa.toLowerCase().replace(/\s/g, '') === idWa.toLowerCase().replace(/\s/g, '')) {
          const reservationData: any = {
            index: i - 1,
          }

          // Store all column values
          headers.forEach((header, idx) => {
            reservationData[header] = values[idx] || ''
          })

          // Extract date
          let reservationDate: string | null = null
          if (dateIndex >= 0 && values.length > dateIndex) {
            const dateValue = values[dateIndex]?.trim() || ''
            if (dateValue) {
              try {
                let dateObj: Date
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
                  dateObj = new Date(dateValue)
                }
                if (!isNaN(dateObj.getTime())) {
                  const year = dateObj.getFullYear()
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                  const day = String(dateObj.getDate()).padStart(2, '0')
                  reservationDate = `${year}-${month}-${day}`
                } else {
                  reservationDate = dateValue
                }
              } catch (e) {
                reservationDate = dateValue
              }
            }
          }

          reservationData._reservationDate = reservationDate
          reservationData._headers = headers
          reservations.push(reservationData)

          // Extract and count menus
          if (menuIndex >= 0 && values.length > menuIndex) {
            const menuValue = values[menuIndex]?.trim() || ''
            if (menuValue) {
              const parsedMenus = parseMenu(menuValue)
              for (const { name, quantity } of parsedMenus) {
                // Normalize menu name (remove extra spaces, convert to title case for consistency)
                const normalizedName = name.replace(/\s+/g, ' ').trim()
                const currentCount = menuCountMap.get(normalizedName) || 0
                menuCountMap.set(normalizedName, currentCount + quantity)
              }
            }
          }
        }
      }
    }

    // Convert menu map to array format: [{ name: string, count: number }]
    const menus = Array.from(menuCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ 
      reservations,
      menus,
    })
  } catch (error) {
    console.error('Error fetching customer history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

