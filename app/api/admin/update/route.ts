import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
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

    const { id, email, name } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    // Check if admin exists and is not super_admin
    const admin = await prisma.user.findUnique({
      where: { id },
    })

    if (!admin || admin.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Admin not found or cannot edit super admin' },
        { status: 404 }
      )
    }

    // Update admin
    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: {
        ...(email && email !== admin.email ? { email } : {}),
        ...(name !== undefined ? { name } : {}),
      },
    })

    // Update Supabase Auth if email changed
    if (email && email !== admin.email) {
      const supabaseAdmin = await createClient()
      await supabaseAdmin.auth.admin.updateUserById(admin.supabaseId, {
        email,
      })
    }

    return NextResponse.json({
      message: 'Admin updated successfully',
      admin: updatedAdmin,
    })
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    )
  }
}

