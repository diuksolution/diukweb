import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
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
    include: {
      business: true,
      broadcasts: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!dbUser) {
    redirect('/login')
  }

  // Get statistics
  const totalBroadcasts = await prisma.broadcast.count({
    where: { userId: dbUser.id },
  })

  const sentBroadcasts = await prisma.broadcast.count({
    where: { userId: dbUser.id, status: 'sent' },
  })

  const pendingBroadcasts = await prisma.broadcast.count({
    where: { userId: dbUser.id, status: 'pending' },
  })

  const roleLabel = dbUser.role.replace('_', ' ')

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header with gradient */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] bg-clip-text text-transparent">
                Welcome back, {dbUser.name || 'User'}! 👋
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Here's what's happening with your business today
              </p>
            </div>
            {dbUser.avatarUrl && (
              <div className="hidden md:block">
                <img
                  src={dbUser.avatarUrl}
                  alt="Profile"
                  className="h-16 w-16 rounded-full border-4 border-white shadow-xl ring-2 ring-[#303d83]/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Broadcasts"
            value={totalBroadcasts}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Sent"
            value={sentBroadcasts}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradient="from-green-500 to-emerald-500"
          />
          <StatCard
            title="Pending"
            value={pendingBroadcasts}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradient="from-yellow-500 to-orange-500"
          />
          <StatCard
            title="Business Status"
            value={dbUser.business ? "Active" : "Inactive"}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            gradient="from-purple-500 to-pink-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Business Info - Takes 2 columns */}
          {dbUser.business && (
            <div className="lg:col-span-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                    Business Information
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">{dbUser.business.nama}</h2>
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] text-white shadow-lg">
                  Active
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <InfoCard
                  label="Business ID"
                  value={dbUser.business.id}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  }
                />
                {dbUser.business.linkdata && (
                  <InfoCard
                    label="Link Data"
                    value={dbUser.business.linkdata}
                    isLink={true}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    }
                  />
                )}
                <InfoCard
                  label="Bergabung Sejak"
                  value={new Date(dbUser.business.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
                {dbUser.business.prompt && (
                  <InfoCard
                    label="Prompt Status"
                    value={dbUser.business.prompt.length > 0 ? "Configured" : "Not Set"}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                  />
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/dashboard/business"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] hover:shadow-lg transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Manage Business
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                Quick Actions
              </p>
              <h3 className="text-xl font-bold text-gray-900">Get Started</h3>
            </div>

            <div className="space-y-3">
              <QuickActionLink
                href="/dashboard/business"
                label="Manage Business"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <QuickActionLink
                href="/dashboard/broadcast"
                label="Send Broadcast"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              />
              <QuickActionLink
                href="/dashboard/business/prompt"
                label="Edit Prompt"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-gray-50 to-white">
                <p className="text-sm font-semibold text-gray-900 mb-2">Account Status</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-xs text-gray-600">
                    Role: <span className="font-semibold capitalize text-[#303d83]">{roleLabel}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-500">Email verified via Supabase Auth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Broadcasts */}
        {dbUser.broadcasts && dbUser.broadcasts.length > 0 && (
          <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                  Recent Activity
                </p>
                <h3 className="text-xl font-bold text-gray-900">Latest Broadcasts</h3>
              </div>
              <Link
                href="/dashboard/broadcast"
                className="text-sm font-semibold text-[#303d83] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {dbUser.broadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white/50 hover:bg-white transition-all duration-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {broadcast.pesan}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(broadcast.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <StatusBadge status={broadcast.status || 'pending'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Info Card */}
        <div className="mt-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                Account Information
              </p>
              <h3 className="text-xl font-bold text-gray-900">User Profile</h3>
            </div>
            {dbUser.avatarUrl && (
              <img
                src={dbUser.avatarUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full border-4 border-white shadow-lg ring-2 ring-[#303d83]/20"
              />
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Info label="Email" value={dbUser.email} />
            <Info label="Name" value={dbUser.name || 'Not set'} />
            <Info label="Provider" value={dbUser.provider} />
            <Info label="User ID" value={dbUser.id} />
            <Info label="Supabase ID" value={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, gradient }: { title: string; value: string | number; icon: React.ReactNode; gradient: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      <div className="relative">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 shadow-lg`}>
          {icon}
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon, isLink }: { label: string; value: string; icon: React.ReactNode; isLink?: boolean }) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white/70 p-4 hover:bg-white hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-[#303d83]">{icon}</div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
      </div>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#303d83] hover:underline break-all line-clamp-2"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-semibold text-gray-900 break-all">{value}</p>
      )}
    </div>
  )
}

function QuickActionLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white/50 hover:bg-gradient-to-r hover:from-[#303d83]/5 hover:via-[#14b8a6]/5 hover:to-[#84cc16]/5 hover:border-[#303d83]/20 transition-all duration-200 group"
    >
      <div className="text-[#303d83] group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-900 group-hover:text-[#303d83] transition-colors duration-200">
        {label}
      </span>
      <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[#303d83] group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    sent: { color: 'bg-green-100 text-green-800', label: 'Sent' },
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/70 p-3 hover:bg-white hover:shadow-sm transition-all duration-200">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 break-all">{value}</p>
    </div>
  )
}
