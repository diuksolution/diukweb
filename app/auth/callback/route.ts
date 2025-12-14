import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Sync user to database - use absolute URL for internal fetch
      const syncUrl = new URL('/api/auth/sync-user', origin)
      const syncResponse = await fetch(syncUrl.toString(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ userId: data.user.id }),
      })

      if (!syncResponse.ok) {
        // User tidak terdaftar, sign out dan redirect ke login dengan error
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=not_registered`)
      }

      // Wait a bit to ensure session is saved
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirect to dashboard after successful sync
      const redirectPath = next === '/' ? '/dashboard' : next
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

