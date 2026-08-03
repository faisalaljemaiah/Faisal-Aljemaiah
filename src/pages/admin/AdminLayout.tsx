import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Overview', href: '/admin' },
  { label: 'Interns', href: '/admin/interns' },
  { label: 'Schedules', href: '/admin/schedules' },
  { label: 'Drug of the Day', href: '/admin/drug-of-the-day' },
  { label: 'Drug Locator', href: '/admin/drug-locator' },
  { label: 'Counseling Cases', href: '/admin/counseling-cases' },
  { label: 'Reflections', href: '/admin/reflections' },
  { label: 'Announcements', href: '/admin/announcements' },
  { label: 'Analytics', href: '/admin/analytics' },
]

export default function AdminLayout() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage interns, schedules, content, and analytics.</p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b pb-px scrollbar-thin">
        {tabs.map((tab) => (
          <NavLink
            key={tab.href}
            to={tab.href}
            end={tab.href === '/admin'}
            className={({ isActive }) =>
              cn(
                'shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
