import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Pill, MapPinned, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

// Fast-access shortcuts to the five destinations interns reach for most on a
// phone. Full navigation (Reflections, Leaderboard, Admin, etc.) still lives
// in the hamburger sheet — this bar is a supplement, not a replacement.
const items = [
  { href: '/', end: true, icon: LayoutDashboard, label: 'Home' },
  { href: '/schedule', end: false, icon: CalendarDays, label: 'Schedule' },
  { href: '/drug-of-the-day', end: false, icon: Pill, label: 'Daily Drug' },
  { href: '/drug-locator', end: false, icon: MapPinned, label: 'Locator' },
  { href: '/counseling-simulator', end: false, icon: MessagesSquare, label: 'Counseling' },
]

export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/75 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors duration-150',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-[background-color,transform] duration-200 ease-out-expo',
                    isActive && 'scale-105 bg-accent'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="truncate leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
