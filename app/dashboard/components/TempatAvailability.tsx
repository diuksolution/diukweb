'use client'

import { useEffect, useState } from 'react'

interface PlaceAvailability {
  date: string
  available: number
}

interface Place {
  name: string
  availability: PlaceAvailability[]
}

interface TempatData {
  places: Place[]
  dates: string[]
}

export default function TempatAvailability() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TempatData | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    fetchTempatData()
  }, [])

  const fetchTempatData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/tempat')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal mengambil data tempat')
      }

      const tempatData = await response.json()
      console.log('Tempat data received:', tempatData)
      setData(tempatData)

      // Set default selected date to today ONLY on first load
      if (!isInitialized) {
        const today = new Date().toISOString().split('T')[0]
        setSelectedDate(today)
        console.log('Set selected date to today:', today)
        setIsInitialized(true)
      }
    } catch (err: any) {
      console.error('Error fetching tempat data:', err)
      setError(err.message || 'Gagal memuat data tempat')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Invalid Date'
    try {
      // Handle YYYY-MM-DD format directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (isNaN(date.getTime())) return dateStr
        return date.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }
      // Try parsing as date
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr || 'Invalid Date'
    }
  }

  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
        return dateStr.trim()
      }
      
      // Try parsing as date - handle various formats
      let date: Date
      
      // Handle DD/MM/YYYY or DD-MM-YYYY format
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateStr.trim())) {
        const parts = dateStr.trim().split(/[\/\-]/)
        const day = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1 // Month is 0-indexed
        const year = parseInt(parts[2])
        date = new Date(year, month, day)
      } else {
        // Try standard date parsing
        date = new Date(dateStr)
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Failed to parse date:', dateStr)
        return dateStr.trim()
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (err) {
      console.warn('Error normalizing date:', dateStr, err)
      return dateStr.trim()
    }
  }

  const findClosestDate = (selectedDate: string, availableDates: string[]): string | null => {
    if (!selectedDate || availableDates.length === 0) return null
    
    const normalizedSelected = normalizeDate(selectedDate)
    
    // Exact match
    if (availableDates.includes(normalizedSelected)) {
      return normalizedSelected
    }
    
    // Find closest date
    const selectedTime = new Date(normalizedSelected).getTime()
    let closestDate = availableDates[0]
    let minDiff = Math.abs(new Date(availableDates[0]).getTime() - selectedTime)
    
    for (const date of availableDates) {
      const diff = Math.abs(new Date(date).getTime() - selectedTime)
      if (diff < minDiff) {
        minDiff = diff
        closestDate = date
      }
    }
    
    return closestDate
  }

  const getAvailabilityForDate = (place: Place, date: string): number => {
    if (!date) return 0
    
    const normalizedDate = normalizeDate(date)
    console.log('Looking for availability for date:', normalizedDate, 'in place:', place.name)
    console.log('Available dates in place:', place.availability.map(a => normalizeDate(a.date)))
    
    const availability = place.availability.find(a => {
      const normalized = normalizeDate(a.date)
      return normalized === normalizedDate
    })
    
    const result = availability ? availability.available : 0
    console.log('Found availability:', result)
    return result
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedDate = e.target.value // This should already be in YYYY-MM-DD format from input type="date"
    console.log('Date changed by user:', pickedDate)
    
    if (!pickedDate) {
      setSelectedDate('')
      return
    }

    // Input type="date" already returns YYYY-MM-DD format, so use it directly
    // But normalize to ensure consistency
    const normalizedPicked = normalizeDate(pickedDate)
    console.log('Normalized picked date:', normalizedPicked)
    
    // Always update immediately with the date user selected
    // Don't override user's choice with closest date - let them see what they selected
    setSelectedDate(normalizedPicked)
  }


  if (loading) {
    return (
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-[#303d83]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Memuat data tempat...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              onClick={fetchTempatData}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data || !data.places || data.places.length === 0) {
    return (
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500">Tidak ada data tempat tersedia</p>
        </div>
      </div>
    )
  }

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
        const [year, month, day] = dateStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (isNaN(date.getTime())) return dateStr
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      }
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr || ''
    }
  }

  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl p-4 hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
            Ketersediaan Tempat
          </p>
          <h3 className="text-lg font-bold text-gray-900">Data Tempat & Ketersediaan</h3>
        </div>
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10">
          <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-4">
        <label htmlFor="date-picker" className="block text-xs font-semibold text-gray-700 mb-1.5">
          Filter Tanggal
        </label>
        <div className="relative">
          <input
            id="date-picker"
            type="date"
            value={selectedDate || ''}
            onChange={handleDateChange}
            onInput={handleDateChange}
            min={data.dates.length > 0 ? data.dates[0] : undefined}
            max={data.dates.length > 0 ? data.dates[data.dates.length - 1] : undefined}
            disabled={loading}
            readOnly={false}
            className="w-full px-3 py-2 pl-10 pr-3 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300 text-sm"
            style={{ 
              fontSize: '14px',
              WebkitAppearance: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          />
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        {selectedDate && (
          <p className="mt-1.5 text-xs text-gray-600">
            <span className="font-semibold text-[#303d83]">{formatDateShort(selectedDate)}</span>
          </p>
        )}
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-3 gap-3">
        {data.places.map((place) => {
          const available = getAvailabilityForDate(place, selectedDate)
          const isAvailable = available > 0
          
          return (
            <div
              key={place.name}
              className={`rounded-lg border-2 p-3 transition-all duration-200 ${
                isAvailable
                  ? 'border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-md hover:border-green-300'
                  : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:shadow-md hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{place.name}</h4>
                <div className={`flex-shrink-0 ml-1 ${isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold ${isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                  {available}
                </span>
                <span className="text-xs text-gray-500">tersedia</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Tempat</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{data.places.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</p>
            <p className="text-xs font-semibold text-[#303d83] mt-0.5">{formatDateShort(selectedDate)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

