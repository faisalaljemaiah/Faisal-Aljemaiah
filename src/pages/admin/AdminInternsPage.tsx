import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react'
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  useAllProfiles,
  useAdjustPoints,
  useToggleUserActive,
  useUpdateUserRole,
  useUpdateProfile,
  useCreateIntern,
  useDeleteUser,
  type CreateInternInput,
} from '@/hooks/useProfiles'
import { getInitials } from '@/lib/utils'
import type { Profile, UserRole } from '@/types/database'

const emptyCreateForm: CreateInternInput = {
  email: '',
  full_name: '',
  role: 'intern',
  school: '',
  cohort: '',
  year_level: '',
  phone: '',
}

const emptyEditForm = {
  full_name: '',
  phone: '',
  school: '',
  cohort: '',
  year_level: '',
}

export default function AdminInternsPage() {
  const { data: profiles, isLoading } = useAllProfiles()
  const updateRole = useUpdateUserRole()
  const toggleActive = useToggleUserActive()
  const adjustPoints = useAdjustPoints()
  const updateProfile = useUpdateProfile()
  const createIntern = useCreateIntern()
  const deleteUser = useDeleteUser()

  const [search, setSearch] = React.useState('')
  const [pointsTarget, setPointsTarget] = React.useState<Profile | null>(null)
  const [pointsValue, setPointsValue] = React.useState('0')
  const [pointsReason, setPointsReason] = React.useState('')

  const [addOpen, setAddOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState<CreateInternInput>(emptyCreateForm)

  const [editTarget, setEditTarget] = React.useState<Profile | null>(null)
  const [editForm, setEditForm] = React.useState(emptyEditForm)

  const [deleteTarget, setDeleteTarget] = React.useState<Profile | null>(null)

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

  async function handleCreateIntern() {
    if (!createForm.email.trim() || !createForm.full_name.trim()) {
      toast.error('Name and email are required.')
      return
    }
    try {
      await createIntern.mutateAsync(createForm)
      toast.success('Invite sent!', { description: `${createForm.full_name} will receive an email to set their password.` })
      setAddOpen(false)
      setCreateForm(emptyCreateForm)
    } catch (e) {
      toast.error('Could not create user', { description: (e as Error).message })
    }
  }

  function openEdit(p: Profile) {
    setEditTarget(p)
    setEditForm({
      full_name: p.full_name,
      phone: p.phone ?? '',
      school: p.school ?? '',
      cohort: p.cohort ?? '',
      year_level: p.year_level ?? '',
    })
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    if (!editForm.full_name.trim()) {
      toast.error('Name is required.')
      return
    }
    try {
      await updateProfile.mutateAsync({ id: editTarget.id, ...editForm })
      toast.success('Profile updated')
      setEditTarget(null)
    } catch (e) {
      toast.error('Could not update profile', { description: (e as Error).message })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteUser.mutateAsync(deleteTarget.id)
      toast.success('User removed')
      setDeleteTarget(null)
    } catch (e) {
      toast.error('Could not remove user', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Manage Users"
        description="Interns, preceptors, and administrators on the platform."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Invite intern
          </Button>
        }
      />

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
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(p)}>
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjust points */}
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

      {/* Add intern */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a new user</DialogTitle>
            <DialogDescription>
              They'll receive an email invite to set their own password and sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="preceptor">Preceptor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>School (optional)</Label>
                <Input value={createForm.school} onChange={(e) => setCreateForm({ ...createForm, school: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Cohort (optional)</Label>
                <Input value={createForm.cohort} onChange={(e) => setCreateForm({ ...createForm, cohort: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Year level (optional)</Label>
                <Input value={createForm.year_level} onChange={(e) => setCreateForm({ ...createForm, year_level: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateIntern} disabled={createIntern.isPending}>
              {createIntern.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit profile */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Full name</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>School</Label>
              <Input value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cohort</Label>
              <Input value={editForm.cohort} onChange={(e) => setEditForm({ ...editForm, cohort: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Year level</Label>
              <Input value={editForm.year_level} onChange={(e) => setEditForm({ ...editForm, year_level: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={updateProfile.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {deleteTarget?.full_name}?</DialogTitle>
            <DialogDescription>
              This permanently deletes their account and all associated data (schedule, reflections,
              counseling attempts, points). This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
