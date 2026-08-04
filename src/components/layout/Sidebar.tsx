import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { mainNavItems, adminNavItems, type NavItem } from './nav-items'
import { featureColors } from '@/lib/featureColors'
import { useAuth } from '@/contexts/AuthContext'

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const colors = featureColors[item.colorKey]

  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors',
          isActive ? colors.activeChip : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60'
        )
      }
    >
      <item.icon className={cn('h-4 w-4 shrink-0', colors.icon)} />
      {item.label}
    </NavLink>
  )
}

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
          <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}

        {profile?.role === 'admin' && (
          <>
            <div className="my-3 border-t border-sidebar-border" />
            {adminNavItems.map((item) => (
              <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
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
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:block">
      <div className="sticky top-0 h-svh">
        <SidebarContent />
      </div>
    </aside>
  )
}
