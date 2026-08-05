import * as React from 'react'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, Loader2, Plus, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import {
  useBulkImportDrugsOfDay,
  useCreateDrugOfDay,
  useDeleteDrugOfDay,
  useDrugOfDayHistory,
  type DrugOfDayImportRow,
} from '@/hooks/useDrugOfDay'
import { parseSpreadsheetFile, downloadCsvTemplate, type ParsedRow } from '@/lib/bulkImport'
import { nextAvailableDates } from '@/lib/drugOfDaySchedule'
import { formatDate } from '@/lib/utils'

const DRUG_IMPORT_HEADERS = [
  'drug_name',
  'generic_name',
  'drug_class',
  'mechanism',
  'indications',
  'contraindications',
  'counseling_points',
]

interface QuestionDraft {
  question: string
  choices: string[]
  correct_index: number
  explanation: string
}

const emptyQuestion = (): QuestionDraft => ({ question: '', choices: ['', ''], correct_index: 0, explanation: '' })

export default function AdminDrugOfDayPage() {
  const { profile } = useAuth()
  const { data: history, isLoading } = useDrugOfDayHistory()
  const createDrug = useCreateDrugOfDay()
  const deleteDrug = useDeleteDrugOfDay()

  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    drug_name: '',
    generic_name: '',
    drug_class: '',
    mechanism: '',
    indications: '',
    contraindications: '',
    counseling_points: '',
    publish_date: new Date().toISOString().slice(0, 10),
  })
  const [questions, setQuestions] = React.useState<QuestionDraft[]>([emptyQuestion()])

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  function updateChoice(qIdx: number, choiceIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, choices: q.choices.map((c, ci) => (ci === choiceIdx ? value : c)) } : q))
    )
  }

  function addChoice(qIdx: number) {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, choices: [...q.choices, ''] } : q)))
  }

  function removeChoice(qIdx: number, choiceIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              choices: q.choices.filter((_, ci) => ci !== choiceIdx),
              correct_index: q.correct_index >= choiceIdx && q.correct_index > 0 ? q.correct_index - 1 : q.correct_index,
            }
          : q
      )
    )
  }

  async function handleCreate() {
    if (!profile) return
    if (!form.drug_name || !form.mechanism || !form.indications || !form.contraindications || !form.counseling_points) {
      toast.error('Please fill in all required fields.')
      return
    }
    const cleanQuestions = questions.filter((q) => q.question.trim() && q.choices.every((c) => c.trim()))
    try {
      await createDrug.mutateAsync({
        ...form,
        created_by: profile.id,
        questions: cleanQuestions.map((q) => ({
          question: q.question,
          choices: q.choices,
          correct_index: q.correct_index,
          explanation: q.explanation || undefined,
        })),
      })
      toast.success('Drug of the Day published')
      setOpen(false)
      setForm({
        drug_name: '',
        generic_name: '',
        drug_class: '',
        mechanism: '',
        indications: '',
        contraindications: '',
        counseling_points: '',
        publish_date: new Date().toISOString().slice(0, 10),
      })
      setQuestions([emptyQuestion()])
    } catch (e) {
      toast.error('Could not publish', { description: (e as Error).message })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDrug.mutateAsync(id)
      toast.success('Deleted')
    } catch (e) {
      toast.error('Could not delete', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Drug of the Day"
        description="Publish daily clinical spotlights with knowledge checks."
        actions={
          <div className="flex items-center gap-2">
            <BulkImportDrugsDialog existingDates={(history ?? []).map((d) => d.publish_date)} />
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Publish new
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Publish Drug of the Day</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Drug name</Label>
                    <Input value={form.drug_name} onChange={(e) => setForm({ ...form, drug_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Publish date</Label>
                    <Input type="date" value={form.publish_date} onChange={(e) => setForm({ ...form, publish_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Generic name</Label>
                    <Input value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Drug class</Label>
                    <Input value={form.drug_class} onChange={(e) => setForm({ ...form, drug_class: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mechanism of action</Label>
                  <Textarea rows={2} value={form.mechanism} onChange={(e) => setForm({ ...form, mechanism: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Indications</Label>
                  <Textarea rows={2} value={form.indications} onChange={(e) => setForm({ ...form, indications: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contraindications</Label>
                  <Textarea rows={2} value={form.contraindications} onChange={(e) => setForm({ ...form, contraindications: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Counseling points</Label>
                  <Textarea rows={2} value={form.counseling_points} onChange={(e) => setForm({ ...form, counseling_points: e.target.value })} />
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Label>Quiz questions</Label>
                    <Button variant="outline" size="sm" onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>
                      <Plus className="h-3.5 w-3.5" /> Add question
                    </Button>
                  </div>
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-2 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">Question {qIdx + 1}</p>
                        {questions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIdx))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Question text"
                        value={q.question}
                        onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                      />
                      <RadioGroup
                        value={q.correct_index.toString()}
                        onValueChange={(v) => updateQuestion(qIdx, { correct_index: Number(v) })}
                      >
                        {q.choices.map((choice, choiceIdx) => (
                          <div key={choiceIdx} className="flex items-center gap-2">
                            <RadioGroupItem value={choiceIdx.toString()} id={`q${qIdx}-c${choiceIdx}`} />
                            <Input
                              placeholder={`Choice ${choiceIdx + 1}`}
                              value={choice}
                              onChange={(e) => updateChoice(qIdx, choiceIdx, e.target.value)}
                            />
                            {q.choices.length > 2 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeChoice(qIdx, choiceIdx)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                      <Button variant="ghost" size="sm" onClick={() => addChoice(qIdx)}>
                        <Plus className="h-3.5 w-3.5" /> Add choice
                      </Button>
                      <Input
                        placeholder="Explanation (optional)"
                        value={q.explanation}
                        onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createDrug.isPending}>
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
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
                  <TableHead>Drug</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Publish Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(history ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.drug_name}</TableCell>
                    <TableCell>{d.drug_class || '—'}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {formatDate(d.publish_date)}
                      {d.publish_date > new Date().toISOString().slice(0, 10) && (
                        <Badge variant="secondary">Upcoming</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
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
    </div>
  )
}

function BulkImportDrugsDialog({ existingDates }: { existingDates: string[] }) {
  const { profile } = useAuth()
  const bulkImport = useBulkImportDrugsOfDay()
  const [open, setOpen] = React.useState(false)
  const [rows, setRows] = React.useState<DrugOfDayImportRow[] | null>(null)
  const [fileName, setFileName] = React.useState('')
  const [parseError, setParseError] = React.useState<string | null>(null)

  function mapRow(row: ParsedRow): DrugOfDayImportRow | null {
    if (!row.drug_name || !row.mechanism || !row.indications || !row.contraindications || !row.counseling_points) {
      return null
    }
    return {
      drug_name: row.drug_name.trim(),
      generic_name: row.generic_name?.trim() || undefined,
      drug_class: row.drug_class?.trim() || undefined,
      mechanism: row.mechanism.trim(),
      indications: row.indications.trim(),
      contraindications: row.contraindications.trim(),
      counseling_points: row.counseling_points.trim(),
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
      const mapped = parsed.map(mapRow).filter((r): r is DrugOfDayImportRow => r !== null)
      if (mapped.length === 0) {
        setParseError(
          'No valid rows found. Make sure drug_name, mechanism, indications, contraindications, and counseling_points columns are filled in.'
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

  const dates = rows ? nextAvailableDates(rows.length, existingDates) : []

  async function handleImport() {
    if (!profile || !rows) return
    try {
      const count = await bulkImport.mutateAsync({ rows, publishDates: dates, created_by: profile.id })
      toast.success(`Scheduled ${count} drugs, starting ${formatDate(dates[0])}`)
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
          <DialogTitle>Bulk import Drug of the Day</DialogTitle>
          <DialogDescription>
            Upload a .csv or .xlsx file with one drug per row. Publish dates are assigned automatically — one
            drug per day, starting today, skipping any date that's already scheduled. Quiz questions aren't
            included in bulk import; add them per-drug afterward if you want a knowledge check that day.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCsvTemplate(DRUG_IMPORT_HEADERS, 'drug-of-day-import-template.csv', [
                'Metformin',
                'Metformin hydrochloride',
                'Biguanide',
                'Decreases hepatic glucose production and improves insulin sensitivity.',
                'First-line therapy for type 2 diabetes mellitus.',
                'Severe renal impairment, metabolic acidosis.',
                'Take with food to reduce GI upset. Report muscle pain or unusual fatigue.',
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
              <p className="text-sm font-medium">
                {rows.length} drugs ready — will publish {formatDate(dates[0])} through {formatDate(dates[dates.length - 1])}
              </p>
              <div className="max-h-64 overflow-y-auto rounded-lg border scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drug</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Publish Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 20).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.drug_name}</TableCell>
                        <TableCell>{r.drug_class || '—'}</TableCell>
                        <TableCell>{formatDate(dates[i])}</TableCell>
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
            Import {rows ? rows.length : ''} drugs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
