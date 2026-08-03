import * as React from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useLeaderboard, useMyBadges, type LeaderboardPeriod } from '@/hooks/useLeaderboard'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, cn } from '@/lib/utils'

const rankColors = ['text-yellow-500', 'text-zinc-400', 'text-amber-600']

export default function LeaderboardPage() {
  const { profile } = useAuth()
  const [period, setPeriod] = React.useState<LeaderboardPeriod>('weekly')
  const { data: rows, isLoading } = useLeaderboard(period)
  const { data: badges } = useMyBadges(profile?.id)

  return (
    <div>
      <PageHeader title="Leaderboard" description="See how you rank against your cohort." />

      <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)} className="mb-5">
        <TabsList>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="all_time">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-2 pt-5">
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (rows ?? []).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No ranking data yet.</p>
            ) : (
              (rows ?? []).map((row) => (
                <div
                  key={row.user_id}
                  className={cn(
                    'flex items-center gap-4 rounded-lg border p-3',
                    row.user_id === profile?.id && 'border-primary bg-accent/50'
                  )}
                >
                  <div className="flex w-8 items-center justify-center">
                    {row.rank <= 3 ? (
                      <Trophy className={cn('h-5 w-5', rankColors[row.rank - 1])} />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">{row.rank}</span>
                    )}
                  </div>
                  <Avatar>
                    <AvatarImage src={row.avatar_url ?? undefined} />
                    <AvatarFallback>{getInitials(row.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {row.full_name} {row.user_id === profile?.id && <span className="text-muted-foreground">(you)</span>}
                    </p>
                  </div>
                  <p className="font-semibold">{row.points} pts</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">My Badges</h3>
            </div>
            {(badges ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No badges earned yet. Keep participating to unlock them!</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(badges ?? []).map((ub) => (
                  <div key={ub.id} className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
                    <Medal className="h-6 w-6 text-primary" />
                    <p className="text-xs font-medium">{ub.badge?.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {ub.badge?.points_threshold} pts
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
