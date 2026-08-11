import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Upload, X, Loader2, FileSpreadsheet, Download } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import {
  useCreateDrug,
  useDeleteDrug,
  useDrugSearch,
  useUpdateDrug,
  useBulkImportDrugs,
  useUploadDrugImage,
  useRemoveDrugImage,
  useDrugCategories,
  type DrugImportRow,
} from '@/hooks/useDrugs'
import { parseSpreadsheetFile, parseBoolean, downloadCsvTemplate, type ParsedRow } from '@/lib/bulkImport'
import { SUGGESTED_MEDICATION_CATEGORIES, OP_SITES, OP_SITE_COLORS } from '@/lib/constants'
import type { Drug, OpSite } from '@/types/database'

const emptyForm = {
  generic_name: '',
  brand_names: '',
  drug_class: '',
  category: '',
  op_site: '' as OpSite | '',
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
  const { data: existingCategories } = useDrugCategories()
  const createDrug = useCreateDrug()
  const updateDrug = useUpdateDrug()
  const deleteDrug = useDeleteDrug()
  const uploadImage = useUploadDrugImage()
  const removeImage = useRemoveDrugImage()

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Drug | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [uploadingImage, setUploadingImage] = React.useState(false)

  const categorySuggestions = React.useMemo(
    () => Array.from(new Set([...(existingCategories ?? []), ...SUGGESTED_MEDICATION_CATEGORIES])).sort(),
    [existingCategories]
  )

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
      category: d.category ?? '',
      op_site: d.op_site ?? '',
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
      category: form.category.trim() || null,
      op_site: form.op_site || null,
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
        await createDrug.mutateAsync({ ...payload, image_urls: [], created_by: profile.id })
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editing || !e.target.files || e.target.files.length === 0) return
    setUploadingImage(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(e.target.files)) {
        const url = await uploadImage.mutateAsync({ drugId: editing.id, file })
        urls.push(url)
      }
      const nextUrls = [...editing.image_urls, ...urls]
      await updateDrug.mutateAsync({ id: editing.id, image_urls: nextUrls })
      setEditing({ ...editing, image_urls: nextUrls })
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Could not upload image', { description: (err as Error).message })
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  async function handleRemoveImage(url: string) {
    if (!editing) return
    const remaining = editing.image_urls.filter((u) => u !== url)
    try {
      await removeImage.mutateAsync({ drugId: editing.id, url, remainingUrls: remaining })
      setEditing({ ...editing, image_urls: remaining })
      toast.success('Image removed')
    } catch (err) {
      toast.error('Could not remove image', { description: (err as Error).message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Drug Locator"
        description="Manage the medication storage directory."
        actions={
          <div className="flex gap-2">
            <BulkImportDialog />
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Add medication
            </Button>
          </div>
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
                  <TableHead>Site</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brands</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(drugs ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium capitalize">
                      <div className="flex items-center gap-2">
                        {d.image_urls[0] && (
                          <img src={d.image_urls[0]} alt="" className="h-8 w-8 rounded object-cover" />
                        )}
                        {d.generic_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {d.op_site ? <Badge className={OP_SITE_COLORS[d.op_site].badge}>{d.op_site}</Badge> : '—'}
                    </TableCell>
                    <TableCell>{d.category ? <Badge variant="secondary">{d.category}</Badge> : '—'}</TableCell>
                    <TableCell>{d.brand_names.join(', ') || '—'}</TableCell>
                    <TableCell>
                      {d.storage_room}
                      {d.storage_shelf ? ` · Shelf ${d.storage_shelf}` : ''}
                      {d.storage_bin ? ` · Column ${d.storage_bin}` : ''}
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
                <Label>Category / Zone</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  list="category-suggestions"
                  placeholder="e.g. Cardiology"
                />
                <datalist id="category-suggestions">
                  {categorySuggestions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Outpatient pharmacy</Label>
                <Select
                  value={form.op_site || 'none'}
                  onValueChange={(v) => setForm({ ...form, op_site: v === 'none' ? '' : (v as OpSite) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {OP_SITES.map((site) => (
                      <SelectItem key={site} value={site}>
                        {site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Column</Label>
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

            {editing && (
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2">
                  {editing.image_urls.map((url) => (
                    <div key={url} className="relative">
                      <img src={url} alt="" className="h-16 w-16 rounded-lg border object-cover" />
                      <button
                        onClick={() => handleRemoveImage(url)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-accent">
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="text-[10px]">Upload</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>
              </div>
            )}
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

function parseOpSite(value?: string): OpSite | null {
  const normalized = value?.trim().toUpperCase()
  return (OP_SITES as readonly string[]).includes(normalized ?? '') ? (normalized as OpSite) : null
}

/**
 * Bulk import accepts two header schemas, auto-detected per row:
 *  1. Shelf/zone export: storage_type, zone, column, shelf, position, name, flags, note
 *     (matches real pharmacy shelf-tracking exports)
 *  2. Generic template: generic_name, brand_names, drug_class, category, op_site,
 *     dosage_form, strength, storage_room, storage_shelf, storage_bin, is_controlled,
 *     is_refrigerated, is_high_alert, notes
 * Either schema may also include an `op_site` column (OP1/OP2/OP3).
 */
function mapImportRow(row: ParsedRow): DrugImportRow | null {
  if (row.name && row.zone) {
    const bin = [row.column, row.position].filter((v) => v && v.trim()).join('-')
    const flagsText = (row.flags ?? '').toLowerCase()
    const storageType = (row.storage_type ?? '').toLowerCase()
    return {
      generic_name: row.name.trim(),
      brand_names: [],
      drug_class: null,
      category: row.zone.trim() || null,
      op_site: parseOpSite(row.op_site),
      dosage_form: null,
      strength: null,
      storage_room: row.zone.trim(),
      storage_shelf: row.shelf?.trim() || null,
      storage_bin: bin || null,
      is_controlled: /controll|narcotic|vault/.test(flagsText) || /narcotic|vault/.test(storageType),
      is_refrigerated: /fridge|refrigerat/.test(flagsText) || /fridge|refrigerat/.test(storageType),
      is_high_alert: /high[\s-]?alert/.test(flagsText),
      notes: row.note?.trim() || null,
    }
  }

  if (!row.generic_name || !row.storage_room) return null
  return {
    generic_name: row.generic_name.trim(),
    brand_names: (row.brand_names ?? '')
      .split(/[,;]/)
      .map((b) => b.trim())
      .filter(Boolean),
    drug_class: row.drug_class?.trim() || null,
    category: row.category?.trim() || null,
    op_site: parseOpSite(row.op_site),
    dosage_form: row.dosage_form?.trim() || null,
    strength: row.strength?.trim() || null,
    storage_room: row.storage_room.trim(),
    storage_shelf: row.storage_shelf?.trim() || null,
    storage_bin: row.storage_bin?.trim() || null,
    is_controlled: parseBoolean(row.is_controlled),
    is_refrigerated: parseBoolean(row.is_refrigerated),
    is_high_alert: parseBoolean(row.is_high_alert),
    notes: row.notes?.trim() || null,
  }
}

function BulkImportDialog() {
  const { profile } = useAuth()
  const bulkImport = useBulkImportDrugs()
  const [open, setOpen] = React.useState(false)
  const [rows, setRows] = React.useState<DrugImportRow[] | null>(null)
  const [fileName, setFileName] = React.useState('')
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [bulkOpSite, setBulkOpSite] = React.useState<OpSite | ''>('')

  function resetSelection() {
    setRows(null)
    setFileName('')
    setParseError(null)
    setBulkOpSite('')
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError(null)
    setRows(null)
    try {
      const parsed = await parseSpreadsheetFile(file)
      const mapped = parsed.map(mapImportRow).filter((r): r is DrugImportRow => r !== null)
      if (mapped.length === 0) {
        setParseError(
          'No valid rows found. Expected either a "name"+"zone" shelf export, or a "generic_name"+"storage_room" template.'
        )
        return
      }
      setRows(mapped)
    } catch (err) {
      setParseError((err as Error).message)
    } finally {
      e.target.value = ''
    }
  }

  async function handleImport() {
    if (!profile || !rows) return
    const finalRows = bulkOpSite ? rows.map((r) => ({ ...r, op_site: bulkOpSite })) : rows
    try {
      const count = await bulkImport.mutateAsync({ rows: finalRows, created_by: profile.id })
      toast.success(`Imported ${count} medications`)
      setOpen(false)
      resetSelection()
    } catch (err) {
      toast.error('Import failed', { description: (err as Error).message })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetSelection()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="h-4 w-4" /> Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import medications</DialogTitle>
          <DialogDescription>
            Upload a .csv or .xlsx file. Either a shelf-tracking export (columns:{' '}
            <code>storage_type, zone, column, shelf, position, name, flags, note</code>) or the generic template
            below both work.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCsvTemplate(
                [
                  'generic_name',
                  'brand_names',
                  'drug_class',
                  'category',
                  'op_site',
                  'dosage_form',
                  'strength',
                  'storage_room',
                  'storage_shelf',
                  'storage_bin',
                  'is_controlled',
                  'is_refrigerated',
                  'is_high_alert',
                  'notes',
                ],
                'drug-import-template.csv',
                [
                  'Lisinopril',
                  'Prinivil, Zestril',
                  'ACE Inhibitor',
                  'Cardiology',
                  'OP1',
                  'tablet',
                  '10mg',
                  'Pharmacy A',
                  '3',
                  'B12',
                  'no',
                  'no',
                  'no',
                  'Example row — delete before importing',
                ]
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Download CSV template
          </Button>

          <div className="space-y-2">
            <Label>Outpatient pharmacy for this whole file (optional)</Label>
            <Select value={bulkOpSite || 'none'} onValueChange={(v) => setBulkOpSite(v === 'none' ? '' : (v as OpSite))}>
              <SelectTrigger className="sm:w-64">
                <SelectValue placeholder="Use each row's own op_site column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Use each row's own op_site column</SelectItem>
                {OP_SITES.map((site) => (
                  <SelectItem key={site} value={site}>
                    {site} — tag every row in this file
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center hover:bg-accent">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName || 'Click to choose a .csv or .xlsx file'}</span>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
            </label>
            {(fileName || rows) && (
              <Button variant="destructive" onClick={resetSelection}>
                <Trash2 className="h-4 w-4" /> Clear all
              </Button>
            )}
          </div>

          {parseError && <p className="text-sm text-destructive">{parseError}</p>}

          {rows && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{rows.length} medications ready to import</p>
              <div className="max-h-64 overflow-y-auto rounded-lg border scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Generic name</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 20).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.generic_name}</TableCell>
                        <TableCell>{bulkOpSite || r.op_site || '—'}</TableCell>
                        <TableCell>{r.category ?? '—'}</TableCell>
                        <TableCell>
                          {r.storage_room}
                          {r.storage_shelf ? ` · Shelf ${r.storage_shelf}` : ''}
                          {r.storage_bin ? ` · Column ${r.storage_bin}` : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rows.length > 20 && (
                  <p className="p-2 text-center text-xs text-muted-foreground">+{rows.length - 20} more not shown</p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={!rows || bulkImport.isPending}>
            {bulkImport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {rows ? rows.length : ''} medications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
