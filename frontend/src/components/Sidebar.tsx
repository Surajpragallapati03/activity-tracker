import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/users', label: 'Users' },
    { href: '/infos', label: 'Infos' },
    { href: '/invites', label: 'Invites' },
    { href: '/plans', label: 'Plans' },
    { href: '/closings', label: 'Closings' },
    { href: '/fg-invites', label: 'FG Invites' },
    { href: '/feel-goods', label: 'Feel Goods' },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg lg:hidden hover:bg-blue-700"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 overflow-y-auto z-30 transition-transform duration-300 lg:translate-x-0 lg:static lg:top-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
