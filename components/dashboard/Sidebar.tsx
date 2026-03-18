'use client'

/**
 * Sidebar navigation component.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  LayoutTemplate,
  Settings,
  CreditCard,
  Zap,
  ChevronRight,
  BarChart2,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Templates', href: '/templates', icon: LayoutTemplate, adminOnly: true },
  { label: 'Reports', href: '/reports', icon: BarChart2, adminOnly: true },
  { label: 'Analytics', href: '/analytics', icon: TrendingUp, adminOnly: true },
  { label: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
  { label: 'Billing', href: '/billing', icon: CreditCard, adminOnly: true },
]

interface SidebarProps {
  userRole: UserRole
  organizationName: string
}

export function Sidebar({ userRole, organizationName }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'org_admin'

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm">OnRampd</p>
            <p className="text-slate-400 text-xs truncate">{organizationName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-red-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <p className="text-xs text-slate-600 text-center">OnRampd v0.1</p>
      </div>
    </aside>
  )
}
