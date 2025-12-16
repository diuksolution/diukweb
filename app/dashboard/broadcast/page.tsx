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
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Broadcast</h1>
            <p className="mt-2 text-sm text-gray-600">
              Kelola dan kirim pesan broadcast ke customer
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
          >
            {showCreateForm ? 'Batal' : '+ Buat Broadcast Baru'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* List Customers */}
        <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
              Customer
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-1">Daftar Customer</h2>
          </div>

          {loading ? (
            <p className="text-gray-500 text-center py-12">Memuat data customer...</p>
          ) : customers.length === 0 ? (
            <p className="text-gray-500 text-center py-12">Tidak ada customer ditemukan</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                      Nama
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                      ID WA
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                      NO WA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {customer.nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {customer.idWa || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {customer.noWa || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Broadcast Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                Broadcast Baru
              </p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">Buat Broadcast Baru</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="pesan" className="block text-sm font-semibold text-gray-700 mb-2">
                  Pesan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="pesan"
                  required
                  rows={5}
                  value={formData.pesan}
                  onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all"
                  placeholder="Masukkan pesan broadcast..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Pilih Customer <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm font-semibold text-[#303d83] hover:underline"
                  >
                    {selectedCustomers.length === customers.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white/70 p-4 space-y-2">
                  {loading ? (
                    <p className="text-gray-500 text-center py-8">Memuat customer...</p>
                  ) : customers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Tidak ada customer ditemukan</p>
                  ) : (
                    customers.map((customer, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(idx.toString())}
                          onChange={() => handleToggleCustomer(idx.toString())}
                          className="w-4 h-4 rounded border-gray-300 text-[#303d83] focus:ring-[#303d83]"
                        />
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <span className="font-semibold text-gray-900">{customer.nama}</span>
                          <span className="text-gray-700">{customer.idWa || '-'}</span>
                          <span className="text-gray-700">{customer.noWa || '-'}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {selectedCustomers.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedCustomers.length} customer dipilih
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ 
                      pesan: '',
                    })
                    setSelectedCustomers([])
                  }}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || selectedCustomers.length === 0}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
                >
                  {saving ? 'Mengirim...' : 'Kirim Broadcast'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List Broadcasts */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
              Riwayat
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-1">Broadcast yang Sudah Dikirim</h2>
          </div>

          {loading ? (
            <p className="text-gray-500 text-center py-12">Memuat data...</p>
          ) : broadcasts.length === 0 ? (
            <p className="text-gray-500 text-center py-12">Belum ada broadcast yang dikirim</p>
          ) : (
            <div className="space-y-4">
              {broadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="rounded-xl border border-gray-200 bg-white/70 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-1">{broadcast.pesan}</p>
                      <p className="text-xs text-gray-500">
                        Dibuat: {new Date(broadcast.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {broadcast.tanggal && (
                        <p className="text-xs text-gray-500">
                          Tanggal: {new Date(broadcast.tanggal).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(broadcast.status)}
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
