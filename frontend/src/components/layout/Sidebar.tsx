import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tag,
  Image,
  Store,
  RefreshCw,
  Sparkles,
  Upload,
  Download,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'

interface NavItem {
  label: string
  icon: React.ReactNode
  to: string
  badge?: string | number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, to: '/dashboard' },
  { label: 'Products', icon: <Package className="h-4 w-4" />, to: '/products' },
  { label: 'Categories', icon: <Tag className="h-4 w-4" />, to: '/categories' },
  { label: 'Media Library', icon: <Image className="h-4 w-4" />, to: '/media' },
  { label: 'Marketplaces', icon: <Store className="h-4 w-4" />, to: '/marketplaces' },
  { label: 'Sync Center', icon: <RefreshCw className="h-4 w-4" />, to: '/sync', badge: 8 },
  { label: 'AI Content', icon: <Sparkles className="h-4 w-4" />, to: '/ai' },
  { label: 'Imports', icon: <Upload className="h-4 w-4" />, to: '/imports' },
  { label: 'Exports', icon: <Download className="h-4 w-4" />, to: '/exports' },
  { label: 'Audit Logs', icon: <ScrollText className="h-4 w-4" />, to: '/audit-logs' },
  { label: 'Settings', icon: <Settings className="h-4 w-4" />, to: '/settings' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'sidebar flex flex-col h-full transition-all duration-300 ease-in-out relative',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        sidebarCollapsed && 'justify-center px-0'
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <p className="text-sm font-bold text-white leading-none">OmniChannel</p>
            <p className="text-xs text-sidebar-muted leading-none mt-0.5">Product Manager</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive && 'active',
                    sidebarCollapsed && 'justify-center px-2'
                  )
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="flex-1 animate-slide-in">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full',
          'border border-sidebar-border bg-card text-muted-foreground shadow-sm',
          'hover:bg-primary hover:text-white hover:border-primary transition-all duration-150'
        )}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Version */}
      {!sidebarCollapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-muted">v1.0.0 — Mock Mode</p>
        </div>
      )}
    </aside>
  )
}
