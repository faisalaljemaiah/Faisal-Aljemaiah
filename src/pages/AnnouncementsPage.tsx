import { Megaphone } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { formatDateTime, getInitials } from '@/lib/utils'

export default function AnnouncementsPage() {
  const { data: announcements, isLoading } = useAnnouncements()

  return (
    <div>
      <PageHeader title="Announcements" description="Updates and news from your pharmacy team." />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (announcements ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No announcements yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(announcements ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.priority !== 'normal' && (
                    <Badge
                      variant={a.priority === 'urgent' ? 'destructive' : a.priority === 'high' ? 'warning' : 'secondary'}
                      className="shrink-0 capitalize"
                    >
                      {a.priority}
                    </Badge>
                  )}
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {a.author ? getInitials(a.author.full_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {a.author?.full_name ?? 'Admin'} · {formatDateTime(a.published_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
