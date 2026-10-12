import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { PasswordChangeModal } from '../components/PasswordChangeModal'
import api from '../services/api'
import type { User } from '../types/auth'

interface DashboardLayoutProps {
  children: ReactNode
  onProfileClick?: () => void
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

export const DashboardLayout = ({ children, onProfileClick }: DashboardLayoutProps) => {
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return stored ? JSON.parse(stored) : false
  })
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  const { data: currentUserProfile } = useQuery({
    queryKey: ['users', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const res = await api.get<User>(`/users/${user.id}`)
      return res.data
    },
    enabled: !!user?.id,
  })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const displayUser = currentUserProfile || user

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header onProfileClick={onProfileClick} onPasswordClick={() => setIsPasswordOpen(true)} />
      <div className="flex pt-16">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapsed={() => setIsCollapsed(!isCollapsed)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-auto transition-all duration-300">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {isPasswordOpen && (
        <PasswordChangeModal
          hasPassword={displayUser?.has_password ?? user?.has_password ?? false}
          onClose={() => setIsPasswordOpen(false)}
        />
      )}
    </div>
  )
}
