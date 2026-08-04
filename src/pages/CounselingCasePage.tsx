import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, User, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useCounselingCase, useSubmitCounselingAttempt } from '@/hooks/useCounseling'
import { PatientChat } from '@/components/PatientChat'
import { toast } from 'sonner'
import type { CaseDifficulty } from '@/types/database'

const difficultyVariant: Record<CaseDifficulty, 'success' | 'warning' | 'destructive'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
}

export default function CounselingCasePage() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const { data: c, isLoading } = useCounselingCase(caseId)
  const submitAttempt = useSubmitCounselingAttempt()

  const [startedAt] = React.useState(() => Date.now())
  const [covered, setCovered] = React.useState<Set<string>>(new Set())
  const [mcqAnswers, setMcqAnswers] = React.useState<Record<string, number>>({})
  const [result, setResult] = React.useState<{ score: number; points_awarded: number; mcq_score: number | null; mcq_total: number | null } | null>(
    null
  )

  function toggle(pointId: string) {
    setCovered((prev) => {
      const next = new Set(prev)
      if (next.has(pointId)) next.delete(pointId)
      else next.add(pointId)
      return next
    })
  }

  async function handleSubmit() {
    if (!c) return
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000)
    try {
      const attempt = await submitAttempt.mutateAsync({
        caseId: c.id,
        coveredPointIds: Array.from(covered),
        durationSeconds,
        mcqAnswers: Object.entries(mcqAnswers).map(([question_id, selected_index]) => ({ question_id, selected_index })),
      })
      setResult({
        score: attempt.score,
        points_awarded: attempt.points_awarded,
        mcq_score: attempt.mcq_score,
        mcq_total: attempt.mcq_total,
      })
      toast.success('Case completed!')
    } catch (e) {
      toast.error('Could not submit attempt', { description: (e as Error).message })
    }
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  if (!c) {
    return (
      <div>
        <PageHeader title="Case not found" />
        <Button variant="outline" onClick={() => navigate('/counseling-simulator')}>
          <ArrowLeft className="h-4 w-4" /> Back to cases
        </Button>
      </div>
    )
  }

  const canSubmit = covered.size > 0 || Object.keys(mcqAnswers).length === c.questions.length

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate('/counseling-simulator')}>
        <ArrowLeft className="h-4 w-4" /> All cases
      </Button>

      <PageHeader
        title={c.title}
        description={`${c.medication} counseling scenario`}
        actions={
          <Badge variant={difficultyVariant[c.difficulty]} className="capitalize">
            {c.difficulty}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" /> Patient: {c.patient_name}
                {c.patient_age ? `, ${c.patient_age}` : ''} {c.patient_gender ? `(${c.patient_gender})` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line text-sm">{c.scenario}</p>

              {c.learning_objectives.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Learning Objectives</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {c.learning_objectives.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <PatientChat case={c} />

          {c.questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" /> Knowledge Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {c.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium">
                      {idx + 1}. {q.question}
                    </p>
                    <RadioGroup
                      value={mcqAnswers[q.id]?.toString()}
                      onValueChange={(v) => setMcqAnswers((prev) => ({ ...prev, [q.id]: Number(v) }))}
                      disabled={!!result}
                    >
                      {q.choices.map((choice, choiceIdx) => {
                        const isCorrect = choiceIdx === q.correct_index
                        const isSelected = mcqAnswers[q.id] === choiceIdx
                        return (
                          <div key={choiceIdx} className="flex items-center gap-2">
                            <RadioGroupItem value={choiceIdx.toString()} id={`${q.id}-${choiceIdx}`} />
                            <Label
                              htmlFor={`${q.id}-${choiceIdx}`}
                              className={
                                result && isCorrect
                                  ? 'font-medium text-success'
                                  : result && isSelected && !isCorrect
                                    ? 'text-destructive line-through'
                                    : 'font-normal'
                              }
                            >
                              {choice}
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                    {result && q.explanation && <p className="text-xs text-muted-foreground">{q.explanation}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Counseling Checklist</CardTitle>
            <p className="text-xs text-muted-foreground">Check each point as you cover it with the patient.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {result ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall score</span>
                  <span className="font-semibold">{result.score}%</span>
                </div>
                <Progress value={result.score} />
                {result.mcq_total ? (
                  <p className="text-xs text-muted-foreground">
                    Knowledge check: {result.mcq_score}/{result.mcq_total} correct
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">+{result.points_awarded} points earned</p>

                {c.key_counseling_points.map((p) => (
                  <div key={p.id} className="flex items-start gap-2 rounded-lg border p-2.5">
                    {covered.has(p.id) ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.detail}</p>
                    </div>
                  </div>
                ))}

                {c.common_pitfalls && (
                  <div className="rounded-lg bg-accent/60 p-3 text-sm">
                    <p className="mb-1 font-medium">Common pitfalls</p>
                    <p className="text-muted-foreground">{c.common_pitfalls}</p>
                  </div>
                )}

                <Button className="w-full" variant="outline" onClick={() => navigate('/counseling-simulator')}>
                  Back to cases
                </Button>
              </div>
            ) : (
              <>
                {c.key_counseling_points.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 hover:bg-accent"
                  >
                    <Checkbox checked={covered.has(p.id)} onCheckedChange={() => toggle(p.id)} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                    </div>
                  </label>
                ))}
                <Button className="w-full" onClick={handleSubmit} disabled={submitAttempt.isPending || !canSubmit}>
                  Submit counseling session
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
