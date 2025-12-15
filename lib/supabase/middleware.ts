import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser()

  // Ignore non-critical auth errors - they're expected when user doesn't have a valid session
  // If session is missing, user will be treated as not logged in
  if (getUserError) {
    const errorMessage = getUserError.message || ''
    const isNonCriticalError = 
      errorMessage.includes('refresh_token_not_found') ||
      errorMessage.includes('Auth session missing!') ||
      errorMessage.includes('session_not_found') ||
      errorMessage.includes('Invalid Refresh Token')
    
    if (isNonCriticalError) {
      // This is expected when user doesn't have a valid session
      // Just continue - user will be redirected to login if needed
      // Don't log these errors as they're normal for unauthenticated requests
    } else {
      // Log other unexpected errors in development only
      if (process.env.NODE_ENV === 'development') {
        console.warn('Supabase auth error:', errorMessage)
      }
    }
  }

  // Only require authentication for dashboard routes
  // Landing page (/) and other public routes don't need authentication
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    // User trying to access dashboard without authentication, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Note: User database validation is done in page components/API routes
  // Middleware should be lightweight and not perform database queries
  // as it runs on edge runtime which doesn't support Prisma Client

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
