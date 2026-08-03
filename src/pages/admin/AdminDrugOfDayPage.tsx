import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateDrugOfDay, useDeleteDrugOfDay, useDrugOfDayHistory } from '@/hooks/useDrugOfDay'
import { formatDate } from '@/lib/utils'

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
                    <TableCell>{formatDate(d.publish_date)}</TableCell>
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
