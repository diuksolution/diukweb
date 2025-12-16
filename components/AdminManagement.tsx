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
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
            Manajemen
          </p>
          <h2 className="text-xl font-bold text-gray-900 mt-1">
            Daftar Admin
          </h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
        >
          + Tambah Admin
        </button>
      </div>

      {/* Pending Admins */}
      {pendingAdmins.length > 0 && (
        <div className="rounded-2xl bg-yellow-50/90 backdrop-blur-xl border border-yellow-200 shadow-xl p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
              Pending
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              Menunggu Verifikasi Email
            </h3>
          </div>
          <div className="space-y-3">
            {pendingAdmins.map((pending) => (
              <div
                key={pending.id}
                className="rounded-xl border border-yellow-200 bg-white/70 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{pending.email}</p>
                    {pending.name && <p className="text-xs text-gray-600 mt-1">{pending.name}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: {new Date(pending.expiresAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admins Table */}
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
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
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {admin.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: 'linear-gradient(135deg, #303d83, #84cc16)', color: 'white' }}>
                      {admin.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                    {admin.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    {admin.role !== 'super_admin' && (
                      <>
                        <button
                          onClick={() => handleEdit(admin)}
                          className="text-[#303d83] hover:text-[#14b8a6] font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-md">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                {editingAdmin ? 'Edit' : 'Tambah'}
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">
                {editingAdmin ? 'Edit Admin' : 'Tambah Admin Baru'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!!editingAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all"
                />
              </div>
              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#303d83] focus:border-transparent transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
                >
                  {loading ? 'Menyimpan...' : editingAdmin ? 'Update' : 'Buat Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

