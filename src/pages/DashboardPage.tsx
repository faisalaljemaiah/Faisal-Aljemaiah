import { Link } from 'react-router-dom'
import {
  CalendarClock,
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
import { useMyShiftAssignments } from '@/hooks/useShifts'
import { useTodaysDrug } from '@/hooks/useDrugOfDay'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { formatDate, formatTime, getInitials, cn } from '@/lib/utils'

const quickActions = [
  { label: 'Take Drug Quiz', href: '/drug-of-the-day', icon: Pill },
  { label: 'Locate a Drug', href: '/drug-locator', icon: MapPinned },
  { label: 'Practice Counseling', href: '/counseling-simulator', icon: MessagesSquare },
  { label: 'Write Reflection', href: '/reflections', icon: NotebookPen },
]

export default function DashboardPage() {
  const { profile } = useAuth()
  const { data: assignments, isLoading: shiftsLoading } = useMyShiftAssignments()
  const { data: drugOfDay, isLoading: drugLoading } = useTodaysDrug()
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements(4)
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard('weekly')

  const now = new Date()
  const upcoming = (assignments ?? [])
    .filter((a) => a.shift && new Date(a.shift.start_time) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.shift!.start_time).getTime() - new Date(b.shift!.start_time).getTime())
    .slice(0, 5)

  const today = (assignments ?? []).filter(
    (a) => a.shift && new Date(a.shift.start_time).toDateString() === now.toDateString()
  )

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
          <Reveal><Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Today&apos;s Activities</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/schedule">
                  View schedule <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {shiftsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : today.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shifts scheduled for today. Enjoy the downtime!</p>
              ) : (
                today.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <CalendarClock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.shift!.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(a.shift!.start_time)} – {formatTime(a.shift!.end_time)}
                          {a.shift!.location ? ` · ${a.shift!.location}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant={a.status === 'completed' ? 'success' : 'secondary'} className="capitalize">
                      {a.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card></Reveal>

          {/* Upcoming shifts */}
          <Reveal delay={70}><Card>
            <CardHeader>
              <CardTitle>Upcoming Shifts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shiftsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming shifts assigned yet.</p>
              ) : (
                upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{a.shift!.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.shift!.start_time)} · {formatTime(a.shift!.start_time)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {a.shift!.shift_type}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card></Reveal>

          {/* Drug of the Day */}
          <Reveal delay={140}><Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" /> Drug of the Day
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
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  to={action.href}
                  className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs font-medium transition-[color,background-color,box-shadow,transform] duration-150 ease-out-expo hover:-translate-y-0.5 hover:bg-accent hover:shadow-sm active:translate-y-0 active:scale-[0.98]"
                >
                  <action.icon className="h-5 w-5 text-primary" />
                  {action.label}
                </Link>
              ))}
            </CardContent>
          </Card></Reveal>

          {/* Leaderboard preview */}
          <Reveal delay={70}><Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Weekly Leaders
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
                <Megaphone className="h-4 w-4 text-primary" /> Announcements
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
