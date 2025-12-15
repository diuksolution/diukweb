'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verified successfully! You can now login.')
    }
    if (searchParams.get('error') === 'not_registered') {
      setError('Akun tidak terdaftar')
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError('Error signing in: ' + error.message)
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if user exists in database
        const response = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          // Sign out user if not registered
          await supabase.auth.signOut()
          setError(errorData.error || 'Akun tidak terdaftar')
          setLoading(false)
          return
        }

        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom right, rgba(48,61,131,0.06), white, rgba(132,204,22,0.08))' }}
    >
      {/* Soft gradient orbs */}
      <div className="absolute -left-10 top-10 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(48,61,131,0.12)' }}></div>
      <div className="absolute -right-10 bottom-10 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(132,204,22,0.12)' }}></div>

      <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-48 items-center z-10">
        {/* Left info */}
        <div className="hidden lg:block space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}>
            DIUK Platform
          </div>
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Masuk ke dashboard <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' as any }}>DIUK</span>
          </h1>
          <p className="text-lg text-gray-600">
            Kelola AI Agent dan website bisnis Anda dengan tampilan yang modern dan konsisten.
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-xl lg:max-w-full space-y-8 rounded-3xl bg-white/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-gray-200">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#303d83] hover:text-[#1f285f] transition-colors"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#303d83]/30 text-[#303d83]">
                ←
              </span>
              Kembali ke Home
            </Link>
            <div />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-900">Masuk ke akun</h2>
              <p className="mt-1 text-sm text-gray-600">Gunakan email/password atau Google.</p>
            </div>
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full blur-lg opacity-60" style={{ background: 'linear-gradient(135deg, #303d83, #84cc16)' }}></div>
              <div className="relative w-14 h-14 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6)' }}>
                DIUK
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="mt-2 space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-800"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder-gray-400 shadow-sm focus:border-[#303d83] focus:ring-2 focus:ring-[#303d83]/30 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-800"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder-gray-400 shadow-sm focus:border-[#303d83] focus:ring-2 focus:ring-[#303d83]/30 focus:outline-none"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#303d83]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <p className="text-xs text-center text-gray-500">
              Hanya akun yang sudah terdaftar oleh Super Admin yang dapat masuk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
            <p className="mt-2 text-sm text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
