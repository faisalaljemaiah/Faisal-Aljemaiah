import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { mainNavItems, adminNavItems } from './nav-items'
import { useAuth } from '@/contexts/AuthContext'

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useAuth()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <img src="/logo-op-square.svg" alt="OP Interns" className="h-7 w-7" />
        <span className="text-base font-semibold tracking-tight">OP Interns</span>
      </div>

      <nav className="chrome-surface flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {profile?.role === 'admin' && (
          <>
            <div className="my-3 border-t border-sidebar-border" />
            {adminNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
        <p className="font-medium text-sidebar-foreground/80">OP Interns Platform</p>
        <p>Pharmacy intern management</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
      <div className="sticky top-0 h-svh">
        <SidebarContent />
      </div>
    </aside>
  )
}
