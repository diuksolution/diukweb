import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Determine role based on provider
    const provider = user.app_metadata?.provider || 'email'
    const role = provider === 'google' ? 'super_admin' : 'admin'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (existingUser) {
      // Update user if needed (but don't change role if already set)
      const updatedUser = await prisma.user.update({
        where: { supabaseId: user.id },
        data: {
          email: user.email || existingUser.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || existingUser.name,
          avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || existingUser.avatarUrl,
          provider: provider,
          // Only update role if user doesn't have one yet
          role: existingUser.role || role,
        },
      })

      return NextResponse.json({ user: updatedUser, created: false })
    }

    // Check if user exists by email (for seeder case - Super Admin)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (existingByEmail) {
      // Update existing user with supabaseId (for seeder case)
      const updatedUser = await prisma.user.update({
        where: { email: user.email! },
        data: {
          supabaseId: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || existingByEmail.name,
          avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || existingByEmail.avatarUrl,
          provider: provider,
          // Keep existing role (for seeder Super Admin)
          role: existingByEmail.role || role,
        },
      })

      return NextResponse.json({ user: updatedUser, created: false })
    }

    // User tidak terdaftar di database
    console.log(`User not found in database: ${user.email} (${user.id})`)
    return NextResponse.json(
      { error: 'Akun tidak terdaftar' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    )
  }
}

