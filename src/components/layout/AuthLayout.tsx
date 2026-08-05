import { ShieldCheck, GraduationCap, Activity } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="relative grid min-h-svh overflow-hidden bg-[oklch(0.32_0.09_162)] lg:grid-cols-2 lg:bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-10 lg:hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.32_0.09_162)] p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1.5">
            <img src="/logo-op-square.svg" alt="" className="h-full w-full" />
          </div>
          <span className="text-lg font-semibold">OP Interns</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-3xl font-semibold leading-tight">
            The complete platform for pharmacy intern training &amp; development.
          </h1>
          <p className="max-w-md text-white/80">
            Manage daily schedules, track clinical learning, and grow every intern's competency — all in
            one professional workspace built for hospital pharmacy teams.
          </p>
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
            <Feature icon={GraduationCap} label="Clinical Learning" />
            <Feature icon={Activity} label="Live Scheduling" />
            <Feature icon={ShieldCheck} label="Secure & Compliant" />
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          &copy; {new Date().getFullYear()} OP Interns. All rights reserved.
        </p>
      </div>

      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="auth-card-mobile w-full max-w-sm space-y-6 rounded-2xl bg-white p-6 shadow-xl lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-white p-2.5 shadow-glow">
              <img src="/logo-op-square.svg" alt="OP Interns" className="h-full w-full" />
            </div>
          </div>
          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg bg-white/10 p-3">
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}
