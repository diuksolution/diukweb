'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function VerifyAdminPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Verification Successful!'}
            {status === 'error' && 'Verification Failed'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {status === 'loading' && 'Please wait while we verify your account...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
          {status === 'success' && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Redirecting to login page...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

