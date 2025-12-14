export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Authentication Error
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            There was an error during authentication. Please try again.
          </p>
          <a
            href="/login"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}

