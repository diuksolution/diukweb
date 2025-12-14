import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PUT - Update admin
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { name } = await request.json()
    const adminId = params.id

    // Check if admin exists and is not super_admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (admin.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot edit super admin' },
        { status: 403 }
      )
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        name: name || null,
      },
    })

    return NextResponse.json({ admin: updatedAdmin })
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    )
  }
}

// DELETE - Delete admin
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const adminId = params.id

    // Check if admin exists and is not super_admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (admin.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin' },
        { status: 403 }
      )
    }

    // Delete user from Supabase Auth
    try {
      await supabase.auth.admin.deleteUser(admin.supabaseId)
    } catch (error) {
      console.error('Error deleting user from Supabase:', error)
    }

    // Delete from database
    await prisma.user.delete({
      where: { id: adminId },
    })

    return NextResponse.json({ message: 'Admin deleted successfully' })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    )
  }
}

