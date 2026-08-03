import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types/database'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-svh w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function RoleRoute({ allow }: { allow: UserRole[] }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-svh w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile || !allow.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
