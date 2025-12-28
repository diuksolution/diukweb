'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface BusinessData {
  id: string
  nama: string
  linkdata: string | null
  prompt: string | null
}

export default function BusinessPromptPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [prompt, setPrompt] = useState('')
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
      setPrompt(data.prompt || '')
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
        body: JSON.stringify({ 
          nama: business?.nama || '',
          linkdata: business?.linkdata || null,
          prompt: prompt.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal mengupdate prompt')
      }

      const updatedBusiness = await response.json()
      setBusiness(updatedBusiness)
      setPrompt(updatedBusiness.prompt || '')
      
      // Redirect to dashboard business page after successful save
      router.push('/dashboard/business')
    } catch (error: any) {
      console.error('Error updating prompt:', error)
      setError(error.message || 'Gagal mengupdate prompt')
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Prompt</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kelola prompt untuk business Anda
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-600">Prompt berhasil diupdate!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                Prompt
              </p>
              <h2 className="text-lg font-bold text-gray-900 mt-1">Edit Prompt Business</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-136 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all resize-none font-mono text-xs leading-relaxed"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}
                  placeholder="Masukkan prompt..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Prompt yang akan digunakan untuk business ini.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/business')}
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
              {saving ? 'Menyimpan...' : 'Simpan Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

