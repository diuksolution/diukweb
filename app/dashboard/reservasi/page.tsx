'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Reservation {
  index: number
  _reservationDate: string | null
  _headers: string[]
  [key: string]: any
}

export default function ReservasiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationLink, setReservationLink] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [page, setPage] = useState<number>(1)

  const ROWS_PER_PAGE = 20

  const getColWidth = (header: string) => {
    const h = (header || '').toLowerCase()
    if (h.includes('tanggal') || h.includes('date') || h.includes('tgl')) return 100
    if (h.includes('nama') || h.includes('name')) return 100
    if (h.includes('alamat') || h.includes('address')) return 50
    if (h.includes('telepon') || h.includes('phone') || h.includes('hp') || h.includes('wa')) return 50
    if (h.includes('email')) return 50
    if (h.includes('catatan') || h.includes('notes') || h.includes('keterangan')) return 105
    if (h.includes('menu yang dipesan') || h.includes('quantity')) return 250
    if (h.includes('jumlah orang') || h.includes('people')) return 10
    return 70
  }

  const shouldWrapCell = (header: string) => {
    const h = (header || '').toLowerCase()
    return (
      h.includes('menu yang dipesan') ||
      h.includes('nama') ||
      h.includes('tempat') ||
      h.includes('menu') ||
      h.includes('catatan') ||
      h.includes('notes') ||
      h.includes('keterangan') ||
      h.includes('alamat') ||
      h.includes('address')
    )
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/reservasi')
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        let errorMsg = data.error || 'Failed to fetch reservations'
        if (data.instructions && Array.isArray(data.instructions)) {
          errorMsg += '\n\nCara memperbaiki:\n' + data.instructions.map((inst: string, idx: number) => `${idx + 1}. ${inst}`).join('\n')
        }
        setError(errorMsg)
        return
      }
      
      setReservations(data.reservations || [])
      setReservationLink(data.reservationLink || '')
      setHeaders(data.headers || [])
    } catch (error: any) {
      console.error('Error fetching reservations:', error)
      setError(error.message || 'Gagal memuat data reservasi')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to normalize date to YYYY-MM-DD format
  const normalizeDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null
    
    // Remove time part if exists (split by space)
    const dateOnly = dateStr.split(' ')[0].trim()
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return dateOnly
    }
    
    // Try to parse as Date object and convert to YYYY-MM-DD
    try {
      // Try parsing various formats
      let date: Date
      
      // Try DD/MM/YYYY or DD-MM-YYYY format (common in ID locale)
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateOnly)) {
        const parts = dateOnly.split(/[\/\-]/)
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // 0-indexed
        const year = parseInt(parts[2], 10)
        date = new Date(year, month, day)
      } else {
        // Try parsing as ISO string or other formats
        date = new Date(dateOnly)
      }
      
      if (isNaN(date.getTime())) return null
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      return `${year}-${month}-${day}`
    } catch {
      return null
    }
  }

  // Filter reservations by date range
  const filteredReservations = (startDate || endDate)
    ? reservations.filter(res => {
        if (!res._reservationDate) return false
        
        // Normalize reservation date to YYYY-MM-DD format
        const resDateNormalized = normalizeDate(res._reservationDate)
        if (!resDateNormalized) return false
        
        // If both dates are provided, check if reservation date is within range
        if (startDate && endDate) {
          return resDateNormalized >= startDate && resDateNormalized <= endDate
        }
        
        // If only start date is provided, check if reservation date is >= start date
        if (startDate && !endDate) {
          return resDateNormalized >= startDate
        }
        
        // If only end date is provided, check if reservation date is <= end date
        if (!startDate && endDate) {
          return resDateNormalized <= endDate
        }
        
        return true
      })
    : reservations

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [startDate, endDate])

  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / ROWS_PER_PAGE))

  // Clamp page if data changes (e.g., filter reduces result count)
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const paginatedReservations = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE
    return filteredReservations.slice(start, start + ROWS_PER_PAGE)
  }, [filteredReservations, page])

  const paginationPages = useMemo(() => {
    const maxButtons = 5
    const pages: number[] = []
    const half = Math.floor(maxButtons / 2)
    let start = Math.max(1, page - half)
    let end = Math.min(totalPages, start + maxButtons - 1)
    start = Math.max(1, end - maxButtons + 1)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }, [page, totalPages])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      if (isNaN(date.getTime())) return dateStr
      // Format DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const findHeader = (allHeaders: string[], keywords: string[]) => {
    const lowered = allHeaders.map((h) => ({ original: h, lower: (h || '').toLowerCase() }))
    for (const kw of keywords) {
      const needle = kw.toLowerCase()
      const found = lowered.find((h) => h.lower.includes(needle))
      if (found) return found.original
    }
    return null
  }

  const normalizeMenuName = (name: string) => {
    return String(name || '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const parseMenuQtyFromLine = (rawLine: string): { menu: string; qty: number } | null => {
    const line = normalizeMenuName(rawLine)
    if (!line) return null

    // Special case: Google Sheets format like:
    // "Baileys Coffee-Reguler-1-" / "Cendol Creme-Large-2-"
    // Newer format also appears as:
    // "Spaghetti Creamy Mushroom-Normal-7(mantao)" / "Hazeloats Crumble-Large-4(less)"
    // We interpret it as menu = "Baileys Coffee-Reguler" and qty = 1.
    const dashParts = line
      .split('-')
      .map((p) => p.trim())
      .filter(Boolean)
    if (dashParts.length >= 2) {
      const last = dashParts[dashParts.length - 1]
      const mQty = /^(\d+)(?:\([^)]*\))?$/.exec(last) // supports "7" or "7(mantao)"
      if (mQty) {
        const qty = Number(mQty[1])
        const menu = normalizeMenuName(dashParts.slice(0, -1).join('-'))
        if (menu) return { menu, qty: qty > 0 ? qty : 1 }
      }
    }

    // Patterns we support (examples):
    // - "Aren Signature - Reguler x 2"
    // - "Aren Signature - Reguler (2)"
    // - "Aren Signature - Reguler: 2"
    // - "Aren Signature - Reguler  2" (2+ spaces before number)
    // - "2x Aren Signature - Reguler"
    const patterns: Array<{
      re: RegExp
      map: (m: RegExpExecArray) => { menu: string; qty: number }
    }> = [
      {
        re: /^\s*(\d+)\s*(?:x|\*|×)\s*(.+)\s*$/i,
        map: (m) => ({ qty: Number(m[1]), menu: normalizeMenuName(m[2]) }),
      },
      {
        re: /^\s*(.+?)\s*(?:x|\*|×)\s*(\d+)\s*$/i,
        map: (m) => ({ menu: normalizeMenuName(m[1]), qty: Number(m[2]) }),
      },
      {
        re: /^\s*(.+?)\s*[\(\[]\s*(\d+)\s*[\)\]]\s*$/i,
        map: (m) => ({ menu: normalizeMenuName(m[1]), qty: Number(m[2]) }),
      },
      {
        re: /^\s*(.+?)\s*(?:=|:|-)\s*(\d+)\s*$/i,
        map: (m) => ({ menu: normalizeMenuName(m[1]), qty: Number(m[2]) }),
      },
      {
        re: /^\s*(.+?\D)\s{2,}(\d+)\s*$/i,
        map: (m) => ({ menu: normalizeMenuName(m[1]), qty: Number(m[2]) }),
      },
    ]

    for (const p of patterns) {
      const m = p.re.exec(line)
      if (m) {
        const parsed = p.map(m)
        const qty = Number.isFinite(parsed.qty) && parsed.qty > 0 ? parsed.qty : 1
        const menu = normalizeMenuName(parsed.menu)
        if (!menu) return null
        return { menu, qty }
      }
    }

    // Fallback: treat the entire line as one menu with qty=1
    return { menu: line, qty: 1 }
  }

  const buildMenuRecapRows = () => {
    // Find columns for menu and (optional) qty
    const headerMenu = findHeader(headers, ['menu yang dipesan', 'menu', 'pesanan', 'order'])
    const headerJumlahOrang = findHeader(headers, ['jumlah orang', 'orang', 'people', 'pax'])
    let headerQty = findHeader(headers, ['qty', 'quantity', 'jumlah menu', 'jumlah pesanan', 'jumlah order'])
    if (headerQty && headerQty === headerJumlahOrang) headerQty = null

    const agg = new Map<string, { tanggalIso: string; tanggalDisplay: string; menu: string; jumlah: number }>()

    for (const r of filteredReservations) {
      const tanggalIso = r._reservationDate ? (normalizeDate(r._reservationDate) || r._reservationDate) : ''
      const tanggalDisplay = tanggalIso ? formatDate(tanggalIso) : '-'
      const rawMenu = headerMenu ? String(r[headerMenu] || '') : ''
      const rawQty = headerQty ? String(r[headerQty] || '') : ''
      const qtyFromColumn = rawQty && /^\d+$/.test(rawQty.trim()) ? Number(rawQty.trim()) : null

      // Split menu field into items. Your format uses comma-separated items like:
      // "Baileys Coffee-Reguler-1-, Almond Harmony-Large-1-"
      const expanded = String(rawMenu || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split(/[\n,;|•]+/g)
        .map((s) => s.trim())
        .filter(Boolean)

      if (expanded.length === 0) continue

      // If no qty can be parsed from text, and there is a qty column, apply it to the single menu item.
      if (expanded.length === 1 && qtyFromColumn && qtyFromColumn > 0) {
        const parsed = parseMenuQtyFromLine(expanded[0])
        if (!parsed) continue
        const key = `${tanggalIso || tanggalDisplay}||${parsed.menu.toLowerCase()}`
        const existing = agg.get(key)
        const jumlah = qtyFromColumn
        if (existing) existing.jumlah += jumlah
        else agg.set(key, { tanggalIso: tanggalIso || tanggalDisplay, tanggalDisplay, menu: parsed.menu, jumlah })
        continue
      }

      for (const line of expanded) {
        const parsed = parseMenuQtyFromLine(line)
        if (!parsed) continue
        const key = `${tanggalIso || tanggalDisplay}||${parsed.menu.toLowerCase()}`
        const existing = agg.get(key)
        if (existing) existing.jumlah += parsed.qty
        else agg.set(key, { tanggalIso: tanggalIso || tanggalDisplay, tanggalDisplay, menu: parsed.menu, jumlah: parsed.qty })
      }
    }

    const rows = Array.from(agg.values())
      .filter((r) => r.menu && Number.isFinite(r.jumlah) && r.jumlah > 0)
      .sort((a, b) => {
        // Sort by ISO date then menu name
        if (a.tanggalIso === b.tanggalIso) return a.menu.localeCompare(b.menu)
        return a.tanggalIso.localeCompare(b.tanggalIso)
      })
      .map((r) => [r.tanggalDisplay, r.menu, String(r.jumlah)])

    return rows
  }

  const buildPdfRows = () => {
    // Try to map dynamic sheet headers into the fixed columns user wants
    const headerNama = findHeader(headers, ['nama', 'name'])
    const headerJumlahOrang = findHeader(headers, ['jumlah orang', 'orang', 'people', 'pax'])
    const headerTempat = findHeader(headers, ['tempat', 'lokasi', 'table', 'ruangan'])
    const headerJam = findHeader(headers, ['jam', 'waktu', 'time'])
    const headerMenu = findHeader(headers, ['menu yang dipesan', 'menu', 'pesanan', 'order'])
    const headerCatatan = findHeader(headers, ['catatan', 'notes', 'keterangan'])

    const rows = filteredReservations.map((r) => {
      const tanggal = r._reservationDate ? formatDate(r._reservationDate) : '-'
      const nama = headerNama ? String(r[headerNama] || '') : ''
      const jumlahOrang = headerJumlahOrang ? String(r[headerJumlahOrang] || '') : ''
      const tempat = headerTempat ? String(r[headerTempat] || '') : ''
      const jam = headerJam ? String(r[headerJam] || '') : ''
      const menu = headerMenu ? String(r[headerMenu] || '') : ''
      const catatan = headerCatatan ? String(r[headerCatatan] || '') : ''

      return [
        tanggal || '-',
        nama || '-',
        jumlahOrang || '-',
        tempat || '-',
        jam || '-',
        menu || '-',
        catatan || '-',
      ]
    })

    return rows
  }

  const downloadFilteredPdf = async () => {
    try {
      if (filteredReservations.length === 0) return

      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])
      const autoTable: any = (autoTableMod as any).default || autoTableMod

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      })

      const title = 'Laporan Reservasi'
      const rangeLabel =
        startDate && endDate
          ? `Periode: ${formatDate(startDate)} – ${formatDate(endDate)}`
          : startDate
            ? `Dari: ${formatDate(startDate)}`
            : endDate
              ? `Sampai: ${formatDate(endDate)}`
              : 'Periode: Semua'

      doc.setFontSize(14)
      doc.text(title, 40, 40)
      doc.setFontSize(10)
      doc.text(rangeLabel, 40, 60)

      const head = [[
        'Tanggal',
        'Nama',
        'Jumlah Orang',
        'Tempat',
        'Jam',
        'Menu yang dipesan',
        'Catatan',
      ]]
      const body = buildPdfRows()

      autoTable(doc, {
        startY: 80,
        head,
        body,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'top',
        },
        headStyles: {
          fillColor: [48, 61, 131],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 70 }, // tanggal
          1: { cellWidth: 90 }, // nama
          2: { cellWidth: 70, halign: 'center' }, // jumlah orang
          3: { cellWidth: 90 }, // tempat
          4: { cellWidth: 55, halign: 'center' }, // jam
          5: { cellWidth: 240 }, // menu
          6: { cellWidth: 170 }, // catatan
        },
        margin: { left: 40, right: 40 },
      })

      // Rekapan per menu (Tanggal | Menu | Jumlah)
      const recapBody = buildMenuRecapRows()
      if (recapBody.length > 0) {
        const lastY =
          ((doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) ? (doc as any).lastAutoTable.finalY : 80

        doc.setFontSize(12)
        doc.text('Rekapan per Menu', 40, lastY + 28)

        const recapHead = [[
          'Tanggal',
          'Menu',
          'Jumlah',
        ]]

        autoTable(doc, {
          startY: lastY + 40,
          head: recapHead,
          body: recapBody,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 4,
            overflow: 'linebreak',
            valign: 'top',
          },
          headStyles: {
            fillColor: [20, 184, 166],
            textColor: 255,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 90 }, // tanggal
            1: { cellWidth: 520 }, // menu
            2: { cellWidth: 70, halign: 'right' }, // jumlah
          },
          margin: { left: 40, right: 40 },
        })
      }

      const safeStart = startDate || 'all'
      const safeEnd = endDate || 'all'
      doc.save(`reservasi_${safeStart}_${safeEnd}.pdf`)
    } catch (e: any) {
      console.error('Failed to generate PDF', e)
      setError('Gagal membuat PDF. Coba refresh halaman lalu coba lagi.')
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 w-full max-w-full box-border min-w-0 overflow-x-hidden">
      <div className="relative w-full max-w-full box-border min-w-0 overflow-x-hidden">
        {/* Header with gradient */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-linear-to-br from-[#303d83] via-[#14b8a6] to-[#84cc16]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] bg-clip-text text-transparent">
                Reservasi Management
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                Kelola dan lihat daftar reservasi 
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3 animate-shake">
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600 whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {/* Reservation Table */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
          <div className="mb-6 flex flex-col gap-6">
            {/* Header with Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-linear-to-br from-[#303d83]/10 to-[#14b8a6]/10">
                  <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                    Reservation Database
                  </p>
                  <h2 className="text-xl font-bold text-gray-900">Daftar Reservasi</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-linear-to-r from-[#303d83]/10 via-[#14b8a6]/10 to-[#84cc16]/10 border border-[#303d83]/20">
                  <span className="text-xs font-semibold text-[#303d83]">
                    {filteredReservations.length} dari {reservations.length} Reservasi
                  </span>
                </div>
                <button
                  type="button"
                  onClick={downloadFilteredPdf}
                  disabled={loading || filteredReservations.length === 0}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download PDF dari data yang sedang ter-filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v10m0 0l3-3m-3 3L9 10m10 4v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={fetchReservations}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#303d83] bg-[#303d83]/10 hover:bg-[#303d83]/20 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full flex-wrap min-w-0">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dari Tanggal</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setStartDate(newStartDate)
                      // If end date is before start date, clear end date
                      if (endDate && newStartDate > endDate) {
                        setEndDate('')
                      }
                    }}
                    max={endDate || undefined}
                    className="px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300 text-sm"
                  />
                </div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sampai Tanggal</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      const newEndDate = e.target.value
                      setEndDate(newEndDate)
                      // If start date is after end date, clear start date
                      if (startDate && newEndDate < startDate) {
                        setStartDate('')
                      }
                    }}
                    min={startDate || undefined}
                    className="px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300 text-sm"
                  />
                </div>
              </div>
              {(startDate || endDate) && (
                <>
                  <button
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="px-3 py-2 items-bottom rounded-lg text-xs font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-1 mt-6 sm:mt-0"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Memuat data reservasi...</span>
              </div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="p-3 rounded-full bg-gray-100">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">
                  {(startDate || endDate) ? 'Tidak ada reservasi pada rentang tanggal yang dipilih' : 'Tidak ada reservasi ditemukan'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-x-auto w-full" style={{ maxWidth: '100%' }}>
              <table className="divide-y divide-gray-200 table-fixed" style={{ minWidth: 'max-content', width: 'max-content' }}>
                <colgroup>
                  <col style={{ width: 56 }} />
                  {headers.map((header, idx) => (
                    <col key={idx} style={{ width: getColWidth(header) }} />
                  ))}
                </colgroup>
                <thead className="bg-linear-to-r from-gray-50 to-white">
                  <tr>
                    <th className="p-3 text-center text-[12px] font-semibold text-gray-700 uppercase">
                      No
                    </th>
                    {headers.map((header, idx) => (
                      <th key={idx} className="p-3 text-center text-[12px] font-semibold text-gray-700 uppercase">
                        <div
                          className={`w-full ${shouldWrapCell(header) ? 'whitespace-normal wrap-break-word' : 'truncate'}`}
                          title={header}
                        >
                          {header}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedReservations.map((reservation, idx) => (
                    <tr key={reservation.index} className="hover:bg-linear-to-r hover:from-[#303d83]/5 hover:via-[#14b8a6]/5 hover:to-[#84cc16]/5 transition-all duration-200">
                      <td className="p-3 text-center">
                        <span className="text-[12px] font-semibold text-gray-500">
                          {(page - 1) * ROWS_PER_PAGE + idx + 1}
                        </span>
                      </td>
                      {headers.map((header, headerIdx) => {
                        const value = reservation[header] || ''
                        // Highlight date column if it's the reservation date
                        const isDateColumn = reservation._reservationDate && 
                          header.toLowerCase().includes('tanggal') || 
                          header.toLowerCase().includes('date') ||
                          header.toLowerCase().includes('tgl')
                        
                        return (
                          <td
                            key={headerIdx}
                            className={`p-3 align-top ${shouldWrapCell(header) ? 'text-left' : 'text-center'}`}
                          >
                            {isDateColumn && reservation._reservationDate ? (
                              <div className="w-full truncate text-[12px] font-semibold text-gray-900" title={formatDate(reservation._reservationDate)}>
                                {formatDate(reservation._reservationDate)}
                              </div>
                            ) : (
                              <div
                                className={`w-full text-[12px] text-gray-700 ${
                                  shouldWrapCell(header)
                                    ? 'whitespace-normal wrap-break-word leading-snug'
                                    : 'truncate'
                                }`}
                                title={value || ''}
                              >
                                {value || <span className="text-gray-400">-</span>}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gray-200 px-3 py-3 bg-white">
                <div className="text-xs text-gray-600">
                  Menampilkan{' '}
                  <span className="font-semibold text-gray-900">
                    {filteredReservations.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1}
                  </span>
                  {' '}–{' '}
                  <span className="font-semibold text-gray-900">
                    {Math.min(page * ROWS_PER_PAGE, filteredReservations.length)}
                  </span>
                  {' '}dari{' '}
                  <span className="font-semibold text-gray-900">{filteredReservations.length}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {paginationPages.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-8 px-2 py-1.5 rounded-lg text-xs font-semibold border ${
                          p === page
                            ? 'border-[#303d83] bg-[#303d83]/10 text-[#303d83]'
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
