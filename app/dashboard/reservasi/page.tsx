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
      
      // Try DD/MM/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateOnly)) {
        const [day, month, year] = dateOnly.split('/')
        date = new Date(`${year}-${month}-${day}`)
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
