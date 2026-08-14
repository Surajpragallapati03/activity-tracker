const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const LoginPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/login`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Activity Tracker
          </h2>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
