import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateDrug, useDeleteDrug, useDrugSearch, useUpdateDrug } from '@/hooks/useDrugs'
import type { Drug } from '@/types/database'

const emptyForm = {
  generic_name: '',
  brand_names: '',
  drug_class: '',
  dosage_form: '',
  strength: '',
  storage_room: '',
  storage_shelf: '',
  storage_bin: '',
  is_controlled: false,
  is_refrigerated: false,
  is_high_alert: false,
  notes: '',
}

export default function AdminDrugLocatorPage() {
  const { profile } = useAuth()
  const { data: drugs, isLoading } = useDrugSearch('')
  const createDrug = useCreateDrug()
  const updateDrug = useUpdateDrug()
  const deleteDrug = useDeleteDrug()

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Drug | null>(null)
  const [form, setForm] = React.useState(emptyForm)

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(d: Drug) {
    setEditing(d)
    setForm({
      generic_name: d.generic_name,
      brand_names: d.brand_names.join(', '),
      drug_class: d.drug_class ?? '',
      dosage_form: d.dosage_form ?? '',
      strength: d.strength ?? '',
      storage_room: d.storage_room,
      storage_shelf: d.storage_shelf ?? '',
      storage_bin: d.storage_bin ?? '',
      is_controlled: d.is_controlled,
      is_refrigerated: d.is_refrigerated,
      is_high_alert: d.is_high_alert,
      notes: d.notes ?? '',
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!profile) return
    if (!form.generic_name || !form.storage_room) {
      toast.error('Generic name and storage room are required.')
      return
    }
    const payload = {
      generic_name: form.generic_name,
      brand_names: form.brand_names
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean),
      drug_class: form.drug_class || null,
      dosage_form: form.dosage_form || null,
      strength: form.strength || null,
      storage_room: form.storage_room,
      storage_shelf: form.storage_shelf || null,
      storage_bin: form.storage_bin || null,
      is_controlled: form.is_controlled,
      is_refrigerated: form.is_refrigerated,
      is_high_alert: form.is_high_alert,
      notes: form.notes || null,
    }
    try {
      if (editing) {
        await updateDrug.mutateAsync({ id: editing.id, ...payload })
        toast.success('Medication updated')
      } else {
        await createDrug.mutateAsync({ ...payload, created_by: profile.id })
        toast.success('Medication added')
      }
      setOpen(false)
    } catch (e) {
      toast.error('Could not save medication', { description: (e as Error).message })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDrug.mutateAsync(id)
      toast.success('Medication removed')
    } catch (e) {
      toast.error('Could not remove medication', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Drug Locator"
        description="Manage the medication storage directory."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Add medication
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Generic name</TableHead>
                  <TableHead>Brands</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(drugs ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium capitalize">{d.generic_name}</TableCell>
                    <TableCell>{d.brand_names.join(', ') || '—'}</TableCell>
                    <TableCell>
                      {d.storage_room}
                      {d.storage_shelf ? ` · Shelf ${d.storage_shelf}` : ''}
                      {d.storage_bin ? ` · Bin ${d.storage_bin}` : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(d.id)}>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit medication' : 'Add medication'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Generic name</Label>
                <Input value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Brand names (comma separated)</Label>
                <Input value={form.brand_names} onChange={(e) => setForm({ ...form, brand_names: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Drug class</Label>
                <Input value={form.drug_class} onChange={(e) => setForm({ ...form, drug_class: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Dosage form</Label>
                <Input value={form.dosage_form} onChange={(e) => setForm({ ...form, dosage_form: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Strength</Label>
                <Input value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Storage room</Label>
                <Input value={form.storage_room} onChange={(e) => setForm({ ...form, storage_room: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Shelf</Label>
                <Input value={form.storage_shelf} onChange={(e) => setForm({ ...form, storage_shelf: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bin</Label>
                <Input value={form.storage_bin} onChange={(e) => setForm({ ...form, storage_bin: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_controlled} onCheckedChange={(v) => setForm({ ...form, is_controlled: !!v })} />
                Controlled substance
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_refrigerated} onCheckedChange={(v) => setForm({ ...form, is_refrigerated: !!v })} />
                Refrigerated
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_high_alert} onCheckedChange={(v) => setForm({ ...form, is_high_alert: !!v })} />
                High alert
              </label>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={createDrug.isPending || updateDrug.isPending}>
              {editing ? 'Save changes' : 'Add medication'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
