import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import {
  useAllCounselingCases,
  useCreateCounselingCase,
  useDeleteCounselingCase,
  useUpdateCounselingCase,
} from '@/hooks/useCounseling'
import type { CaseDifficulty, CounselingCase, CounselingKeyPoint } from '@/types/database'

const emptyForm = {
  title: '',
  patient_name: '',
  patient_age: '',
  patient_gender: '',
  medication: '',
  scenario: '',
  difficulty: 'beginner' as CaseDifficulty,
  learning_objectives: '',
  common_pitfalls: '',
  is_active: true,
}

let pointIdCounter = 0
function newPointId() {
  pointIdCounter += 1
  return `p${Date.now()}${pointIdCounter}`
}

export default function AdminCounselingCasesPage() {
  const { profile } = useAuth()
  const { data: cases, isLoading } = useAllCounselingCases()
  const createCase = useCreateCounselingCase()
  const updateCase = useUpdateCounselingCase()
  const deleteCase = useDeleteCounselingCase()

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CounselingCase | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [points, setPoints] = React.useState<CounselingKeyPoint[]>([{ id: newPointId(), label: '', detail: '' }])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setPoints([{ id: newPointId(), label: '', detail: '' }])
    setOpen(true)
  }

  function openEdit(c: CounselingCase) {
    setEditing(c)
    setForm({
      title: c.title,
      patient_name: c.patient_name,
      patient_age: c.patient_age?.toString() ?? '',
      patient_gender: c.patient_gender ?? '',
      medication: c.medication,
      scenario: c.scenario,
      difficulty: c.difficulty,
      learning_objectives: c.learning_objectives.join('\n'),
      common_pitfalls: c.common_pitfalls ?? '',
      is_active: c.is_active,
    })
    setPoints(c.key_counseling_points.length > 0 ? c.key_counseling_points : [{ id: newPointId(), label: '', detail: '' }])
    setOpen(true)
  }

  async function handleSave() {
    if (!profile) return
    if (!form.title || !form.patient_name || !form.medication || !form.scenario) {
      toast.error('Please fill in all required fields.')
      return
    }
    const cleanPoints = points.filter((p) => p.label.trim())
    if (cleanPoints.length === 0) {
      toast.error('Add at least one key counseling point.')
      return
    }
    const payload = {
      title: form.title,
      patient_name: form.patient_name,
      patient_age: form.patient_age ? Number(form.patient_age) : null,
      patient_gender: form.patient_gender || null,
      medication: form.medication,
      scenario: form.scenario,
      difficulty: form.difficulty,
      learning_objectives: form.learning_objectives.split('\n').map((s) => s.trim()).filter(Boolean),
      key_counseling_points: cleanPoints,
      common_pitfalls: form.common_pitfalls || null,
      is_active: form.is_active,
    }
    try {
      if (editing) {
        await updateCase.mutateAsync({ id: editing.id, ...payload })
        toast.success('Case updated')
      } else {
        await createCase.mutateAsync({ ...payload, created_by: profile.id })
        toast.success('Case created')
      }
      setOpen(false)
    } catch (e) {
      toast.error('Could not save case', { description: (e as Error).message })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCase.mutateAsync(id)
      toast.success('Case deleted')
    } catch (e) {
      toast.error('Could not delete case', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Counseling Cases"
        description="Manage virtual patient counseling scenarios."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New case
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(cases ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.title}</p>
                  <Badge variant={c.is_active ? 'success' : 'secondary'}>{c.is_active ? 'Active' : 'Draft'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {c.difficulty} · {c.medication}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.scenario}</p>
                <div className="flex justify-end gap-1 pt-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit case' : 'New counseling case'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Case title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Medication</Label>
                <Input value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Patient name</Label>
                <Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" value={form.patient_age} onChange={(e) => setForm({ ...form, patient_age: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Input value={form.patient_gender} onChange={(e) => setForm({ ...form, patient_gender: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as CaseDifficulty })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active (visible to interns)</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scenario</Label>
              <Textarea rows={4} value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Learning objectives (one per line)</Label>
              <Textarea
                rows={3}
                value={form.learning_objectives}
                onChange={(e) => setForm({ ...form, learning_objectives: e.target.value })}
              />
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label>Key counseling points</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPoints((prev) => [...prev, { id: newPointId(), label: '', detail: '' }])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add point
                </Button>
              </div>
              {points.map((p, idx) => (
                <div key={p.id} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Point label (e.g. Take with food)"
                      value={p.label}
                      onChange={(e) => setPoints((prev) => prev.map((pt, i) => (i === idx ? { ...pt, label: e.target.value } : pt)))}
                    />
                    <Input
                      placeholder="Detail (optional)"
                      value={p.detail}
                      onChange={(e) => setPoints((prev) => prev.map((pt, i) => (i === idx ? { ...pt, detail: e.target.value } : pt)))}
                    />
                  </div>
                  {points.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setPoints((prev) => prev.filter((_, i) => i !== idx))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Common pitfalls (optional)</Label>
              <Textarea rows={2} value={form.common_pitfalls} onChange={(e) => setForm({ ...form, common_pitfalls: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={createCase.isPending || updateCase.isPending}>
              {editing ? 'Save changes' : 'Create case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
