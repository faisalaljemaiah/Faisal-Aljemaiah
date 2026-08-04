import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-white p-2">
        <img src="/logo-op-square.svg" alt="" className="h-full w-full" />
      </div>
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
      <Button asChild>
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  )
}
