import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, LayoutDashboard, Users, FileText, Calendar, CheckCircle, Gift, Heart, ChevronRight, TrendingUp, Bookmark, BarChart3, Clock } from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapsed: () => void
}

export const Sidebar = ({ isCollapsed, onToggleCollapsed }: SidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(true)
  const location = useLocation()

  const mainItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/infos', label: 'Infos', icon: FileText },
    { href: '/daily-updates', label: 'Daily Updates', icon: Clock },
    { href: '/pipeline-updates', label: 'Pipeline Updates', icon: TrendingUp },
    { href: '/kiv', label: 'KIV', icon: Bookmark },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ]

  const activityItems = [
    { href: '/invites', label: 'Invites', icon: Calendar },
    { href: '/plans', label: 'Plans', icon: CheckCircle },
    { href: '/closings', label: 'Closings', icon: Gift },
    { href: '/fg-invites', label: 'FG Invites', icon: Calendar },
    { href: '/feel-goods', label: 'Feel Goods', icon: Heart },
  ]

  const isActive = (href: string) => location.pathname === href

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => (
    <Link
      to={href}
      onClick={() => setIsMobileOpen(false)}
      title={isCollapsed ? label : ''}
      className={`nav-link ${isActive(href) ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon size={20} />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg lg:hidden hover:bg-blue-700"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          {!isCollapsed && <span className="text-sm font-semibold text-slate-900 dark:text-white">Menu</span>}
          <button
            onClick={onToggleCollapsed}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
            title={isCollapsed ? 'Expand' : 'Collapse'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {mainItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          {/* Activities Section */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsActivitiesOpen(!isActivitiesOpen)}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Activities' : ''}
            >
              {isCollapsed ? (
                <span className="font-bold text-xs">↓</span>
              ) : (
                <>
                  <span>Activities</span>
                  <ChevronDown
                    size={16}
                    className={`ml-auto transition-transform ${isActivitiesOpen ? '' : '-rotate-90'}`}
                  />
                </>
              )}
            </button>

            {isActivitiesOpen && (
              <div className={`mt-2 space-y-1 ${isCollapsed ? '' : ''}`}>
                {activityItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto z-30 transition-transform duration-300 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1">
          {mainItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsActivitiesOpen(!isActivitiesOpen)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <span>Activities</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${isActivitiesOpen ? '' : '-rotate-90'}`}
              />
            </button>

            {isActivitiesOpen && (
              <div className="mt-2 space-y-1">
                {activityItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  )
}
