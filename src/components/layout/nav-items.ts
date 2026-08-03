import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  CalendarDays,
  Pill,
  MapPinned,
  MessagesSquare,
  NotebookPen,
  Trophy,
  Megaphone,
  ShieldCheck,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles?: UserRole[]
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Schedule', href: '/schedule', icon: CalendarDays },
  { label: 'Drug of the Day', href: '/drug-of-the-day', icon: Pill },
  { label: 'Drug Locator', href: '/drug-locator', icon: MapPinned },
  { label: 'Counseling Simulator', href: '/counseling-simulator', icon: MessagesSquare },
  { label: 'Reflections', href: '/reflections', icon: NotebookPen },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Announcements', href: '/announcements', icon: Megaphone },
]

export const adminNavItems: NavItem[] = [
  { label: 'Admin Panel', href: '/admin', icon: ShieldCheck, roles: ['admin'] },
]
