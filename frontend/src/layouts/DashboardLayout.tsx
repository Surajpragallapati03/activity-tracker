import type { ReactNode } from 'react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
