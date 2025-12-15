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

    // Check if Super Admin has a business
    if (!dbUser.businessId) {
      return NextResponse.json(
        { error: 'Super Admin must have an associated business' },
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
        password: password, // Store plain password temporarily
        name: name || null,
        createdById: dbUser.id,
        verificationToken,
        expiresAt,
      },
    })

    // Generate verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-admin?token=${verificationToken}`

    // Use service role key for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      )
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    try {
      // Use inviteUserByEmail to create user and send invitation email
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: name || null,
          },
        }
      )

      if (inviteError) {
        // If user already exists, update password and log manual verification URL
        if (inviteError.message?.includes('already registered')) {
          console.log('User already exists in Supabase Auth. Manual verification URL:', verificationUrl)
          // You can optionally update the password here if needed
        } else {
          throw inviteError
        }
      } else {
        console.log('Invitation email sent to:', email)
      }
    } catch (error: any) {
      console.error('Error sending invitation email:', error)
      // Continue anyway - user can still verify via the token URL
    }

    return NextResponse.json({
      message: 'Admin created successfully. Verification email sent.',
      pendingAdmin: {
        id: pendingAdmin.id,
        email: pendingAdmin.email,
        name: pendingAdmin.name,
      },
      verificationUrl, // For development, remove in production
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    )
  }
}

