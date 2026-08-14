const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const LoginPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/login`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Activity Tracker</h1>
            <p className="text-slate-600">Manage team activities efficiently</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full btn-primary gap-3 py-3 text-base justify-center"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1.25,12.545,1.25 c-6.343,0-11.5,5.157-11.5,11.5c0,6.343,5.157,11.5,11.5,11.5c6.343,0,11.5-5.157,11.5-11.5c0-0.828-0.084-1.638-0.25-2.441H12.545z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              This is a secure application for authorized users only.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          © 2026 Activity Tracker. All rights reserved.
        </p>
      </div>
    </div>
  )
}
