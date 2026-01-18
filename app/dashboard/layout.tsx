import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    redirect('/login')
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(to bottom right, rgba(48,61,131,0.05), white, rgba(132,204,22,0.06))' }}
    >
      <Sidebar userRole={dbUser.role} />
      <div className="flex-1 flex flex-col lg:ml-64 w-screen max-w-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}

