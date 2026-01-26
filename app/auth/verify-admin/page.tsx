'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

function VerifyAdminContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Ambil token dari query parameter
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid verification token')
      return
    }

    // Handle access_token dari hash fragment (dari Supabase invite)
    const handleHash = () => {
      const hash = window.location.hash.substring(1) // Remove #
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        // Set session Supabase dari hash fragment
        const supabase = createClient()
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(() => {
          // Setelah session di-set, verifikasi admin
          verifyAdmin(token)
        })
      } else {
        // Jika tidak ada access_token, langsung verifikasi
        verifyAdmin(token)
      }
    }

    // Check hash immediately
    if (window.location.hash) {
      handleHash()
    } else {
      // Jika tidak ada hash, langsung verifikasi
      verifyAdmin(token)
    }
  }, [searchParams])

  const verifyAdmin = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Admin account verified successfully! Redirecting to dashboard...')
        
        // Sync user ke database setelah verifikasi
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          })
        }

        // Redirect ke dashboard setelah 1 detik
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <div
            className={[
              'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
              status === 'success' && 'bg-green-100 dark:bg-green-900/20',
              status === 'error' && 'bg-red-100 dark:bg-red-900/20',
              status === 'loading' && 'bg-indigo-100 dark:bg-indigo-900/20',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {status === 'loading' && (
              <svg
                className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}

            {status === 'success' && (
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}

            {status === 'error' && (
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>

          <h1
            className={[
              'mt-4 text-2xl font-bold',
              status === 'loading' && 'text-gray-900 dark:text-white',
              status === 'success' && 'text-green-600 dark:text-green-400',
              status === 'error' && 'text-red-600 dark:text-red-400',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Verification Successful'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {status === 'loading' && 'Please wait while we verify your account...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>

          {status === 'success' && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Redirecting to dashboard...
            </p>
          )}

          {status === 'error' && (
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyAdminPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-800">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20">
              <svg
                className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              Loading...
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please wait...
            </p>
          </div>
        </div>
      </div>
    }>
      <VerifyAdminContent />
    </Suspense>
  )
}

