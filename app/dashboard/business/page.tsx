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
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Business</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kelola informasi business Anda
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-600">Business berhasil diupdate!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                Informasi
              </p>
              <h2 className="text-lg font-bold text-gray-900 mt-1">Data Business</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="nama" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Business <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nama"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all"
                  placeholder="Masukkan nama business"
                />
              </div>

              <div>
                <label htmlFor="linkdata" className="block text-sm font-semibold text-gray-700 mb-2">
                  Link Data
                </label>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Link ke Google Spreadsheet yang berisi data customer. Setelah diisi, sistem akan membaca daftar sheet di
                  spreadsheet tersebut.
                </p>

                {sheetsLoading && (
                  <p className="mt-2 text-xs text-gray-500">Mengambil daftar sheet...</p>
                )}

                {sheetsError && (
                  <p className="mt-2 text-xs text-red-500 text-xs">{sheetsError}</p>
                )}

                {sheets.length > 0 && (
                  <>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Pilih Sheet Menu
                      </label>
                      <select
                        value={menuSheetId}
                        onChange={(e) => setMenuSheetId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all text-sm"
                      >
                        {sheets.map((sheet) => (
                          <option key={sheet.id} value={sheet.id}>
                            {sheet.title || `Sheet ${sheet.id}`}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Sheet ini akan digunakan aplikasi untuk membaca data menu.
                      </p>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Pilih Sheet Customer / Reservasi
                      </label>
                      <select
                        value={reservationSheetId}
                        onChange={(e) => setReservationSheetId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all text-sm"
                      >
                        {sheets.map((sheet) => (
                          <option key={sheet.id} value={sheet.id}>
                            {sheet.title || `Sheet ${sheet.id}`}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Sheet ini akan digunakan aplikasi untuk membaca data customer dan dipass ke n8n sebagai sheet reservasi.
                      </p>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Pilih Sheet Tempat
                      </label>
                      <select
                        value={tempatSheetId}
                        onChange={(e) => setTempatSheetId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all text-sm"
                      >
                        {sheets.map((sheet) => (
                          <option key={sheet.id} value={sheet.id}>
                            {sheet.title || `Sheet ${sheet.id}`}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Sheet ini akan digunakan aplikasi untuk membaca data tempat.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label htmlFor="idDriveGambarMenu" className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Drive Gambar Menu
                </label>
                <input
                  type="text"
                  id="idDriveGambarMenu"
                  value={formData.idDriveGambarMenu}
                  onChange={(e) => setFormData({ ...formData, idDriveGambarMenu: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all"
                  placeholder="Masukkan ID Drive gambar menu"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ID dari Google Drive yang berisi gambar menu untuk business ini.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prompt
                </label>
                <div className="flex items-start gap-3">
                  <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-4 min-h-[100px]">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}>
                      {formData.prompt ? formData.prompt.slice(0, 100) + '........' : <span className="text-gray-400 italic">Belum ada prompt</span>}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/business/prompt"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6)' }}
                  >
                    Edit Prompt
                  </Link>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Prompt yang akan digunakan untuk business ini.
                </p>
              </div>
            </div>
          </div>

          {business && (
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                  Informasi Tambahan
                </p>
                <h3 className="text-lg font-bold text-gray-900 mt-1">Detail Business</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-gray-200 bg-white/70 p-3">
                  <p className="text-xs font-semibold text-gray-500">Business ID</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{business.id}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white/70 p-3">
                  <p className="text-xs font-semibold text-gray-500">Dibuat Pada</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(business.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white/70 p-3">
                  <p className="text-xs font-semibold text-gray-500">Terakhir Diupdate</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(business.updatedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

