'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/admin/dashboard', label: '📊 Dashboard' },
  { href: '/admin/categories', label: '📁 Categories' },
  { href: '/admin/brands', label: '🏷️ Brands' },
  { href: '/admin/products', label: '📱 Products' },
  { href: '/admin/templates', label: '❓ Question Templates' },
  { href: '/admin/bookings', label: '📅 Bookings' },
  { href: '/admin/branches', label: '🏪 Branches' },
  { href: '/admin/admins', label: '👤 Admins' },
  { href: '/admin/settings', label: '⚙️ Settings' },
]

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-black text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Trade-In Admin</h1>
        <p className="text-gray-400 text-sm mt-1">{user?.name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-white text-black font-medium'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}