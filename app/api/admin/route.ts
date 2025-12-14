import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

// GET - List all admins
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

    const admins = await prisma.user.findMany({
      where: {
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}

// POST - Create new admin (with email verification)
export async function POST(request: Request) {
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
      include: { business: true }, // Include business untuk validasi
    })

    if (!dbUser || dbUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validasi: Super admin harus punya business sebelum bisa membuat admin
    if (!dbUser.business) {
      return NextResponse.json(
        { error: 'Super admin must have a business assigned before creating admin accounts' },
        { status: 400 }
      )
    }

    const { email, name, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if email is in pending admins
    const existingPending = await prisma.pendingAdmin.findUnique({
      where: { email },
    })

    if (existingPending) {
      return NextResponse.json(
        { error: 'Email verification already sent' },
        { status: 400 }
      )
    }

    // Don't hash password here - Supabase will hash it when creating user
    // We store plain password temporarily (will be deleted after verification)
    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

    // Create pending admin
    const pendingAdmin = await prisma.pendingAdmin.create({
      data: {
        email,
        name: name || null,
        password: password, // Store plain password temporarily
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
      // List users to check if email already exists
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers()
      
      // Find user by email
      const existingAuthUser = usersList?.users?.find(u => u.email === email)
      
      if (existingAuthUser) {
        // User already exists - update password
        await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
          password: password,
          user_metadata: {
            name: name || '',
          },
        })
        console.log(`User ${email} already exists in Supabase Auth. Password updated.`)
        console.log(`⚠️  Verification URL (send manually): ${verificationUrl}`)
      } else {
        // Create new user and send invitation email via Supabase
        // inviteUserByEmail will create user AND send email automatically
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          email,
          {
            data: {
              name: name || '',
              verification_token: verificationToken,
              verification_url: verificationUrl,
            },
            redirectTo: verificationUrl,
          }
        )

        if (inviteError) {
          console.error('Error inviting user:', inviteError)
          
          // If user already exists, try to create manually
          if (inviteError.message?.includes('already been registered') || inviteError.message?.includes('already exists')) {
            // Create user manually
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password: password,
              email_confirm: false,
              user_metadata: {
                name: name || '',
              },
            })

            if (createError) {
              console.error('Error creating user:', createError)
              return NextResponse.json(
                { error: 'Failed to create user: ' + createError.message },
                { status: 500 }
              )
            }

            console.log(`User created manually. Verification URL: ${verificationUrl}`)
            // Note: Email won't be sent automatically, need to send manually or use magic link
          } else {
            return NextResponse.json(
              { error: 'Failed to invite user: ' + inviteError.message },
              { status: 500 }
            )
          }
        } else {
          console.log(`✅ Supabase invitation email sent to ${email}`)
        }
      }
    } catch (error) {
      console.error('Error processing user:', error)
      return NextResponse.json(
        { error: 'Failed to process user: ' + (error as Error).message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Admin berhasil dibuat dan email verifikasi telah dikirim.',
      pendingAdmin: {
        id: pendingAdmin.id,
        email: pendingAdmin.email,
      },
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    )
  }
}

