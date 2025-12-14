import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(request: Request) {
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

    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists in User or PendingAdmin
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    const existingPending = await prisma.pendingAdmin.findUnique({
      where: { email },
    })

    if (existingUser || existingPending) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth (but not confirmed)
    const supabaseAdmin = await createClient()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User needs to verify email
      user_metadata: {
        full_name: name || null,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Create pending admin
    const pendingAdmin = await prisma.pendingAdmin.create({
      data: {
        email,
        password: authData.user.id, // Store Supabase user ID instead of password
        name: name || null,
        createdById: dbUser.id,
        verificationToken,
        expiresAt,
      },
    })

    // Send verification email
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
    })

    // Get the verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-admin?token=${verificationToken}`

    // TODO: Send email with verification link
    // You can use a service like Resend, SendGrid, or Supabase's email service
    console.log('Verification link:', verificationLink)

    return NextResponse.json({
      message: 'Admin created successfully. Verification email sent.',
      pendingAdmin: {
        id: pendingAdmin.id,
        email: pendingAdmin.email,
        name: pendingAdmin.name,
      },
      verificationLink, // For development, remove in production
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    )
  }
}

