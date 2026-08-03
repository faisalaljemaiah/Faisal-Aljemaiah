import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '@/hooks/useAnnouncements'
import { formatDateTime } from '@/lib/utils'
import type { AnnouncementPriority } from '@/types/database'

export default function AdminAnnouncementsPage() {
  const { profile } = useAuth()
  const { data: announcements, isLoading } = useAnnouncements()
  const createAnnouncement = useCreateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({ title: '', body: '', priority: 'normal' as AnnouncementPriority, expires_at: '' })

  async function handleCreate() {
    if (!profile) return
    if (!form.title || !form.body) {
      toast.error('Title and body are required.')
      return
    }
    try {
      await createAnnouncement.mutateAsync({
        title: form.title,
        body: form.body,
        priority: form.priority,
        created_by: profile.id,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      })
      toast.success('Announcement published')
      setOpen(false)
      setForm({ title: '', body: '', priority: 'normal', expires_at: '' })
    } catch (e) {
      toast.error('Could not publish', { description: (e as Error).message })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement.mutateAsync(id)
      toast.success('Announcement removed')
    } catch (e) {
      toast.error('Could not remove', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Broadcast updates to your entire team."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as AnnouncementPriority })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expires (optional)</Label>
                    <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createAnnouncement.isPending}>
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-3">
          {(announcements ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.published_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={a.priority === 'urgent' ? 'destructive' : a.priority === 'high' ? 'warning' : 'secondary'}
                      className="capitalize"
                    >
                      {a.priority}
                    </Badge>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
