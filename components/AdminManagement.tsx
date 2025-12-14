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
        
        // Show success message
        alert(data.message || 'Admin berhasil dibuat! Email verifikasi telah dikirim.')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save admin')
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return

    try {
      const response = await fetch(`/api/admin/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAdmins()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete admin')
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('An error occurred')
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
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Daftar Admin
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Tambah Admin
        </button>
      </div>

      {/* Pending Admins */}
      {pendingAdmins.length > 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Menunggu Verifikasi Email
          </h3>
          <div className="space-y-2">
            {pendingAdmins.map((pending) => (
              <div
                key={pending.id}
                className="flex items-center justify-between text-sm text-yellow-700 dark:text-yellow-300"
              >
                <div>
                  <span className="font-medium">{pending.email}</span>
                  {pending.name && <span> - {pending.name}</span>}
                  <span className="text-xs ml-2">
                    (Expires: {new Date(pending.expiresAt).toLocaleDateString()})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admins Table */}
      <div className="rounded-lg bg-white shadow dark:bg-gray-800 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {admin.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {admin.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                  {admin.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                  {admin.provider}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {admin.role !== 'super_admin' && (
                    <>
                      <button
                        onClick={() => handleEdit(admin)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingAdmin ? 'Edit Admin' : 'Tambah Admin Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  disabled={!!editingAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required={!editingAdmin}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    minLength={6}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingAdmin ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

