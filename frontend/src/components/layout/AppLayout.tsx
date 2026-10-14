import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

export function AppLayout() {
  const { isAuthenticated } = useAuthStore()
  const { sidebarCollapsed, searchOpen } = useUIStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main
          className={cn(
            'flex-1 overflow-y-auto p-6 animate-fade-in',
          )}
        >
          <Outlet />
        </main>
      </div>
      {searchOpen && <GlobalSearch />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'border border-border shadow-lg text-sm',
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </div>
  )
}
