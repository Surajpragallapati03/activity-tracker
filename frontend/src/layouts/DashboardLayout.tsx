import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return stored ? JSON.parse(stored) : false
  })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(isCollapsed))
  }, [isCollapsed])

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapsed={() => setIsCollapsed(!isCollapsed)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-auto transition-all duration-300">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
