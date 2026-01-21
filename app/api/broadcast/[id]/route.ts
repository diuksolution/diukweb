import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Broadcast id is required' }, { status: 400 })
    }

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

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existing = await prisma.broadcast.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!existing || !existing.userId) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    if (existing.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.broadcast.delete({ where: { id } })

    return NextResponse.json({ message: 'Broadcast deleted' })
  } catch (error) {
    console.error('Error deleting broadcast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


