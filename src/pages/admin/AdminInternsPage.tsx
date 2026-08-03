import * as React from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAllProfiles, useAdjustPoints, useToggleUserActive, useUpdateUserRole } from '@/hooks/useProfiles'
import { getInitials } from '@/lib/utils'
import type { Profile, UserRole } from '@/types/database'

export default function AdminInternsPage() {
  const { data: profiles, isLoading } = useAllProfiles()
  const updateRole = useUpdateUserRole()
  const toggleActive = useToggleUserActive()
  const adjustPoints = useAdjustPoints()

  const [search, setSearch] = React.useState('')
  const [pointsTarget, setPointsTarget] = React.useState<Profile | null>(null)
  const [pointsValue, setPointsValue] = React.useState('0')
  const [pointsReason, setPointsReason] = React.useState('')

  const filtered = (profiles ?? []).filter(
    (p) => p.full_name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleRoleChange(id: string, role: UserRole) {
    try {
      await updateRole.mutateAsync({ id, role })
      toast.success('Role updated')
    } catch (e) {
      toast.error('Could not update role', { description: (e as Error).message })
    }
  }

  async function handleToggleActive(p: Profile) {
    try {
      await toggleActive.mutateAsync({ id: p.id, is_active: !p.is_active })
      toast.success(p.is_active ? 'User deactivated' : 'User activated')
    } catch (e) {
      toast.error('Could not update status', { description: (e as Error).message })
    }
  }

  async function handleAdjustPoints() {
    if (!pointsTarget) return
    const points = Number(pointsValue)
    if (Number.isNaN(points) || points === 0) {
      toast.error('Enter a non-zero point value')
      return
    }
    try {
      await adjustPoints.mutateAsync({ user_id: pointsTarget.id, points, reason: pointsReason || 'Manual adjustment' })
      toast.success('Points adjusted')
      setPointsTarget(null)
      setPointsValue('0')
      setPointsReason('')
    } catch (e) {
      toast.error('Could not adjust points', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader title="Manage Users" description="Interns, preceptors, and administrators on the platform." />

      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">{getInitials(p.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={p.role} onValueChange={(v) => handleRoleChange(p.id, v as UserRole)}>
                        <SelectTrigger className="h-8 w-32 capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="intern">Intern</SelectItem>
                          <SelectItem value="preceptor">Preceptor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-sm font-medium hover:underline"
                        onClick={() => {
                          setPointsTarget(p)
                          setPointsValue('0')
                        }}
                      >
                        {p.points}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(p)}>
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pointsTarget} onOpenChange={(open) => !open && setPointsTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust points for {pointsTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Points (use negative to deduct)</Label>
              <Input type="number" value={pointsValue} onChange={(e) => setPointsValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={pointsReason} onChange={(e) => setPointsReason(e.target.value)} placeholder="e.g. Extra credit for case study" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdjustPoints} disabled={adjustPoints.isPending}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
