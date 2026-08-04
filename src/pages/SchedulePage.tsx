import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Reveal } from '@/components/Reveal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyScheduleEntries, useScheduleCodeTypes } from '@/hooks/useSchedule'
import { addDays, dateKey, workWeeks } from '@/lib/scheduleDates'
import { scheduleCellClasses, scheduleSwatchClasses } from '@/lib/scheduleCodes'
import { cn } from '@/lib/utils'
import type { ScheduleCodeType, ScheduleEntry } from '@/types/database'

const WEEK_COUNT = 4

export default function SchedulePage() {
  const [anchorDate, setAnchorDate] = React.useState(() => new Date())
  const weeks = React.useMemo(() => workWeeks(anchorDate, WEEK_COUNT), [anchorDate])
  const rangeStart = weeks[0][0]
  const rangeEnd = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1]

  const { data: entries, isLoading } = useMyScheduleEntries(rangeStart, rangeEnd)
  const { data: codeTypes, isLoading: codesLoading } = useScheduleCodeTypes()

  const entryByDate = React.useMemo(() => {
    const map = new Map<string, ScheduleEntry>()
    for (const e of entries ?? []) map.set(e.date, e)
    return map
  }, [entries])

  const codeByKey = React.useMemo(() => {
    const map = new Map<string, ScheduleCodeType>()
    for (const ct of codeTypes ?? []) map.set(ct.code, ct)
    return map
  }, [codeTypes])

  const loading = isLoading || codesLoading

  const today = new Date()
  const todayEntry = entryByDate.get(dateKey(today))
  const todayCode = todayEntry ? codeByKey.get(todayEntry.code) : undefined

  return (
    <div>
      <PageHeader title="Schedule" description="Your day-by-day rotation, Sunday through Thursday." />

      <Reveal><Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : todayEntry && todayCode ? (
            <div className={cn('flex items-center gap-4 rounded-lg border p-4', scheduleCellClasses(todayCode.color))}>
              <span className="text-2xl font-bold">{todayCode.short_label}</span>
              <div>
                <p className="font-medium">{todayCode.label}</p>
                <p className="text-xs opacity-80">
                  {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity scheduled for today.</p>
          )}
        </CardContent>
      </Card></Reveal>

      <Reveal delay={70}><Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>4-Week Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAnchorDate((d) => addDays(d, -28))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAnchorDate((d) => addDays(d, 28))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            weeks.map((week, wi) => (
              <div key={wi}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Week {wi + 1} · {week[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                  {week[week.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {week.map((day) => {
                    const entry = entryByDate.get(dateKey(day))
                    const ct = entry ? codeByKey.get(entry.code) : undefined
                    const isToday = dateKey(day) === dateKey(today)
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'rounded-lg border p-2 text-center',
                          ct ? scheduleCellClasses(ct.color) : 'border-dashed',
                          isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        )}
                      >
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-sm font-semibold">{day.getDate()}</p>
                        <p className="mt-1 text-xs font-bold">{ct?.short_label ?? '—'}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card></Reveal>

      <Reveal delay={140}><Card className="mt-4">
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {(codeTypes ?? []).map((ct) => (
            <span key={ct.code} className="flex items-center gap-1.5">
              <span className={cn('h-3 w-3 rounded-sm', scheduleSwatchClasses(ct.color))} />
              {ct.short_label} — {ct.label}
            </span>
          ))}
        </CardContent>
      </Card></Reveal>
    </div>
  )
}
