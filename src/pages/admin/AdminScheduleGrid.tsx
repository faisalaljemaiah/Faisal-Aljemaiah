import * as React from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/contexts/AuthContext'
import { useInterns } from '@/hooks/useProfiles'
import { useAllScheduleEntries, useSetScheduleEntry } from '@/hooks/useSchedule'
import { addDays, dateKey, workWeeks } from '@/lib/scheduleDates'
import { SCHEDULE_CODES, scheduleCodeMeta, scheduleCodeText } from '@/lib/scheduleCodes'
import { cn, getInitials } from '@/lib/utils'
import type { ScheduleCode, ScheduleEntry } from '@/types/database'

const WEEK_COUNT = 4

export default function AdminScheduleGrid() {
  const { profile } = useAuth()
  const { data: interns, isLoading: internsLoading } = useInterns()
  const setEntry = useSetScheduleEntry()

  const [search, setSearch] = React.useState('')
  const [anchorDate, setAnchorDate] = React.useState(() => new Date())

  const weeks = React.useMemo(() => workWeeks(anchorDate, WEEK_COUNT), [anchorDate])
  const rangeStart = weeks[0][0]
  const rangeEnd = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1]

  const { data: entries, isLoading: entriesLoading } = useAllScheduleEntries(rangeStart, rangeEnd)

  const entryByCell = React.useMemo(() => {
    const map = new Map<string, ScheduleEntry>()
    for (const e of entries ?? []) {
      map.set(`${e.user_id}_${e.date}`, e)
    }
    return map
  }, [entries])

  const filteredInterns = (interns ?? []).filter((i) => i.full_name.toLowerCase().includes(search.toLowerCase()))

  async function handlePick(userId: string, date: Date, code: ScheduleCode | null) {
    if (!profile) return
    try {
      await setEntry.mutateAsync({ userId, date, code, createdBy: profile.id })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search trainees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAnchorDate((d) => addDays(d, -28))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAnchorDate((d) => addDays(d, 28))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {SCHEDULE_CODES.map((code) => (
          <span key={code} className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3 rounded-sm', scheduleCodeMeta[code].swatch)} />
            {scheduleCodeText(code)} — {scheduleCodeMeta[code].label}
          </span>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          {internsLoading || entriesLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : filteredInterns.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No trainees found.</p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-40 min-w-40 bg-card" />
                    {weeks.map((week, wi) => (
                      <th
                        key={wi}
                        colSpan={week.length}
                        className="border-b bg-secondary px-2 py-1.5 text-xs font-semibold text-secondary-foreground"
                      >
                        W{wi + 1} · {week[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                        {week[week.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="sticky left-0 z-10 min-w-40 border-b bg-card px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                      Trainee
                    </th>
                    {weeks.map((week) =>
                      week.map((day) => (
                        <th
                          key={day.toISOString()}
                          className="w-14 min-w-14 border-b px-1 py-1.5 text-center text-[11px] font-medium text-muted-foreground"
                        >
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          <br />
                          {day.getDate()}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredInterns.map((intern) => (
                    <tr key={intern.id}>
                      <td className="sticky left-0 z-10 min-w-40 border-b bg-card px-2 py-1.5">
                        <span className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-medium text-primary">
                            {getInitials(intern.full_name)}
                          </span>
                          <span className="truncate text-xs font-medium">{intern.full_name}</span>
                        </span>
                      </td>
                      {weeks.map((week) =>
                        week.map((day) => {
                          const entry = entryByCell.get(`${intern.id}_${dateKey(day)}`)
                          const meta = entry ? scheduleCodeMeta[entry.code] : null
                          return (
                            <td key={day.toISOString()} className="w-14 min-w-14 border-b p-0.5">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    className={cn(
                                      'flex h-9 w-full items-center justify-center rounded-md border text-[11px] font-semibold transition-colors',
                                      meta ? meta.cell : 'border-dashed text-muted-foreground hover:bg-accent'
                                    )}
                                  >
                                    {entry ? scheduleCodeText(entry.code) : ''}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2" align="center">
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {SCHEDULE_CODES.map((code) => (
                                      <PopoverClose asChild key={code}>
                                        <button
                                          onClick={() => handlePick(intern.id, day, code)}
                                          className={cn(
                                            'flex h-9 flex-col items-center justify-center rounded-md border text-[11px] font-semibold transition-transform active:scale-95',
                                            scheduleCodeMeta[code].cell
                                          )}
                                          title={scheduleCodeMeta[code].label}
                                        >
                                          {scheduleCodeText(code)}
                                        </button>
                                      </PopoverClose>
                                    ))}
                                  </div>
                                  {entry && (
                                    <PopoverClose asChild>
                                      <button
                                        onClick={() => handlePick(intern.id, day, null)}
                                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:bg-accent"
                                      >
                                        <X className="h-3 w-3" /> Clear
                                      </button>
                                    </PopoverClose>
                                  )}
                                </PopoverContent>
                              </Popover>
                            </td>
                          )
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
