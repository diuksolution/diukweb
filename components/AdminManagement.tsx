'use client'

import { useState, useEffect } from 'react'
import { Prisma } from '@prisma/client'

type Admin = {
  id: string
  email: string
  name: string | null
  role: string
  provider: string
  createdAt: string
}

type PendingAdmin = {
  id: string
  email: string
  name: string | null
  createdAt: string
  expiresAt: string
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchAdmins()
    fetchPendingAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins)
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingAdmins = async () => {
    try {
      const response = await fetch('/api/admin/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingAdmins(data.pendingAdmins)
      }
    } catch (error) {
      console.error('Error fetching pending admins:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const url = editingAdmin
        ? `/api/admin/${editingAdmin.id}`
        : '/api/admin'
      const method = editingAdmin ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setShowModal(false)
        setFormData({ email: '', name: '', password: '' })
        setEditingAdmin(null)
        fetchAdmins()
        fetchPendingAdmins()
        setSuccess(data.message || 'Admin berhasil dibuat! Email verifikasi telah dikirim.')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save admin')
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus admin ini?')) return

    try {
      const response = await fetch(`/api/admin/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAdmins()
        setSuccess('Admin berhasil dihapus')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal menghapus admin')
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      setError('Terjadi kesalahan')
    }
  }

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      email: admin.email,
      name: admin.name || '',
      password: '',
    })
    setShowModal(true)
  }

  const handleCancel = () => {
    setShowModal(false)
    setFormData({ email: '', name: '', password: '' })
    setEditingAdmin(null)
  }

  if (loading && admins.length === 0) {
    return (
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
        <p className="text-gray-500 text-center py-12">Memuat data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-center gap-3 animate-shake">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-green-600">{success}</p>
        </div>
      )}

      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10">
              <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                Admin Management
              </p>
              <h2 className="text-xl font-bold text-gray-900">Daftar Admin</h2>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Admin
          </button>
        </div>
      </div>

      {/* Pending Admins */}
      {pendingAdmins.length > 0 && (
        <div className="rounded-2xl bg-yellow-50/90 backdrop-blur-xl border-2 border-yellow-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400/20 to-yellow-500/20">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-yellow-700 mb-1">
                Pending Verification
              </p>
              <h3 className="text-lg font-bold text-gray-900">Menunggu Verifikasi Email</h3>
            </div>
          </div>
          <div className="space-y-3">
            {pendingAdmins.map((pending) => (
              <div
                key={pending.id}
                className="rounded-xl border-2 border-yellow-200 bg-white/70 p-4 hover:border-yellow-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white text-sm font-bold">
                      {pending.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{pending.email}</p>
                      {pending.name && <p className="text-xs text-gray-600 mt-1">{pending.name}</p>}
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Expires: {new Date(pending.expiresAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admins Table */}
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                  Provider
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="p-3 rounded-full bg-gray-100">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">Tidak ada admin ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gradient-to-r hover:from-[#303d83]/5 hover:via-[#14b8a6]/5 hover:to-[#84cc16]/5 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#303d83] to-[#14b8a6] flex items-center justify-center text-white text-xs font-bold">
                          {admin.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{admin.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {admin.name || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #303d83, #84cc16)' }}>
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize font-mono">
                      {admin.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      {admin.role !== 'super_admin' && (
                        <>
                          <button
                            onClick={() => handleEdit(admin)}
                            className="text-[#303d83] hover:text-[#14b8a6] font-semibold transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="text-red-600 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border-2 border-gray-200 shadow-2xl p-6 w-full max-w-md animate-scale-in">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10">
                <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                  {editingAdmin ? 'Edit' : 'Tambah'} Admin
                </p>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingAdmin ? 'Edit Admin' : 'Tambah Admin Baru'}
                </h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-300"
                  disabled={!!editingAdmin}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300"
                />
              </div>
              {!editingAdmin && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required={!editingAdmin}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-[#303d83] transition-all hover:border-gray-300"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
                >
                  {loading ? (
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
                      {editingAdmin ? 'Update' : 'Buat Admin'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

