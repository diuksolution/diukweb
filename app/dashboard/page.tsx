import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

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
    include: {
      business: true,
    },
  })

  if (!dbUser) {
    // User not in database, redirect to login
    redirect('/login')
  }

  const roleLabel = dbUser.role.replace('_', ' ')

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {dbUser.name || 'User'}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Selamat datang di dashboard DIUK
          </p>
        </div>

        {/* Business Info Section */}
        {dbUser.business && (
          <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                  Business
                </p>
                <h2 className="text-lg font-bold text-gray-900">Informasi Business</h2>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#303d83] to-[#84cc16] text-white">
                Active
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 bg-white/70 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">Nama Business</p>
                <p className="text-lg font-bold text-gray-900">{dbUser.business.nama}</p>
              </div>
              {dbUser.business.linkdata && (
                <div className="rounded-lg border border-gray-200 bg-white/70 p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Link Data</p>
                  <a
                    href={dbUser.business.linkdata}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#303d83] hover:underline break-all"
                  >
                    {dbUser.business.linkdata}
                  </a>
                </div>
              )}
              <div className="rounded-lg border border-gray-200 bg-white/70 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">Business ID</p>
                <p className="text-sm font-semibold text-gray-900 break-all">{dbUser.business.id}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white/70 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">Bergabung Sejak</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(dbUser.business.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

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


            <div className="rounded-xl border border-gray-200 p-4 bg-white/80">
              <p className="text-sm font-semibold text-gray-900">Status</p>
              <p className="text-xs text-gray-600 mt-1">
                Role: <span className="font-semibold capitalize">{roleLabel}</span>
              </p>
              <p className="text-xs text-gray-600">Email terverifikasi melalui Supabase Auth.</p>
            </div>
          </div>
        </div>
      </div>
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

