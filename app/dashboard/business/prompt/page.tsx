'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface BusinessData {
  id: string
  nama: string
  linkdata: string | null
  prompt: string | null
  idDriveGambarMenu: string | null
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
          idDriveGambarMenu: business?.idDriveGambarMenu || null,
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
        {/* Header with gradient */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#303d83] via-[#14b8a6] to-[#84cc16]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] bg-clip-text text-transparent">
                Edit AI Prompt
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                Konfigurasi prompt untuk AI agent business Anda
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
            <p className="text-sm font-semibold text-green-600">Prompt berhasil diupdate!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10">
                <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                  AI Prompt Configuration
                </p>
                <h2 className="text-xl font-bold text-gray-900">Edit Prompt Business</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Prompt Text
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-[400px] px-4 py-3 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all resize-none font-mono text-sm leading-relaxed hover:border-gray-300"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}
                    placeholder="Masukkan prompt untuk AI agent..."
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-white/80 border border-gray-200">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs text-gray-500 font-mono">{prompt.length} chars</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Prompt yang akan digunakan oleh AI agent untuk business ini. Gunakan instruksi yang jelas dan spesifik.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/dashboard/business')}
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
                  Simpan Prompt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

