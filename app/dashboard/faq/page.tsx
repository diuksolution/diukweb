'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type FaqRow = {
  rowNumber: number
  data: Record<string, string>
}

export default function FaqPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<FaqRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingRow, setEditingRow] = useState<FaqRow | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const fetchFaq = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/faq')
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        let msg = data.error || 'Gagal memuat FAQ'
        if (data.instructions && Array.isArray(data.instructions)) {
          msg += '\n\nCara memperbaiki:\n' + data.instructions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')
        }
        setError(msg)
        return
      }

      setHeaders(Array.isArray(data.headers) ? data.headers : [])
      setRows(Array.isArray(data.rows) ? data.rows : [])
    } catch (err: any) {
      console.error('Error fetching FAQ:', err)
      setError(err.message || 'Gagal memuat FAQ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaq()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effectiveHeaders = useMemo(() => {
    if (headers.length > 0) return headers
    if (rows.length === 0) return []
    return Object.keys(rows[0].data || {})
  }, [headers, rows])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      return effectiveHeaders.some((h) => String(r.data?.[h] || '').toLowerCase().includes(q))
    })
  }, [rows, searchTerm, effectiveHeaders])

  const openCreate = () => {
    setEditingRow(null)
    const init: Record<string, string> = {}
    effectiveHeaders.forEach((h) => {
      init[h] = ''
    })
    setFormData(init)
    setShowModal(true)
  }

  const openEdit = (row: FaqRow) => {
    setEditingRow(row)
    const init: Record<string, string> = {}
    effectiveHeaders.forEach((h) => {
      init[h] = row.data?.[h] ?? ''
    })
    setFormData(init)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRow(null)
    setFormData({})
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const method = editingRow ? 'PUT' : 'POST'
      const payload = editingRow
        ? { rowNumber: editingRow.rowNumber, row: formData }
        : { row: formData }

      const response = await fetch('/api/faq', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        let msg = data.error || 'Gagal menyimpan FAQ'
        if (data.instructions && Array.isArray(data.instructions)) {
          msg += '\n\nCara memperbaiki:\n' + data.instructions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')
        }
        setError(msg)
        return
      }

      closeModal()
      await fetchFaq()
    } catch (err: any) {
      console.error('Error saving FAQ:', err)
      setError(err.message || 'Gagal menyimpan FAQ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: FaqRow) => {
    const ok = window.confirm('Yakin hapus FAQ ini?')
    if (!ok) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/faq', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNumber: row.rowNumber }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        let msg = data.error || 'Gagal menghapus FAQ'
        if (data.instructions && Array.isArray(data.instructions)) {
          msg += '\n\nCara memperbaiki:\n' + data.instructions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')
        }
        setError(msg)
        return
      }

      await fetchFaq()
    } catch (err: any) {
      console.error('Error deleting FAQ:', err)
      setError(err.message || 'Gagal menghapus FAQ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-linear-to-br from-[#303d83] via-[#14b8a6] to-[#84cc16]">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.07-.74 2.01-1.85 2.54-.83.4-1.15.86-1.15 1.46V15m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] bg-clip-text text-transparent">
              FAQ
            </h1>
            <p className="mt-1 text-lg text-gray-600">Kelola data FAQ dari Google Spreadsheet</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-600 whitespace-pre-line">{error}</p>
          </div>
        </div>
      )}

      {/* Search + Actions */}
      <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-linear-to-br from-[#303d83]/10 to-[#14b8a6]/10">
              <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">Search</p>
              <h2 className="text-lg font-bold text-gray-900">Cari FAQ</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchFaq}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={openCreate}
              disabled={loading || saving || effectiveHeaders.length === 0}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
              title={effectiveHeaders.length === 0 ? 'Header sheet FAQ masih kosong' : undefined}
            >
              Tambah FAQ
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari isi pertanyaan / jawaban..."
            className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">FAQ Database</p>
            <h2 className="text-xl font-bold text-gray-900">Daftar FAQ</h2>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#303d83]/10 via-[#14b8a6]/10 to-[#84cc16]/10 border border-[#303d83]/20">
            <span className="text-xs font-semibold text-[#303d83]">{filteredRows.length} items</span>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Memuat FAQ...</div>
        ) : effectiveHeaders.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            Header FAQ belum ditemukan. Pastikan baris pertama sheet FAQ berisi nama kolom (mis. Pertanyaan, Jawaban).
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-10 text-center text-gray-500">Tidak ada data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  {effectiveHeaders.map((h) => (
                    <th key={h} className="py-3 px-3 font-semibold text-gray-700">
                      {h}
                    </th>
                  ))}
                  <th className="py-3 px-3 font-semibold text-gray-700 w-[160px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.rowNumber} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    {effectiveHeaders.map((h) => (
                      <td key={h} className="py-3 px-3 align-top whitespace-pre-wrap">
                        {r.data?.[h] || ''}
                      </td>
                    ))}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                  {editingRow ? 'Edit FAQ' : 'Tambah FAQ'}
                </p>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingRow ? `Row #${editingRow.rowNumber}` : 'Item Baru'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                {effectiveHeaders.map((h) => (
                  <div key={h}>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">{h}</label>
                    <textarea
                      value={formData[h] ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [h]: e.target.value }))}
                      rows={h.toLowerCase().includes('jawab') || h.toLowerCase().includes('answer') ? 5 : 3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all"
                      placeholder={`Isi ${h}...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


