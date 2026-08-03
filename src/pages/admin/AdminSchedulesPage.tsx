import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateRotation, useDeleteRotation, useRotations } from '@/hooks/useRotations'
import { useAllShiftAssignments, useCreateShift, useDeleteShift } from '@/hooks/useShifts'
import { useInterns } from '@/hooks/useProfiles'
import { formatDate, formatDateTime } from '@/lib/utils'
import InternScheduleGrid from './InternScheduleGrid'

export default function AdminSchedulesPage() {
  const [tab, setTab] = React.useState<'assign' | 'shifts' | 'rotations'>('assign')

  return (
    <div>
      <PageHeader title="Schedules" description="Assign shifts per intern, create rotations, and publish one-off shifts." />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-5">
        <TabsList>
          <TabsTrigger value="assign">Assign Shifts</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="rotations">Rotations</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'assign' ? <InternScheduleGrid /> : tab === 'shifts' ? <ShiftsPanel /> : <RotationsPanel />}
    </div>
  )
}

function ShiftsPanel() {
  const { profile } = useAuth()
  const { data: assignments, isLoading } = useAllShiftAssignments()
  const { data: interns } = useInterns()
  const { data: rotations } = useRotations()
  const createShift = useCreateShift()
  const deleteShift = useDeleteShift()

  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    location: '',
    shift_type: 'clinical',
    rotation_id: '',
    start_time: '',
    end_time: '',
  })
  const [selectedInterns, setSelectedInterns] = React.useState<Set<string>>(new Set())

  const shiftGroups = React.useMemo(() => {
    const map = new Map<string, { shiftTitle: string; start: string; end: string; assignees: typeof assignments }>()
    for (const a of assignments ?? []) {
      if (!a.shift) continue
      const key = a.shift.id
      if (!map.has(key)) {
        map.set(key, { shiftTitle: a.shift.title, start: a.shift.start_time, end: a.shift.end_time, assignees: [] })
      }
      map.get(key)!.assignees!.push(a)
    }
    return Array.from(map.entries()).sort((a, b) => new Date(b[1].start).getTime() - new Date(a[1].start).getTime())
  }, [assignments])

  function toggleIntern(id: string) {
    setSelectedInterns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!profile) return
    if (!form.title || !form.start_time || !form.end_time) {
      toast.error('Title, start time, and end time are required.')
      return
    }
    try {
      await createShift.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        shift_type: form.shift_type,
        rotation_id: form.rotation_id || null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        created_by: profile.id,
        assignee_ids: Array.from(selectedInterns),
      })
      toast.success('Shift created')
      setOpen(false)
      setForm({ title: '', description: '', location: '', shift_type: 'clinical', rotation_id: '', start_time: '', end_time: '' })
      setSelectedInterns(new Set())
    } catch (e) {
      toast.error('Could not create shift', { description: (e as Error).message })
    }
  }

  async function handleDeleteShift(id: string) {
    try {
      await deleteShift.mutateAsync(id)
      toast.success('Shift deleted')
    } catch (e) {
      toast.error('Could not delete shift', { description: (e as Error).message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New shift
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create shift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start time</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End time</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.shift_type} onValueChange={(v) => setForm({ ...form, shift_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinical">Clinical</SelectItem>
                      <SelectItem value="lecture">Lecture</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="on_call">On-call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rotation (optional)</Label>
                <Select value={form.rotation_id} onValueChange={(v) => setForm({ ...form, rotation_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rotations ?? []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Assign interns</Label>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2 scrollbar-thin">
                  {(interns ?? []).map((intern) => (
                    <label key={intern.id} className="flex items-center gap-2 rounded p-1.5 text-sm hover:bg-accent">
                      <Checkbox checked={selectedInterns.has(intern.id)} onCheckedChange={() => toggleIntern(intern.id)} />
                      {intern.full_name}
                    </label>
                  ))}
                  {(interns ?? []).length === 0 && <p className="p-1.5 text-sm text-muted-foreground">No interns found.</p>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createShift.isPending}>
                Create shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : shiftGroups.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No shifts created yet.</p>
          ) : (
            <div className="space-y-3">
              {shiftGroups.map(([shiftId, group]) => (
                <div key={shiftId} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{group.shiftTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(group.start)} – {formatDateTime(group.end)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteShift(shiftId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.assignees!.map((a) => (
                      <Badge key={a.id} variant="outline" className="capitalize">
                        {a.user?.full_name ?? 'Unknown'} · {a.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RotationsPanel() {
  const { profile } = useAuth()
  const { data: rotations, isLoading } = useRotations()
  const createRotation = useCreateRotation()
  const deleteRotation = useDeleteRotation()
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({ name: '', department: '', description: '', location: '', start_date: '', end_date: '' })

  async function handleCreate() {
    if (!profile) return
    if (!form.name || !form.department || !form.start_date || !form.end_date) {
      toast.error('Name, department, and dates are required.')
      return
    }
    try {
      await createRotation.mutateAsync({ ...form, created_by: profile.id })
      toast.success('Rotation created')
      setOpen(false)
      setForm({ name: '', department: '', description: '', location: '', start_date: '', end_date: '' })
    } catch (e) {
      toast.error('Could not create rotation', { description: (e as Error).message })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRotation.mutateAsync(id)
      toast.success('Rotation deleted')
    } catch (e) {
      toast.error('Could not delete rotation', { description: (e as Error).message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New rotation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create rotation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createRotation.isPending}>
                Create rotation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rotations ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.department}</TableCell>
                    <TableCell>
                      {formatDate(r.start_date)} – {formatDate(r.end_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(r.id)}>
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
    </div>
  )
}
