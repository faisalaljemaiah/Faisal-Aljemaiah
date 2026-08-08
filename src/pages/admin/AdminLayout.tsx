import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Pill,
  MapPinned,
  MessagesSquare,
  NotebookPen,
  Megaphone,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSection {
  label: string
  href: string
  end?: boolean
  icon: LucideIcon
  tile: string
  activeTile: string
  iconClass: string
}

// Each section gets its own color, same spirit as the sidebar's per-feature
// accents — full literal class strings (not templated) so Tailwind's scanner
// picks them all up.
const sections: AdminSection[] = [
  {
    label: 'Overview',
    href: '/admin',
    end: true,
    icon: LayoutDashboard,
    tile: 'bg-slate-100 dark:bg-slate-800/40',
    activeTile: 'border-slate-400 bg-slate-200 dark:border-slate-600 dark:bg-slate-800/70',
    iconClass: 'text-slate-600 dark:text-slate-300',
  },
  {
    label: 'Interns',
    href: '/admin/interns',
    icon: Users,
    tile: 'bg-emerald-50 dark:bg-emerald-950/30',
    activeTile: 'border-emerald-400 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Schedules',
    href: '/admin/schedules',
    icon: CalendarDays,
    tile: 'bg-blue-50 dark:bg-blue-950/30',
    activeTile: 'border-blue-400 bg-blue-100 dark:border-blue-700 dark:bg-blue-950/60',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Drug of the Day',
    href: '/admin/drug-of-the-day',
    icon: Pill,
    tile: 'bg-orange-50 dark:bg-orange-950/30',
    activeTile: 'border-orange-400 bg-orange-100 dark:border-orange-700 dark:bg-orange-950/60',
    iconClass: 'text-orange-600 dark:text-orange-400',
  },
  {
    label: 'Drug Locator',
    href: '/admin/drug-locator',
    icon: MapPinned,
    tile: 'bg-cyan-50 dark:bg-cyan-950/30',
    activeTile: 'border-cyan-400 bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-950/60',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    label: 'Counseling Cases',
    href: '/admin/counseling-cases',
    icon: MessagesSquare,
    tile: 'bg-violet-50 dark:bg-violet-950/30',
    activeTile: 'border-violet-400 bg-violet-100 dark:border-violet-700 dark:bg-violet-950/60',
    iconClass: 'text-violet-600 dark:text-violet-400',
  },
  {
    label: 'Reflections',
    href: '/admin/reflections',
    icon: NotebookPen,
    tile: 'bg-rose-50 dark:bg-rose-950/30',
    activeTile: 'border-rose-400 bg-rose-100 dark:border-rose-700 dark:bg-rose-950/60',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  {
    label: 'Announcements',
    href: '/admin/announcements',
    icon: Megaphone,
    tile: 'bg-indigo-50 dark:bg-indigo-950/30',
    activeTile: 'border-indigo-400 bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/60',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    tile: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
    activeTile: 'border-fuchsia-400 bg-fuchsia-100 dark:border-fuchsia-700 dark:bg-fuchsia-950/60',
    iconClass: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
]

export default function AdminLayout() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage interns, schedules, content, and analytics.</p>
      </div>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-thin sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 md:grid-cols-5 lg:grid-cols-9">
        {sections.map((s) => (
          <NavLink
            key={s.href}
            to={s.href}
            end={s.end}
            className={({ isActive }) =>
              cn(
                'flex aspect-square w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-transparent p-2 text-center shadow-sm transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] sm:w-auto',
                isActive ? s.activeTile : s.tile
              )
            }
          >
            <s.icon className={cn('h-6 w-6 shrink-0 sm:h-7 sm:w-7', s.iconClass)} />
            <span className="text-[11px] font-medium leading-tight text-foreground sm:text-xs">{s.label}</span>
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
