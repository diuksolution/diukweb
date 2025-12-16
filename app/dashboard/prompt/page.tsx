import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function PromptPage() {
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

  if (!dbUser) {
    redirect('/login')
  }

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Prompt</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kelola prompt untuk AI agent
          </p>
        </div>

        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-6">
          <p className="text-gray-500 text-center py-12">
            Halaman Prompt akan segera tersedia
          </p>
        </div>
      </div>
    </div>
  )
}

