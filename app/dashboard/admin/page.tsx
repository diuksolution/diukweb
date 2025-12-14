import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminManagement from '@/components/AdminManagement'

export default async function AdminManagementPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })

  if (!dbUser || dbUser.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Kelola Admin
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tambah, edit, dan hapus admin yang dapat mengakses dashboard
        </p>
      </div>

      <AdminManagement />
    </div>
  )
}

