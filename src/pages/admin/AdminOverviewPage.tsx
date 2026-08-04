import { Users, CalendarDays, NotebookPen, Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInterns } from '@/hooks/useProfiles'
import { useAllScheduleEntries } from '@/hooks/useSchedule'
import { useAllReflections } from '@/hooks/useReflections'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { dateKey } from '@/lib/scheduleDates'
import { formatDateTime } from '@/lib/utils'

export default function AdminOverviewPage() {
  const { data: interns, isLoading: internsLoading } = useInterns()
  const today = new Date()
  const { data: todaysEntries, isLoading: entriesLoading } = useAllScheduleEntries(today, today)
  const { data: reflections, isLoading: reflectionsLoading } = useAllReflections()
  const { data: announcements } = useAnnouncements(5)

  const pendingReflections = (reflections ?? []).filter((r) => r.status === 'submitted')

  const stats = [
    { label: 'Active Interns', value: interns?.length ?? 0, icon: Users, loading: internsLoading },
    {
      label: "Today's Assignments",
      value: (todaysEntries ?? []).filter((e) => e.date === dateKey(today)).length,
      icon: CalendarDays,
      loading: entriesLoading,
    },
    { label: 'Reflections to Review', value: pendingReflections.length, icon: NotebookPen, loading: reflectionsLoading },
    { label: 'Announcements Posted', value: announcements?.length ?? 0, icon: Megaphone, loading: false },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                {s.loading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-semibold">{s.value}</p>}
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reflection Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingReflections.length === 0 ? (
            <p className="text-sm text-muted-foreground">All caught up — nothing awaiting review.</p>
          ) : (
            pendingReflections.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.author?.full_name} · {formatDateTime(r.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
