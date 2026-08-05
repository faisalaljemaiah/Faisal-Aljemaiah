import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileBottomNav } from './MobileBottomNav'
import { OpAiChat } from '@/components/OpAiChat'

export function AppShell() {
  const location = useLocation()

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="relative flex-1 overflow-x-hidden px-4 pb-24 pt-6 md:px-8 md:pb-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-primary)_0%,transparent_70%)] opacity-[0.06]"
          />
          <div className="mx-auto w-full max-w-7xl">
            <div key={location.pathname} className="animate-page-in">
              <Outlet />
            </div>
          </div>
        </main>
        <MobileBottomNav />
      </div>
      <OpAiChat />
    </div>
  )
}
