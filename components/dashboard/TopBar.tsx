'use client'

/**
 * Top navigation bar with notification bell and user menu.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { User as UserType, Notification } from '@/types'

interface TopBarProps {
  user: UserType & { organization?: { name: string } }
}

export function TopBar({ user }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) setNotifications(data)
    }

    fetchNotifications()

    // Real-time subscription for new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user.id])

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications([])
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-end gap-3">
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotifications(!showNotifications)
            setShowUserMenu(false)
          }}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <p className="font-semibold text-sm text-slate-900">Notifications</p>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-red-700 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 text-center">No new notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => {
            setShowUserMenu(!showUserMenu)
            setShowNotifications(false)
          }}
          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-800 text-xs font-semibold">
              {getInitials(user.full_name ?? user.email)}
            </span>
          </div>
          <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
            {user.full_name ?? user.email}
          </span>
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false)
            setShowUserMenu(false)
          }}
        />
      )}
    </header>
  )
}
