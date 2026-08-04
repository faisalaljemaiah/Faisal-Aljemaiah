import { Link } from 'react-router-dom'
import {
  Pill,
  MapPinned,
  MessagesSquare,
  NotebookPen,
  Trophy,
  Megaphone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Reveal } from '@/components/Reveal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useMyScheduleEntries } from '@/hooks/useSchedule'
import { useTodaysDrug } from '@/hooks/useDrugOfDay'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { addDays, dateKey } from '@/lib/scheduleDates'
import { scheduleCodeMeta, scheduleCodeText } from '@/lib/scheduleCodes'
import { getInitials, cn } from '@/lib/utils'
import { featureColors } from '@/lib/featureColors'

const quickActions = [
  { label: 'Take Drug Quiz', href: '/drug-of-the-day', icon: Pill, colorKey: 'drugOfDay' as const },
  { label: 'Locate a Drug', href: '/drug-locator', icon: MapPinned, colorKey: 'drugLocator' as const },
  { label: 'Practice Counseling', href: '/counseling-simulator', icon: MessagesSquare, colorKey: 'counseling' as const },
  { label: 'Write Reflection', href: '/reflections', icon: NotebookPen, colorKey: 'reflections' as const },
]

export default function DashboardPage() {
  const { profile } = useAuth()
  const now = new Date()
  const { data: entries, isLoading: scheduleLoading } = useMyScheduleEntries(now, addDays(now, 13))
  const { data: drugOfDay, isLoading: drugLoading } = useTodaysDrug()
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements(4)
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard('weekly')

  const todayKey = dateKey(now)
  const todayEntry = (entries ?? []).find((e) => e.date === todayKey)
  const upcoming = (entries ?? [])
    .filter((e) => e.date > todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const myRank = leaderboard?.find((row) => row.user_id === profile?.id)

  return (
    <div>
      <PageHeader
        title={`Welcome back${profile ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description="Here's what's happening across your rotation today."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Today's activities */}
          <Reveal><Card className="border-orange-200/70 bg-orange-50/60 dark:border-orange-900/40 dark:bg-orange-950/20">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Today&apos;s Activities</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/schedule">
                  View schedule <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduleLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : !todayEntry ? (
                <p className="text-sm text-muted-foreground">No activity scheduled for today. Enjoy the downtime!</p>
              ) : (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold',
                        featureColors.home.chip
                      )}
                    >
                      {scheduleCodeText(todayEntry.code)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{scheduleCodeMeta[todayEntry.code].label}</p>
                      <p className="text-xs text-muted-foreground">
                        {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card></Reveal>

          {/* Upcoming schedule */}
          <Reveal delay={70}><Card className="border-cyan-200/70 bg-cyan-50/60 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduleLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming activities assigned yet.</p>
              ) : (
                upcoming.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{scheduleCodeMeta[e.code].label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(`${e.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {scheduleCodeText(e.code)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card></Reveal>

          {/* Drug of the Day */}
          <Reveal delay={140}><Card className="border-green-200/70 bg-green-50/60 dark:border-green-900/40 dark:bg-green-950/20">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Pill className={cn('h-4 w-4', featureColors.drugOfDay.icon)} /> Drug of the Day
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/drug-of-the-day">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {drugLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : !drugOfDay ? (
                <p className="text-sm text-muted-foreground">No drug has been published yet. Check back soon.</p>
              ) : (
                <div>
                  <p className="font-medium">{drugOfDay.drug_name}</p>
                  {drugOfDay.generic_name && (
                    <p className="text-xs text-muted-foreground">{drugOfDay.generic_name}</p>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{drugOfDay.indications}</p>
                </div>
              )}
            </CardContent>
          </Card></Reveal>
        </div>

        <div className="space-y-4">
          {/* Quick actions */}
          <Reveal><Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const colors = featureColors[action.colorKey]
                return (
                  <Link
                    key={action.href}
                    to={action.href}
                    className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs font-medium transition-[color,background-color,box-shadow,transform] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.98]"
                  >
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', colors.chip)}>
                      <action.icon className="h-[18px] w-[18px]" />
                    </span>
                    {action.label}
                  </Link>
                )
              })}
            </CardContent>
          </Card></Reveal>

          {/* Leaderboard preview */}
          <Reveal delay={70}><Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Trophy className={cn('h-4 w-4', featureColors.leaderboard.icon)} /> Weekly Leaders
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/leaderboard">
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboardLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <>
                  {(leaderboard ?? []).slice(0, 5).map((row) => (
                    <div
                      key={row.user_id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2 py-1.5',
                        row.user_id === profile?.id && 'bg-accent'
                      )}
                    >
                      <span className="w-4 text-xs font-semibold text-muted-foreground">{row.rank}</span>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={row.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">{getInitials(row.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm">{row.full_name}</span>
                      <span className="text-sm font-semibold">{row.points}</span>
                    </div>
                  ))}
                  {myRank && myRank.rank > 5 && (
                    <div className="mt-2 flex items-center gap-3 rounded-lg bg-accent px-2 py-1.5">
                      <span className="w-4 text-xs font-semibold text-muted-foreground">{myRank.rank}</span>
                      <span className="flex-1 truncate text-sm">You</span>
                      <span className="text-sm font-semibold">{myRank.points}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card></Reveal>

          {/* Announcements */}
          <Reveal delay={140}><Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className={cn('h-4 w-4', featureColors.announcements.icon)} /> Announcements
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/announcements">
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcementsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (announcements ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              ) : (
                (announcements ?? []).map((a) => (
                  <div key={a.id} className="space-y-1 border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{a.title}</p>
                      {a.priority !== 'normal' && (
                        <Badge
                          variant={a.priority === 'urgent' ? 'destructive' : a.priority === 'high' ? 'warning' : 'secondary'}
                          className="capitalize"
                        >
                          {a.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card></Reveal>

          {profile && profile.points > 0 && (
            <Reveal delay={210}><Card className="bg-accent/40">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">You&apos;ve earned {profile.points} points</p>
                  <p className="text-xs text-muted-foreground">Keep completing activities to climb the leaderboard.</p>
                </div>
              </CardContent>
            </Card></Reveal>
          )}
        </div>
      </div>
    </div>
  )
}
