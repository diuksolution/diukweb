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
    <div className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header with gradient */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#303d83] via-[#14b8a6] to-[#84cc16]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] bg-clip-text text-transparent">
                Admin Management
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                Tambah, edit, dan hapus admin yang dapat mengakses dashboard
              </p>
            </div>
          </div>
        </div>

        <AdminManagement />
      </div>
    </div>
  )
}

