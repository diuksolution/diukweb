import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

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
        { error: 'Admin not found or cannot delete super admin' },
        { status: 404 }
      )
    }

    // Delete from Supabase Auth
    const supabaseAdmin = await createClient()
    await supabaseAdmin.auth.admin.deleteUser(admin.supabaseId)

    // Delete from database (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Admin deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    )
  }
}

