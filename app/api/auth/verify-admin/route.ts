import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find pending admin by token (include super admin yang membuatnya beserta business-nya)
    const pendingAdmin = await prisma.pendingAdmin.findUnique({
      where: { verificationToken: token },
      include: { 
        createdBy: {
          include: {
            business: true, // Include business dari super admin
          },
        },
      },
    })

    if (!pendingAdmin) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    // Check if token expired
    if (new Date() > pendingAdmin.expiresAt) {
      await prisma.pendingAdmin.delete({
        where: { id: pendingAdmin.id },
      })
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      )
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: pendingAdmin.email },
    })

    if (existingUser) {
      await prisma.pendingAdmin.delete({
        where: { id: pendingAdmin.id },
      })
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Find user in Supabase Auth (user was created via inviteUserByEmail)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // List users to find the one with matching email
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: 'Failed to find user account' },
        { status: 500 }
      )
    }

    // Find user by email in Supabase Auth
    const authUser = usersList?.users?.find(u => u.email === pendingAdmin.email)

    let supabaseUserId: string

    if (!authUser) {
      // User not found in Supabase Auth, create it
      // Password is stored as plain text in pendingAdmin (temporarily)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: pendingAdmin.email,
        password: pendingAdmin.password, // Plain password, Supabase will hash it
        email_confirm: true,
        user_metadata: {
          full_name: pendingAdmin.name || '',
        },
      })

      if (createError || !newUser.user) {
        console.error('Error creating user in Supabase:', createError)
        return NextResponse.json(
          { error: 'Failed to create user account: ' + (createError?.message || 'Unknown error') },
          { status: 500 }
        )
      }

      supabaseUserId = newUser.user.id
    } else {
      // User already exists in Supabase Auth (from inviteUserByEmail)
      // Confirm email and update metadata
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
        user_metadata: {
          full_name: pendingAdmin.name || '',
        },
      })

      supabaseUserId = authUser.id
    }

    // Pindahkan data dari PendingAdmin ke User
    // Create user in database dengan data dari pendingAdmin
    // Assign business yang sama dengan super admin yang membuatnya
    if (!pendingAdmin.createdBy.business) {
      return NextResponse.json(
        { error: 'Super admin does not have a business assigned' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        supabaseId: supabaseUserId,
        email: pendingAdmin.email,
        name: pendingAdmin.name,
        provider: 'email',
        role: 'admin',
        businessId: pendingAdmin.createdBy.business.id, // Assign business yang sama dengan super admin
      },
    })

    // Hapus pending admin setelah data berhasil dipindahkan
    await prisma.pendingAdmin.delete({
      where: { id: pendingAdmin.id },
    })

    console.log(`✅ Admin verified: ${pendingAdmin.email} moved from PendingAdmin to User`)
    console.log(`✅ Assigned Business: ${pendingAdmin.createdBy.business.nama} to new admin`)

    return NextResponse.json({
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Error verifying admin:', error)
    return NextResponse.json(
      { error: 'Failed to verify admin' },
      { status: 500 }
    )
  }
}

