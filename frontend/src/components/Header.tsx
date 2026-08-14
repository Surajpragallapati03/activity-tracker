import { useAuth } from '../hooks/useAuth'
import { LogOut } from 'lucide-react'

export const Header = () => {
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-20">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Activity Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 hidden sm:inline">{user?.name}</span>
          <button
            onClick={logout}
            className="btn-danger gap-2 text-sm"
            title={`Logout ${user?.name}`}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
