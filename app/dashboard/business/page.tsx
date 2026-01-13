'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BusinessData {
  id: string
  nama: string
  linkdata: string | null
  prompt: string | null
  idDriveGambarMenu: string | null
  createdAt: string
  updatedAt: string
}

export default function BusinessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    linkdata: '',
    prompt: '',
    idDriveGambarMenu: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sheets, setSheets] = useState<{ id: string; title: string }[]>([])
  const [menuSheetId, setMenuSheetId] = useState<string>('') // untuk data menu / customer
  const [reservationSheetId, setReservationSheetId] = useState<string>('') // untuk data reservasi
  const [tempatSheetId, setTempatSheetId] = useState<string>('') // untuk data tempat
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const [sheetsError, setSheetsError] = useState<string | null>(null)

  useEffect(() => {
    fetchBusiness()
  }, [])

  const fetchBusiness = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/business')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch business data')
      }
      const data = await response.json()
      setBusiness(data)
      setFormData({
        nama: data.nama || '',
        linkdata: data.linkdata || '',
        prompt: data.prompt || '',
        idDriveGambarMenu: data.idDriveGambarMenu || '',
      })

      // If linkdata already has a spreadsheet, try to load sheets
      if (data.linkdata) {
        await loadSheets(data.linkdata)

        // If linkdata contains gid / reservasiGid / tempatGid, preselect that sheet(s)
        const gidMatch = data.linkdata.match(/[#&]gid=(\d+)/)
        const reservGidMatch = data.linkdata.match(/[#&]reservasiGid=(\d+)/)
        const tempatGidMatch = data.linkdata.match(/[#&]tempatGid=(\d+)/)
        if (gidMatch) setMenuSheetId(gidMatch[1])
        if (reservGidMatch) setReservationSheetId(reservGidMatch[1])
        if (tempatGidMatch) setTempatSheetId(tempatGidMatch[1])
      }
    } catch (error) {
      console.error('Error fetching business:', error)
      setError('Gagal memuat data business')
    } finally {
      setLoading(false)
    }
  }

  const extractSpreadsheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  const buildSheetUrl = (baseUrl: string, menuId: string, reservId: string, tempatId: string): string => {
    const spreadsheetId = extractSpreadsheetId(baseUrl)
    if (!spreadsheetId) return baseUrl
    const params: string[] = []
    if (menuId) params.push(`gid=${menuId}`)
    if (reservId) params.push(`reservasiGid=${reservId}`)
    if (tempatId) params.push(`tempatGid=${tempatId}`)
    const hash = params.join('&')
    return hash
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#${hash}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  }

  const loadSheets = async (link: string) => {
    if (!link) return
    try {
      setSheetsLoading(true)
      setSheetsError(null)

      const response = await fetch('/api/business/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkdata: link }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil daftar sheet')
      }

      setSheets(data.sheets || [])

      // If no sheet selected yet and we have at least one sheet, preselect
      if (data.sheets && data.sheets.length > 0) {
        if (!menuSheetId) {
          setMenuSheetId(data.sheets[0].id)
        }
        if (!reservationSheetId) {
          const second = data.sheets[1]?.id ?? data.sheets[0].id
          setReservationSheetId(second)
        }
        if (!tempatSheetId) {
          const third = data.sheets[2]?.id ?? data.sheets[0].id
          setTempatSheetId(third)
        }
      }
    } catch (err: any) {
      console.error('Error loading sheets:', err)
      setSheetsError(err.message || 'Gagal mengambil daftar sheet')
      setSheets([])
    } finally {
      setSheetsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // If user selected specific sheets, normalize linkdata to URL yang menyimpan semua sheet IDs
      let linkdataToSave = formData.linkdata
      if (formData.linkdata && (menuSheetId || reservationSheetId || tempatSheetId)) {
        linkdataToSave = buildSheetUrl(formData.linkdata, menuSheetId, reservationSheetId, tempatSheetId)
      }

      const payload = { ...formData, linkdata: linkdataToSave }
      console.log('Sending update payload:', payload)
      
      const response = await fetch('/api/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal mengupdate business')
      }

      const updatedBusiness = await response.json()
      console.log('Received updated business:', updatedBusiness)
      setBusiness(updatedBusiness)
      setFormData({
        nama: updatedBusiness.nama || '',
        linkdata: updatedBusiness.linkdata || '',
        prompt: updatedBusiness.prompt || '',
        idDriveGambarMenu: updatedBusiness.idDriveGambarMenu || '',
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error updating business:', error)
      setError(error.message || 'Gagal mengupdate business')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
            <p className="text-gray-500 text-center py-12">Memuat data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="">
        {/* Header with gradient */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#303d83] via-[#14b8a6] to-[#84cc16]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] bg-clip-text text-transparent">
                Business Management
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                Kelola informasi dan pengaturan business Anda
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-center gap-3 animate-shake">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-green-50 border-2 border-green-200 p-4 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-green-600">Business berhasil diupdate!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                  Informasi Business
                </p>
                <h2 className="text-2xl font-bold text-gray-900">Data Business</h2>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#303d83]/10 via-[#14b8a6]/10 to-[#84cc16]/10 border border-[#303d83]/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-[#303d83]">Active</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="nama" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Nama Business <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nama"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300"
                  placeholder="Masukkan nama business"
                />
              </div>

              <div>
                <label htmlFor="linkdata" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link Data Spreadsheet
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="linkdata"
                    value={formData.linkdata}
                    onChange={(e) => {
                      setFormData({ ...formData, linkdata: e.target.value })
                      setSheets([])
                      setMenuSheetId('')
                      setReservationSheetId('')
                      setTempatSheetId('')
                      setSheetsError(null)
                    }}
                    onBlur={() => {
                      if (formData.linkdata) {
                        loadSheets(formData.linkdata)
                      }
                    }}
                    className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Link ke Google Spreadsheet yang berisi data customer. Setelah diisi, sistem akan membaca daftar sheet di spreadsheet tersebut.
                </p>

                {sheetsLoading && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#303d83]">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium">Mengambil daftar sheet...</span>
                  </div>
                )}

                {sheetsError && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{sheetsError}</span>
                  </div>
                )}

                {sheets.length > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-[#303d83]/5 via-[#14b8a6]/5 to-[#84cc16]/5 border border-[#303d83]/10">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-semibold text-gray-900">Pilih Sheet Configuration</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Sheet Menu
                        </label>
                        <select
                          value={menuSheetId}
                          onChange={(e) => setMenuSheetId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all text-sm hover:border-gray-300"
                        >
                          {sheets.map((sheet) => (
                            <option key={sheet.id} value={sheet.id}>
                              {sheet.title || `Sheet ${sheet.id}`}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Data menu
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Sheet Reservasi
                        </label>
                        <select
                          value={reservationSheetId}
                          onChange={(e) => setReservationSheetId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all text-sm hover:border-gray-300"
                        >
                          {sheets.map((sheet) => (
                            <option key={sheet.id} value={sheet.id}>
                              {sheet.title || `Sheet ${sheet.id}`}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Data customer
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Sheet Tempat
                        </label>
                        <select
                          value={tempatSheetId}
                          onChange={(e) => setTempatSheetId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all text-sm hover:border-gray-300"
                        >
                          {sheets.map((sheet) => (
                            <option key={sheet.id} value={sheet.id}>
                              {sheet.title || `Sheet ${sheet.id}`}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Data tempat
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="idDriveGambarMenu" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  ID Drive Gambar Menu
                </label>
                <input
                  type="text"
                  id="idDriveGambarMenu"
                  value={formData.idDriveGambarMenu}
                  onChange={(e) => setFormData({ ...formData, idDriveGambarMenu: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300"
                  placeholder="Masukkan ID Drive gambar menu"
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ID dari Google Drive yang berisi gambar menu untuk business ini.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  AI Prompt Configuration
                </label>
                <div className="flex items-start gap-3">
                  <div className="flex-1 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 min-h-[100px] hover:border-gray-300 transition-all">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}>
                      {formData.prompt ? formData.prompt.slice(0, 100) + '........' : <span className="text-gray-400 italic">Belum ada prompt</span>}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/business/prompt"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl flex-shrink-0 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Prompt
                  </Link>
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Prompt yang akan digunakan untuk AI agent business ini.
                </p>
              </div>
            </div>
          </div>

          {business && (
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10">
                  <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                    Informasi Tambahan
                  </p>
                  <h3 className="text-xl font-bold text-gray-900">Detail Business</h3>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 hover:border-[#303d83]/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="text-xs font-semibold text-gray-500">Business ID</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 break-all">{business.id}</p>
                </div>
                <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 hover:border-[#303d83]/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-semibold text-gray-500">Dibuat Pada</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(business.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 hover:border-[#303d83]/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-gray-500">Terakhir Diupdate</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(business.updatedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

