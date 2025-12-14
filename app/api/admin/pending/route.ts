import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - List pending admins
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser || dbUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pendingAdmins = await prisma.pendingAdmin.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ pendingAdmins })
  } catch (error) {
    console.error('Error fetching pending admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending admins' },
      { status: 500 }
    )
  }
}

