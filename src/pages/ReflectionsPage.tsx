import * as React from 'react'
import { NotebookPen, Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useDeleteReflection, useMyReflections, useSaveReflection } from '@/hooks/useReflections'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Reflection, ReflectionStatus } from '@/types/database'

const statusVariant: Record<ReflectionStatus, 'secondary' | 'default' | 'success'> = {
  draft: 'secondary',
  submitted: 'default',
  reviewed: 'success',
}

export default function ReflectionsPage() {
  const { profile } = useAuth()
  const { data: reflections, isLoading } = useMyReflections()
  const saveReflection = useSaveReflection()
  const deleteReflection = useDeleteReflection()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Reflection | null>(null)
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [entryDate, setEntryDate] = React.useState(() => new Date().toISOString().slice(0, 10))

  function openNew() {
    setEditing(null)
    setTitle('')
    setContent('')
    setEntryDate(new Date().toISOString().slice(0, 10))
    setDialogOpen(true)
  }

  function openEdit(r: Reflection) {
    setEditing(r)
    setTitle(r.title)
    setContent(r.content)
    setEntryDate(r.entry_date)
    setDialogOpen(true)
  }

  async function handleSave(status: ReflectionStatus) {
    if (!profile) return
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.')
      return
    }
    try {
      await saveReflection.mutateAsync({
        id: editing?.id,
        user_id: profile.id,
        title,
        content,
        entry_date: entryDate,
        status,
      })
      toast.success(status === 'draft' ? 'Draft saved' : 'Reflection submitted')
      setDialogOpen(false)
    } catch (e) {
      toast.error('Could not save reflection', { description: (e as Error).message })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReflection.mutateAsync(id)
      toast.success('Draft deleted')
    } catch (e) {
      toast.error('Could not delete', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Reflections"
        description="Your daily clinical learning log."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New reflection
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (reflections ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <NotebookPen className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No reflections yet</p>
            <p className="text-sm text-muted-foreground">Start logging your clinical learning experiences.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(reflections ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.entry_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[r.status]} className="capitalize">
                      {r.status}
                    </Badge>
                    {r.status !== 'reviewed' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {r.status === 'draft' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{r.content}</p>
                {r.status === 'reviewed' && r.reviewer_feedback && (
                  <div className="rounded-lg bg-accent/60 p-3 text-sm">
                    <p className="mb-1 font-medium">Preceptor feedback</p>
                    <p className="text-muted-foreground">{r.reviewer_feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit reflection' : 'New reflection'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-date">Date</Label>
              <Input id="entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-title">Title</Label>
              <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ICU rounding observations" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-content">What did you learn today?</Label>
              <Textarea id="r-content" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={saveReflection.isPending}>
              Save draft
            </Button>
            <Button onClick={() => handleSave('submitted')} disabled={saveReflection.isPending}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
