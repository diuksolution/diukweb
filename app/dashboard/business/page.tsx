'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface BusinessData {
  id: string
  nama: string
  linkdata: string | null
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
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
      })
    } catch (error) {
      console.error('Error fetching business:', error)
      setError('Gagal memuat data business')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal mengupdate business')
      }

      const updatedBusiness = await response.json()
      setBusiness(updatedBusiness)
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
                  onChange={(e) => setFormData({ ...formData, linkdata: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all"
                  placeholder="https://example.com/data"
                />
                <p className="mt-1 text-xs text-gray-500">Link ke data atau spreadsheet business Anda</p>
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

