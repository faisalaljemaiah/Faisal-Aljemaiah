import * as React from 'react'
import { CheckCircle2, Pill, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useMyDrugOfDayCompletion, useSubmitDrugOfDayQuiz, useTodaysDrug, useDrugOfDayHistory } from '@/hooks/useDrugOfDay'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function DrugOfDayPage() {
  const { data: drug, isLoading } = useTodaysDrug()
  const { data: completion } = useMyDrugOfDayCompletion(drug?.id)
  const { data: history } = useDrugOfDayHistory()
  const submitQuiz = useSubmitDrugOfDayQuiz()

  const [answers, setAnswers] = React.useState<Record<string, number>>({})
  const [submitted, setSubmitted] = React.useState(false)

  const alreadyCompleted = !!completion

  async function handleSubmit() {
    if (!drug) return
    const payload = Object.entries(answers).map(([question_id, selected_index]) => ({ question_id, selected_index }))
    if (payload.length < drug.questions.length) {
      toast.error('Please answer every question before submitting.')
      return
    }
    try {
      await submitQuiz.mutateAsync({ drugOfDayId: drug.id, answers: payload })
      setSubmitted(true)
      toast.success('Quiz submitted!')
    } catch (e) {
      toast.error('Could not submit quiz', { description: (e as Error).message })
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Drug of the Day" description="Daily clinical spotlight and knowledge check." />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!drug) {
    return (
      <div>
        <PageHeader title="Drug of the Day" description="Daily clinical spotlight and knowledge check." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Pill className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No drug has been published yet</p>
            <p className="text-sm text-muted-foreground">Check back once an administrator publishes today&apos;s entry.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const showResults = alreadyCompleted || submitted

  return (
    <div>
      <PageHeader
        title="Drug of the Day"
        description={`Published ${formatDate(drug.publish_date)}`}
        actions={
          showResults ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </Badge>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Pill className="h-5 w-5 text-primary" /> {drug.drug_name}
              </CardTitle>
              {drug.generic_name && <p className="text-sm text-muted-foreground">{drug.generic_name}</p>}
            </CardHeader>
            <CardContent className="space-y-5">
              {drug.drug_class && (
                <div>
                  <Badge variant="secondary">{drug.drug_class}</Badge>
                </div>
              )}
              <Section title="Mechanism of Action" content={drug.mechanism} />
              <Section title="Indications" content={drug.indications} />
              <Section title="Contraindications" content={drug.contraindications} />
              <Section title="Counseling Points" content={drug.counseling_points} />
            </CardContent>
          </Card>

          {drug.questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Knowledge Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {showResults ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Your score</span>
                      <span className="font-semibold">
                        {completion?.score ?? 0} / {completion?.total_questions ?? drug.questions.length}
                      </span>
                    </div>
                    <Progress
                      value={((completion?.score ?? 0) / (completion?.total_questions || drug.questions.length)) * 100}
                    />
                    <p className="text-sm text-muted-foreground">
                      +{completion?.points_awarded ?? 0} points earned. Come back tomorrow for a new drug!
                    </p>
                  </div>
                ) : (
                  <>
                    {drug.questions.map((q, idx) => (
                      <div key={q.id} className="space-y-2">
                        <p className="text-sm font-medium">
                          {idx + 1}. {q.question}
                        </p>
                        <RadioGroup
                          value={answers[q.id]?.toString()}
                          onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: Number(val) }))}
                        >
                          {q.choices.map((choice, choiceIdx) => (
                            <div key={choiceIdx} className="flex items-center gap-2">
                              <RadioGroupItem value={choiceIdx.toString()} id={`${q.id}-${choiceIdx}`} />
                              <Label htmlFor={`${q.id}-${choiceIdx}`} className="font-normal">
                                {choice}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                    <Button onClick={handleSubmit} disabled={submitQuiz.isPending}>
                      Submit answers
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(history ?? [])
              .filter((h) => h.id !== drug.id)
              .slice(0, 10)
              .map((h) => (
                <div key={h.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{h.drug_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.publish_date)}</p>
                </div>
              ))}
            {(history ?? []).length <= 1 && <p className="text-sm text-muted-foreground">No past entries yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-foreground">{title}</h4>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{content}</p>
    </div>
  )
}
