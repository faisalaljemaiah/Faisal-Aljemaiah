import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Pill, MapPinned, MessagesSquare } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { featureColors, type FeatureColorKey } from '@/lib/featureColors'

// Fast-access shortcuts to the five destinations interns reach for most on a
// phone. Full navigation (Reflections, Leaderboard, Admin, etc.) still lives
// in the hamburger sheet — this bar is a supplement, not a replacement.
const items: { href: string; end: boolean; icon: typeof LayoutDashboard; label: string; colorKey: FeatureColorKey }[] = [
  { href: '/', end: true, icon: LayoutDashboard, label: 'Home', colorKey: 'home' },
  { href: '/schedule', end: false, icon: CalendarDays, label: 'Schedule', colorKey: 'schedule' },
  { href: '/drug-of-the-day', end: false, icon: Pill, label: 'Daily Drug', colorKey: 'drugOfDay' },
  { href: '/drug-locator', end: false, icon: MapPinned, label: 'Locator', colorKey: 'drugLocator' },
  { href: '/counseling-simulator', end: false, icon: MessagesSquare, label: 'Counseling', colorKey: 'counseling' },
]

// Mirrors Instagram's bottom bar: a floating pill that shrinks and drops its
// labels while the page is actively scrolling down, then relaxes back to
// full size on scroll-up or once scrolling stops.
function useCompactOnScroll() {
  const [compact, setCompact] = React.useState(false)

  React.useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    let idleTimer: ReturnType<typeof setTimeout>

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY

        if (y < 24) {
          setCompact(false)
        } else if (delta > 4) {
          setCompact(true)
        } else if (delta < -4) {
          setCompact(false)
        }

        lastY = y
        ticking = false

        clearTimeout(idleTimer)
        idleTimer = setTimeout(() => setCompact(false), 900)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(idleTimer)
    }
  }, [])

  return compact
}

export function MobileBottomNav() {
  const compact = useCompactOnScroll()

  return (
    <nav className="chrome-surface pb-safe fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 lg:hidden">
      <div
        className={cn(
          'flex items-stretch justify-between rounded-full border border-white/20 bg-background/40 shadow-lg backdrop-blur-2xl transition-all duration-300 ease-out-expo supports-[backdrop-filter]:bg-background/30 dark:border-white/10',
          compact ? 'mb-2 w-[72%] gap-0.5 px-1.5 py-1.5' : 'mb-4 w-full max-w-md gap-1 px-2 py-2'
        )}
      >
        {items.map((item) => {
          const colors = featureColors[item.colorKey]
          return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center font-medium transition-[color,padding,gap] duration-300 ease-out-expo',
                compact ? 'gap-0 py-1 text-[11px]' : 'gap-1 py-1 text-[11px]',
                isActive ? colors.icon : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex items-center justify-center rounded-full transition-[background-color,transform,width,height] duration-300 ease-out-expo',
                    compact ? 'h-9 w-9' : 'h-8 w-8',
                    isActive && ['scale-105', colors.activeChip]
                  )}
                >
                  <item.icon
                    className={cn(
                      'transition-[width,height] duration-300 ease-out-expo',
                      compact ? 'h-5 w-5' : 'h-[18px] w-[18px]',
                      !isActive && colors.icon,
                      !isActive && 'opacity-60'
                    )}
                  />
                </span>
                <span
                  className={cn(
                    'truncate leading-none transition-[max-height,opacity] duration-300 ease-out-expo',
                    compact ? 'max-h-0 opacity-0' : 'max-h-4 opacity-100'
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
