import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user exists in database
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })

  if (!dbUser) {
    // User not in database, redirect to login
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            DIUK Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {dbUser.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {dbUser.name || 'User'}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {dbUser.role === 'super_admin' && (
          <div className="mb-6">
            <a
              href="/dashboard/admin"
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Kelola Admin
            </a>
          </div>
        )}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Welcome to Dashboard
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Role
              </p>
              <p className="text-sm text-gray-900 dark:text-white capitalize">
                {dbUser.role.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Database User ID
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{dbUser.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Supabase User ID
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{dbUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Name
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{dbUser.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Provider
              </p>
              <p className="text-sm text-gray-900 dark:text-white capitalize">{dbUser.provider}</p>
            </div>
            {dbUser.avatarUrl && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Profile Picture
                </p>
                <img
                  src={dbUser.avatarUrl}
                  alt="Profile"
                  className="h-20 w-20 rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

