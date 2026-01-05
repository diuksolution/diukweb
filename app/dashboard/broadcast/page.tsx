'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  nama: string
  noWa: string
  idWa: string
  index: number
}

interface Broadcast {
  id: string
  pesan: string
  tanggal: string
  status: string
  createdAt: string
}

export default function BroadcastPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [formData, setFormData] = useState({
    pesan: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchBroadcasts()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/broadcast/customers')
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        let errorMsg = data.error || 'Failed to fetch customers'
        if (data.instructions && Array.isArray(data.instructions)) {
          errorMsg += '\n\nCara memperbaiki:\n' + data.instructions.map((inst: string, idx: number) => `${idx + 1}. ${inst}`).join('\n')
        }
        setError(errorMsg)
        return
      }
      
      setCustomers(data.customers || [])
    } catch (error: any) {
      console.error('Error fetching customers:', error)
      setError(error.message || 'Gagal memuat data customer')
    } finally {
      setLoading(false)
    }
  }

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch('/api/broadcast')
      if (!response.ok) {
        throw new Error('Failed to fetch broadcasts')
      }
      const data = await response.json()
      setBroadcasts(data.broadcasts || [])
    } catch (error) {
      console.error('Error fetching broadcasts:', error)
    }
  }

  const handleToggleCustomer = (index: string) => {
    setSelectedCustomers(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customers.map((_, idx) => idx.toString()))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (selectedCustomers.length === 0) {
        setError('Minimal pilih 1 customer')
        setSaving(false)
        return
      }

      const selectedCustomerData = selectedCustomers.map(idx => customers[parseInt(idx)])

      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pesan: formData.pesan,
          selectedCustomers: selectedCustomerData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal membuat broadcast')
      }

      const data = await response.json()
      setSuccess(data.message || 'Broadcast berhasil dibuat')
      setShowCreateForm(false)
      setFormData({ 
        pesan: '',
      })
      setSelectedCustomers([])
      fetchBroadcasts()
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      console.error('Error creating broadcast:', error)
      setError(error.message || 'Gagal membuat broadcast')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; style: string }> = {
      pending: { label: 'Pending', style: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      sent: { label: 'Terkirim', style: 'bg-green-100 text-green-800 border-green-200' },
      failed: { label: 'Gagal', style: 'bg-red-100 text-red-800 border-red-200' },
    }
    const statusInfo = statusMap[status] || statusMap.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.style}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header with gradient */}
        <div className="mb-8 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#303d83] via-[#14b8a6] to-[#84cc16]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] bg-clip-text text-transparent">
                Broadcast Messages
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                Kelola dan kirim pesan broadcast ke customer
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
          >
            {showCreateForm ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Batal
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buat Broadcast Baru
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3 animate-shake">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-red-600 whitespace-pre-line">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-green-50 border-2 border-green-200 p-4 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-green-600">{success}</p>
          </div>
        )}

        {/* Create Broadcast Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10">
                <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                  Create New Broadcast
                </p>
                <h2 className="text-xl font-bold text-gray-900">Buat Broadcast Baru</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="pesan" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Pesan Broadcast <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="pesan"
                  required
                  rows={6}
                  value={formData.pesan}
                  onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300"
                  placeholder="Masukkan pesan broadcast yang ingin dikirim ke customer..."
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pesan akan dikirim ke semua customer yang dipilih.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Pilih Customer <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#303d83] bg-[#303d83]/10 hover:bg-[#303d83]/20 transition-all"
                  >
                    {selectedCustomers.length === customers.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 space-y-2">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Memuat customer...</span>
                      </div>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">Tidak ada customer ditemukan</p>
                    </div>
                  ) : (
                    customers.map((customer, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-[#303d83]/30 hover:bg-gradient-to-r hover:from-[#303d83]/5 hover:via-[#14b8a6]/5 hover:to-[#84cc16]/5 cursor-pointer transition-all duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(idx.toString())}
                          onChange={() => handleToggleCustomer(idx.toString())}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-[#303d83] focus:ring-[#303d83] focus:ring-2"
                        />
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#303d83] to-[#14b8a6] flex items-center justify-center text-white text-xs font-bold">
                              {customer.nama.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{customer.nama}</span>
                          </div>
                          <span className="text-gray-700 font-mono text-sm">{customer.idWa || <span className="text-gray-400">-</span>}</span>
                          <span className="text-gray-700 font-mono text-sm">{customer.noWa || <span className="text-gray-400">-</span>}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {selectedCustomers.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#303d83]/10 via-[#14b8a6]/10 to-[#84cc16]/10 border border-[#303d83]/20">
                    <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-[#303d83]">
                      {selectedCustomers.length} customer dipilih
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ 
                      pesan: '',
                    })
                    setSelectedCustomers([])
                  }}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || selectedCustomers.length === 0}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Kirim Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List Broadcasts */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10">
                <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                  Broadcast History
                </p>
                <h2 className="text-xl font-bold text-gray-900">Riwayat Broadcast</h2>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#303d83]/10 via-[#14b8a6]/10 to-[#84cc16]/10 border border-[#303d83]/20">
              <span className="text-xs font-semibold text-[#303d83]">{broadcasts.length} Broadcasts</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Memuat data...</span>
              </div>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="p-3 rounded-full bg-gray-100">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Belum ada broadcast yang dikirim</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 hover:border-[#303d83]/30 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10 mt-0.5">
                          <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 leading-relaxed">{broadcast.pesan}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 ml-11">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(broadcast.createdAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {broadcast.tanggal && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Scheduled: {new Date(broadcast.tanggal).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(broadcast.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
