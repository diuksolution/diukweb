import Link from 'next/link'

export default function VerificationErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: Record<string, string> = {
    missing_token: 'Verification token is missing.',
    invalid_token: 'Invalid verification token.',
    expired_token: 'Verification token has expired. Please contact administrator.',
    user_not_found: 'User not found.',
    server_error: 'Server error occurred. Please try again later.',
  }

  const errorMessage =
    errorMessages[searchParams.error || ''] ||
    'An error occurred during verification.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
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
          </div>
          <h1 className="mt-4 text-2xl font-bold text-red-600 dark:text-red-400">
            Verification Failed
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

