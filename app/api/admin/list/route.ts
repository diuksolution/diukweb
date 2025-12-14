import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super_admin
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser || dbUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all admins (not super_admins)
    const admins = await prisma.user.findMany({
      where: {
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get pending admins
    const pendingAdmins = await prisma.pendingAdmin.findMany({
      include: {
        createdBy: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      admins,
      pendingAdmins: pendingAdmins.map((p) => ({
        id: p.id,
        email: p.email,
        name: p.name,
        createdBy: p.createdBy.email,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}

