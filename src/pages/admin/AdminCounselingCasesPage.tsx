import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, X, Loader2, FileSpreadsheet, Download } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  useAllCounselingCases,
  useCreateCounselingCase,
  useDeleteCounselingCase,
  useUpdateCounselingCase,
  useBulkImportCounselingCases,
  type CounselingQuestionInput,
  type CounselingCaseImportRow,
} from '@/hooks/useCounseling'
import { supabase } from '@/lib/supabase'
import { parseSpreadsheetFile, downloadCsvTemplate, type ParsedRow } from '@/lib/bulkImport'
import type { CaseDifficulty, CounselingCase, CounselingCaseQuestion, CounselingKeyPoint } from '@/types/database'

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

let idCounter = 0
function newLocalId(prefix: string) {
  idCounter += 1
  return `${prefix}${Date.now()}${idCounter}`
}

const emptyQuestion = (): CounselingQuestionInput => ({ question: '', choices: ['', ''], correct_index: 0, explanation: '' })

const CASE_IMPORT_HEADERS = [
  'title',
  'patient_name',
  'patient_age',
  'patient_gender',
  'medication',
  'scenario',
  'difficulty',
  'learning_objectives',
  'counseling_points',
  'common_pitfalls',
]

export default function AdminCounselingCasesPage() {
  const { profile } = useAuth()
  const { data: cases, isLoading } = useAllCounselingCases()
  const createCase = useCreateCounselingCase()
  const updateCase = useUpdateCounselingCase()
  const deleteCase = useDeleteCounselingCase()

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CounselingCase | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [points, setPoints] = React.useState<CounselingKeyPoint[]>([{ id: newLocalId('p'), label: '', detail: '' }])
  const [questions, setQuestions] = React.useState<CounselingQuestionInput[]>([])
  const [loadingQuestions, setLoadingQuestions] = React.useState(false)

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setPoints([{ id: newLocalId('p'), label: '', detail: '' }])
    setQuestions([])
    setOpen(true)
  }

  async function openEdit(c: CounselingCase) {
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
    setPoints(c.key_counseling_points.length > 0 ? c.key_counseling_points : [{ id: newLocalId('p'), label: '', detail: '' }])
    setOpen(true)
    setLoadingQuestions(true)
    const { data } = await supabase
      .from('counseling_case_questions')
      .select('*')
      .eq('case_id', c.id)
      .order('order_index', { ascending: true })
    setQuestions(
      ((data as CounselingCaseQuestion[]) ?? []).map((q) => ({
        question: q.question,
        choices: q.choices,
        correct_index: q.correct_index,
        explanation: q.explanation,
      }))
    )
    setLoadingQuestions(false)
  }

  function updateQuestion(idx: number, patch: Partial<CounselingQuestionInput>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  function updateChoice(qIdx: number, choiceIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, choices: q.choices.map((c, ci) => (ci === choiceIdx ? value : c)) } : q))
    )
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
    const cleanQuestions = questions.filter((q) => q.question.trim() && q.choices.every((c) => c.trim()))
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
      questions: cleanQuestions,
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
          <div className="flex gap-2">
            <BulkImportCasesDialog />
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> New case
            </Button>
          </div>
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
                  onClick={() => setPoints((prev) => [...prev, { id: newLocalId('p'), label: '', detail: '' }])}
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

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label>Knowledge check (MCQ, optional)</Label>
                <Button variant="outline" size="sm" onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>
                  <Plus className="h-3.5 w-3.5" /> Add question
                </Button>
              </div>
              {loadingQuestions ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                questions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Question {qIdx + 1}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIdx))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input placeholder="Question text" value={q.question} onChange={(e) => updateQuestion(qIdx, { question: e.target.value })} />
                    <RadioGroup value={q.correct_index.toString()} onValueChange={(v) => updateQuestion(qIdx, { correct_index: Number(v) })}>
                      {q.choices.map((choice, choiceIdx) => (
                        <div key={choiceIdx} className="flex items-center gap-2">
                          <RadioGroupItem value={choiceIdx.toString()} id={`cq${qIdx}-c${choiceIdx}`} />
                          <Input
                            placeholder={`Choice ${choiceIdx + 1}`}
                            value={choice}
                            onChange={(e) => updateChoice(qIdx, choiceIdx, e.target.value)}
                          />
                          {q.choices.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => updateQuestion(qIdx, { choices: q.choices.filter((_, ci) => ci !== choiceIdx) })}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                    <Button variant="ghost" size="sm" onClick={() => updateQuestion(qIdx, { choices: [...q.choices, ''] })}>
                      <Plus className="h-3.5 w-3.5" /> Add choice
                    </Button>
                    <Input
                      placeholder="Explanation (optional)"
                      value={q.explanation ?? ''}
                      onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                    />
                  </div>
                ))
              )}
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

function BulkImportCasesDialog() {
  const { profile } = useAuth()
  const bulkImport = useBulkImportCounselingCases()
  const [open, setOpen] = React.useState(false)
  const [rows, setRows] = React.useState<CounselingCaseImportRow[] | null>(null)
  const [fileName, setFileName] = React.useState('')
  const [parseError, setParseError] = React.useState<string | null>(null)

  function mapRow(row: ParsedRow): CounselingCaseImportRow | null {
    if (!row.title || !row.patient_name || !row.medication || !row.scenario) return null
    const difficulty = (['beginner', 'intermediate', 'advanced'] as const).includes(row.difficulty?.toLowerCase().trim() as CaseDifficulty)
      ? (row.difficulty.toLowerCase().trim() as CaseDifficulty)
      : 'beginner'
    const points = (row.counseling_points ?? '')
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [label, detail] = entry.split('|').map((s) => s.trim())
        return { id: newLocalId('p'), label: label ?? entry, detail: detail ?? '' }
      })
    return {
      title: row.title.trim(),
      patient_name: row.patient_name.trim(),
      patient_age: row.patient_age ? Number(row.patient_age) : null,
      patient_gender: row.patient_gender?.trim() || null,
      medication: row.medication.trim(),
      scenario: row.scenario.trim(),
      difficulty,
      learning_objectives: (row.learning_objectives ?? '')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
      key_counseling_points: points.length > 0 ? points : [{ id: newLocalId('p'), label: 'Review medication use', detail: '' }],
      common_pitfalls: row.common_pitfalls?.trim() || null,
      is_active: true,
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError(null)
    setRows(null)
    try {
      const parsed = await parseSpreadsheetFile(file)
      const mapped = parsed.map(mapRow).filter((r): r is CounselingCaseImportRow => r !== null)
      if (mapped.length === 0) {
        setParseError('No valid rows found. Make sure title, patient_name, medication, and scenario columns are filled in.')
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
    try {
      const count = await bulkImport.mutateAsync({ rows, created_by: profile.id })
      toast.success(`Imported ${count} cases`)
      setOpen(false)
      setRows(null)
      setFileName('')
    } catch (err) {
      toast.error('Import failed', { description: (err as Error).message })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setRows(null)
          setFileName('')
          setParseError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="h-4 w-4" /> Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import counseling cases</DialogTitle>
          <DialogDescription>
            Upload a .csv or .xlsx file. Use <code>;</code> to separate multiple learning objectives or counseling
            points, and <code>|</code> within a counseling point to separate its label from its detail (e.g.{' '}
            <code>Take with food|Reduces GI upset</code>).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCsvTemplate(CASE_IMPORT_HEADERS, 'counseling-case-import-template.csv', [
                'Metformin counseling',
                'John Doe',
                '58',
                'male',
                'Metformin',
                'Newly diagnosed T2DM patient starting metformin therapy.',
                'beginner',
                'Explain mechanism of action;Discuss GI side effects',
                'Take with food|Reduces GI upset;Watch for hypoglycemia signs|Rare with metformin alone',
                'Forgetting to ask about renal function',
              ])
            }
          >
            <Download className="h-3.5 w-3.5" /> Download CSV template
          </Button>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center hover:bg-accent">
            <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium">{fileName || 'Click to choose a .csv or .xlsx file'}</span>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
          </label>

          {parseError && <p className="text-sm text-destructive">{parseError}</p>}

          {rows && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{rows.length} cases ready to import</p>
              <div className="max-h-64 overflow-y-auto rounded-lg border scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 20).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>{r.medication}</TableCell>
                        <TableCell className="capitalize">{r.difficulty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={!rows || bulkImport.isPending}>
            {bulkImport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {rows ? rows.length : ''} cases
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
