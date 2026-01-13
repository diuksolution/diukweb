import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TempatAvailability from './components/TempatAvailability'

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

  // Get total places and customers directly from Google Sheets
  let totalPlaces = 0
  let totalCustomers = 0
  
  if (dbUser.business && dbUser.business.linkdata) {
    try {
      const spreadsheetUrl = dbUser.business.linkdata
      
      // Extract spreadsheet ID from URL
      const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        const spreadsheetId = match[1]
        
        // Get tempat data
        const tempatGidMatch = spreadsheetUrl.match(/[#&]tempatGid=(\d+)/)
        const tempatGid = tempatGidMatch ? tempatGidMatch[1] : '0'
        const tempatCsvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${tempatGid}`
        
        const tempatResponse = await fetch(tempatCsvUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          redirect: 'follow',
        })
        
        if (tempatResponse.ok) {
          const csvText = await tempatResponse.text()
          // Simple CSV parsing - handle quoted values
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = []
            let current = ''
            let inQuotes = false
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              const nextChar = line[i + 1]
              
              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  current += '"'
                  i++
                } else {
                  inQuotes = !inQuotes
                }
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            result.push(current.trim())
            return result
          }
          
          const rows = csvText.split('\n').filter(row => row.trim())
          if (rows.length > 0) {
            const headers = parseCSVLine(rows[0]).map(h => h.replace(/^"|"$/g, '').trim())
            const tanggalIndex = headers.findIndex(h => {
              const lower = h.toLowerCase()
              return lower.includes('tanggal') || lower.includes('date')
            })
            const tanggalColIndex = tanggalIndex >= 0 ? tanggalIndex : 0
            totalPlaces = headers.filter((_, index) => index !== tanggalColIndex).length
          }
        }
        
        // Get customers data
        const reservGidMatch = spreadsheetUrl.match(/[#&]reservasiGid=(\d+)/)
        const gidMatch = spreadsheetUrl.match(/[#&]gid=(\d+)/)
        const customersGid = reservGidMatch ? reservGidMatch[1] : gidMatch ? gidMatch[1] : '0'
        const customersCsvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${customersGid}`
        
        const customersResponse = await fetch(customersCsvUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          redirect: 'follow',
        })
        
        if (customersResponse.ok) {
          const csvText = await customersResponse.text()
          // Simple CSV parsing - handle quoted values
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = []
            let current = ''
            let inQuotes = false
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              const nextChar = line[i + 1]
              
              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  current += '"'
                  i++
                } else {
                  inQuotes = !inQuotes
                }
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            result.push(current.trim())
            return result
          }
          
          const rows = csvText.split('\n').filter(row => row.trim())
          if (rows.length > 1) {
            const headers = parseCSVLine(rows[0]).map(h => h.replace(/^"|"$/g, '').trim())
            const namaIndex = headers.findIndex(h => {
              const lower = h.toLowerCase()
              return (lower.includes('nama') || lower.includes('tt nama')) && !lower.includes('jumlah')
            })
            
            if (namaIndex >= 0) {
              // Count rows with nama (skip header)
              for (let i = 1; i < rows.length; i++) {
                const values = parseCSVLine(rows[i]).map(v => v.replace(/^"|"$/g, '').trim())
                if (values.length > namaIndex) {
                  const nama = values[namaIndex]?.trim() || ''
                  if (nama && nama.length > 0 && nama.toLowerCase() !== 'nama' && nama.toLowerCase() !== 'tt nama') {
                    totalCustomers++
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching statistics from Google Sheets:', error)
    }
  }

  const roleLabel = dbUser.role.replace('_', ' ')

  return (
    <div className="flex-1 py-4 lg:py-6 px-3 lg:px-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-[#303d83]/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-[#14b8a6]/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#84cc16]/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative">
        {/* Header with gradient */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#303d83] via-[#14b8a6] to-[#84cc16] shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-5xl font-extrabold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] bg-clip-text text-transparent animate-gradient">
                    Welcome back, {dbUser.name || 'User'}! 👋
                  </h1>
                  <p className="mt-1 text-base lg:text-lg text-gray-600 font-medium">
                    Here's what's happening with your business today
                  </p>
                </div>
              </div>
            </div>
            {dbUser.avatarUrl && (
              <div className="hidden md:block relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] rounded-full blur-lg opacity-50 animate-pulse"></div>
                <img
                  src={dbUser.avatarUrl}
                  alt="Profile"
                  className="relative h-20 w-20 rounded-full border-4 border-white shadow-2xl ring-4 ring-[#303d83]/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard
            title="Total Tempat"
            value={totalPlaces}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Total Customers"
            value={totalCustomers}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            gradient="from-green-500 to-emerald-500"
          />
          <StatCard
            title="Total Broadcasts"
            value={totalBroadcasts}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            gradient="from-yellow-500 to-orange-500"
          />
          <StatCard
            title="Business Status"
            value={dbUser.business ? "Active" : "Inactive"}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradient="from-purple-500 to-pink-500"
          />
        </div>

        {/* Quick Actions & Tempat Availability & Recent Broadcasts*/}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
          {/* Quick Actions */}
          <div className="w-full flex">
            <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up relative overflow-hidden group w-full flex flex-col">
              <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[#14b8a6]/5 to-transparent rounded-full blur-3xl -ml-24 -mt-24 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83] mb-1">
                    Quick Actions
                  </p>
                  <h3 className="text-xl font-bold text-gray-900">Get Started</h3>
                </div>

                <div className="space-y-3 flex-1">
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

                <div className="mt-auto pt-6 border-t border-gray-200">
                  <div className="rounded-xl border border-gray-200/50 p-4 bg-gradient-to-br from-gray-50/50 to-white backdrop-blur-sm">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Account Status</p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                      <p className="text-xs text-gray-600">
                        Role: <span className="font-semibold capitalize text-[#303d83]">{roleLabel}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">Email verified via Supabase Auth</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tempat Availability */}
          {dbUser.business && (
            <div className="w-full flex">
              <div className="w-full flex flex-col">
                <TempatAvailability />
              </div>
            </div>
          )}

          {/* Recent Broadcasts */}
          {dbUser.broadcasts && dbUser.broadcasts.length > 0 && (
            <div className="w-full flex">
              <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up relative overflow-hidden group w-full flex flex-col">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[#84cc16]/5 to-transparent rounded-full blur-3xl -mr-32 -mb-32 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex flex-col h-full">
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

                <div className="space-y-3 flex-1">
                  {dbUser.broadcasts.map((broadcast, index) => (
                    <div
                      key={broadcast.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200/50 bg-white/70 hover:bg-white hover:shadow-md transition-all duration-200 animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
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
              </div>
            </div>
          )}

        </div>


        {/* Business Information */}
        {dbUser.business && (
          <div className="mb-6 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#303d83]/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#303d83]/10 to-[#14b8a6]/10">
                      <svg className="w-5 h-5 text-[#303d83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#303d83]">
                      Business Information
                    </p>
                  </div>
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{dbUser.business.nama}</h2>
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#303d83] via-[#14b8a6] to-[#84cc16] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
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
          </div>
        )}

        {/* User Info Card */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[#303d83]/5 to-transparent rounded-full blur-3xl -ml-24 -mt-24 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
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
    </div>
  )
}

function StatCard({ title, value, icon, gradient }: { title: string; value: string | number; icon: React.ReactNode; gradient: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-lg p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-fade-in-up">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="relative z-10">
        <div className={`inline-flex p-3.5 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <p className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</p>
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon, isLink }: { label: string; value: string; icon: React.ReactNode; isLink?: boolean }) {
  return (
    <div className="group rounded-xl border border-gray-200/50 bg-white/80 p-4 hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-200">
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
      className="flex items-center gap-3 p-4 rounded-xl border border-gray-200/50 bg-white/70 hover:bg-gradient-to-r hover:from-[#303d83]/10 hover:via-[#14b8a6]/10 hover:to-[#84cc16]/10 hover:border-[#303d83]/30 hover:shadow-lg hover:scale-105 transition-all duration-200 group"
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
    <div className="rounded-lg border border-gray-200/50 bg-white/80 p-3 hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-200">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 break-all">{value}</p>
    </div>
  )
}
