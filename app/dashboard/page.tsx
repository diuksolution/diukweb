import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'

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

  const roleLabel = dbUser.role.replace('_', ' ')

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(to bottom right, rgba(48,61,131,0.05), white, rgba(132,204,22,0.06))' }}
    >
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white shadow" style={{ border: '1px solid rgba(48,61,131,0.15)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#303d83]/10 to-[#84cc16]/20" />
              <div className="relative h-full w-full flex items-center justify-center font-bold text-[#303d83]">DIUK</div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#303d83' }}>Dashboard</p>
              <h1 className="text-xl font-bold text-gray-900">Welcome, {dbUser.name || 'User'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{dbUser.email}</p>
              <p className="text-xs text-gray-500 capitalize">{roleLabel}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 mb-6">
          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                  Akun
                </p>
                <h2 className="text-lg font-bold text-gray-900">Informasi Pengguna</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #303d83, #84cc16)', color: 'white' }}>
                {roleLabel}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info label="Email" value={dbUser.email} />
              <Info label="Name" value={dbUser.name || 'Not set'} />
              <Info label="Provider" value={dbUser.provider} />
              <Info label="Supabase User ID" value={user.id} />
              <Info label="Database User ID" value={dbUser.id} />
            </div>

            {dbUser.avatarUrl && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-500 mb-2">Profile Picture</p>
                <img
                  src={dbUser.avatarUrl}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border border-gray-200 shadow"
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                  Aksi
                </p>
                <h3 className="text-lg font-bold text-gray-900">Shortcut</h3>
              </div>
            </div>

            {dbUser.role === 'super_admin' && (
              <Link
                href="/dashboard/admin"
                className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
              >
                Kelola Admin
              </Link>
            )}

            <div className="rounded-xl border border-gray-200 p-4 bg-white/80">
              <p className="text-sm font-semibold text-gray-900">Status</p>
              <p className="text-xs text-gray-600 mt-1">
                Role: <span className="font-semibold capitalize">{roleLabel}</span>
              </p>
              <p className="text-xs text-gray-600">Email terverifikasi melalui Supabase Auth.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/70 p-3">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 break-all">{value}</p>
    </div>
  )
}

