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
import type { FeatureColorKey } from '@/lib/featureColors'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  colorKey: FeatureColorKey
  roles?: UserRole[]
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, colorKey: 'home' },
  { label: 'Schedule', href: '/schedule', icon: CalendarDays, colorKey: 'schedule' },
  { label: 'Drug of the Day', href: '/drug-of-the-day', icon: Pill, colorKey: 'drugOfDay' },
  { label: 'Drug Locator', href: '/drug-locator', icon: MapPinned, colorKey: 'drugLocator' },
  { label: 'Counseling Simulator', href: '/counseling-simulator', icon: MessagesSquare, colorKey: 'counseling' },
  { label: 'Reflections', href: '/reflections', icon: NotebookPen, colorKey: 'reflections' },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, colorKey: 'leaderboard' },
  { label: 'Announcements', href: '/announcements', icon: Megaphone, colorKey: 'announcements' },
]

export const adminNavItems: NavItem[] = [
  { label: 'Admin Panel', href: '/admin', icon: ShieldCheck, colorKey: 'admin', roles: ['admin'] },
]
