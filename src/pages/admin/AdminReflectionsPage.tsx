import * as React from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllReflections, useReviewReflection } from '@/hooks/useReflections'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import type { ReflectionStatus } from '@/types/database'

const statusVariant: Record<ReflectionStatus, 'secondary' | 'default' | 'success'> = {
  draft: 'secondary',
  submitted: 'default',
  reviewed: 'success',
}

export default function AdminReflectionsPage() {
  const { profile } = useAuth()
  const { data: reflections, isLoading } = useAllReflections()
  const reviewReflection = useReviewReflection()
  const [filter, setFilter] = React.useState<'submitted' | 'reviewed' | 'all'>('submitted')
  const [feedback, setFeedback] = React.useState<Record<string, string>>({})

  const filtered = (reflections ?? []).filter((r) => {
    if (filter === 'all') return r.status !== 'draft'
    return r.status === filter
  })

  async function handleReview(id: string) {
    if (!profile) return
    const text = feedback[id]?.trim()
    if (!text) {
      toast.error('Add feedback before marking as reviewed.')
      return
    }
    try {
      await reviewReflection.mutateAsync({ id, reviewer_id: profile.id, reviewer_feedback: text })
      toast.success('Reflection reviewed')
    } catch (e) {
      toast.error('Could not submit review', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader title="Reflections" description="Review intern clinical learning logs." />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-5">
        <TabsList>
          <TabsTrigger value="submitted">Pending review</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="all">All submitted</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">Nothing here right now.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.author?.full_name} · {formatDate(r.entry_date)}
                    </p>
                  </div>
                  <Badge variant={statusVariant[r.status]} className="capitalize">
                    {r.status}
                  </Badge>
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{r.content}</p>

                {r.status === 'reviewed' ? (
                  <div className="rounded-lg bg-accent/60 p-3 text-sm">
                    <p className="mb-1 font-medium">Your feedback</p>
                    <p className="text-muted-foreground">{r.reviewer_feedback}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write feedback for this reflection..."
                      rows={2}
                      value={feedback[r.id] ?? ''}
                      onChange={(e) => setFeedback((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => handleReview(r.id)} disabled={reviewReflection.isPending}>
                      Submit review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
