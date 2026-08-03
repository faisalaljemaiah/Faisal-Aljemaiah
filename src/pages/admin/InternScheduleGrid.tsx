import * as React from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Search, AlertTriangle, Loader2, X, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useInterns } from '@/hooks/useProfiles'
import { useShiftAssignmentsInRange, useSaveInternSchedule, type ScheduleChange } from '@/hooks/useShifts'
import {
  SHIFT_PERIODS,
  fourWeekRange,
  chunkIntoWeeks,
  cellKey,
  dateKey,
  classifyPeriod,
  addDays,
  type ShiftPeriod,
} from '@/lib/shiftPeriods'
import { cn, getInitials } from '@/lib/utils'

interface CellState {
  assigned: boolean
  assignmentId?: string
}

const CONSECUTIVE_DAY_WARNING_THRESHOLD = 5

function longestConsecutiveStreak(workedDateKeys: Set<string>, days: Date[]): number {
  let longest = 0
  let current = 0
  for (const day of days) {
    if (workedDateKeys.has(dateKey(day))) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
}

export default function InternScheduleGrid() {
  const { profile } = useAuth()
  const { data: interns, isLoading: internsLoading } = useInterns()
  const saveSchedule = useSaveInternSchedule()

  const [search, setSearch] = React.useState('')
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [anchorDate, setAnchorDate] = React.useState(() => new Date())
  const [cells, setCells] = React.useState<Record<string, CellState>>({})
  const [initialCells, setInitialCells] = React.useState<Record<string, CellState>>({})
  const [pendingSwitchId, setPendingSwitchId] = React.useState<string | null | 'nav'>(null)

  const days = React.useMemo(() => fourWeekRange(anchorDate), [anchorDate])
  const weeks = React.useMemo(() => chunkIntoWeeks(days), [days])
  const rangeStartIso = days[0].toISOString()
  const rangeEndIso = addDays(days[days.length - 1], 1).toISOString()

  const { data: assignmentsInRange, isLoading: assignmentsLoading } = useShiftAssignmentsInRange(rangeStartIso, rangeEndIso)

  const isDirty = React.useMemo(() => JSON.stringify(cells) !== JSON.stringify(initialCells), [cells, initialCells])

  // Rebuild the working grid whenever the selected intern or visible range changes.
  React.useEffect(() => {
    if (!selectedId || !assignmentsInRange) {
      setCells({})
      setInitialCells({})
      return
    }
    const next: Record<string, CellState> = {}
    for (const a of assignmentsInRange) {
      if (a.user_id !== selectedId || !a.shift) continue
      const period = classifyPeriod(a.shift.start_time)
      const key = cellKey(new Date(a.shift.start_time), period)
      next[key] = { assigned: true, assignmentId: a.id }
    }
    setCells(next)
    setInitialCells(next)
  }, [selectedId, assignmentsInRange])

  // Workload across the whole team for this 4-week window, to help balance assignments.
  const workloadByIntern = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of assignmentsInRange ?? []) {
      counts.set(a.user_id, (counts.get(a.user_id) ?? 0) + 1)
    }
    return counts
  }, [assignmentsInRange])

  const consecutiveStreak = React.useMemo(() => {
    const workedDays = new Set<string>()
    for (const [key, state] of Object.entries(cells)) {
      if (state.assigned) workedDays.add(key.split('_')[0])
    }
    return longestConsecutiveStreak(workedDays, days)
  }, [cells, days])

  const filteredInterns = (interns ?? []).filter((i) => i.full_name.toLowerCase().includes(search.toLowerCase()))

  function toggleCell(date: Date, period: ShiftPeriod) {
    const key = cellKey(date, period)
    setCells((prev) => {
      const existing = prev[key]
      return { ...prev, [key]: { assigned: !existing?.assigned, assignmentId: existing?.assignmentId } }
    })
  }

  function requestSelectIntern(id: string) {
    if (id === selectedId) return
    if (isDirty) {
      setPendingSwitchId(id)
      return
    }
    setSelectedId(id)
  }

  function requestNavigate(direction: -1 | 1) {
    if (isDirty) {
      setPendingSwitchId('nav')
      return
    }
    setAnchorDate((prev) => addDays(prev, direction * 28))
  }

  async function handleSave() {
    if (!selectedId || !profile) return
    const toAssign: ScheduleChange[] = []
    const toRemoveAssignmentIds: string[] = []

    for (const day of days) {
      for (const period of SHIFT_PERIODS) {
        const key = cellKey(day, period.id)
        const current = cells[key]
        const original = initialCells[key]
        if (current?.assigned && !original?.assigned) {
          toAssign.push({ date: day, period: period.id })
        } else if (!current?.assigned && original?.assigned && original.assignmentId) {
          toRemoveAssignmentIds.push(original.assignmentId)
        }
      }
    }

    if (toAssign.length === 0 && toRemoveAssignmentIds.length === 0) return

    try {
      await saveSchedule.mutateAsync({ internId: selectedId, toAssign, toRemoveAssignmentIds, createdBy: profile.id })
      toast.success('Schedule saved')
    } catch (e) {
      toast.error('Could not save schedule', { description: (e as Error).message })
    }
  }

  function handleDiscard() {
    setCells(initialCells)
  }

  function confirmSwitch(shouldSave: boolean) {
    const target = pendingSwitchId
    setPendingSwitchId(null)
    if (shouldSave) {
      handleSave().then(() => {
        if (target === 'nav') setAnchorDate((prev) => addDays(prev, 28))
        else if (target) setSelectedId(target)
      })
    } else {
      setCells(initialCells)
      if (target === 'nav') setAnchorDate((prev) => addDays(prev, 28))
      else if (target) setSelectedId(target)
    }
  }

  const selectedIntern = (interns ?? []).find((i) => i.id === selectedId)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <Card className="lg:col-span-1">
        <CardContent className="space-y-3 pt-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search interns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {internsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="max-h-[32rem] space-y-1 overflow-y-auto scrollbar-thin">
              {filteredInterns.map((intern) => (
                <button
                  key={intern.id}
                  onClick={() => requestSelectIntern(intern.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                    selectedId === intern.id && 'bg-accent'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                      {getInitials(intern.full_name)}
                    </span>
                    {intern.full_name}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {workloadByIntern.get(intern.id) ?? 0} shifts
                  </Badge>
                </button>
              ))}
              {filteredInterns.length === 0 && <p className="p-2 text-sm text-muted-foreground">No interns found.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardContent className="space-y-4 pt-5">
          {!selectedId ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Select an intern to view and edit their schedule.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{selectedIntern?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                    {days[days.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => requestNavigate(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => requestNavigate(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {isDirty && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleDiscard}>
                        Discard
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saveSchedule.isPending}>
                        {saveSchedule.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save changes
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {consecutiveStreak > CONSECUTIVE_DAY_WARNING_THRESHOLD && (
                <div className="flex items-center gap-2 rounded-lg bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                  This schedule has {consecutiveStreak} consecutive working days — consider adding a rest day.
                </div>
              )}

              {assignmentsLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <div className="space-y-4">
                  {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="overflow-x-auto">
                      <table className="w-full min-w-[640px] border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="w-20 pb-1 text-left text-xs font-medium text-muted-foreground">Week {weekIdx + 1}</th>
                            {week.map((day) => (
                              <th key={day.toISOString()} className="pb-1 text-center text-xs font-medium text-muted-foreground">
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                <br />
                                {day.getDate()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {SHIFT_PERIODS.map((period) => (
                            <tr key={period.id}>
                              <td className="py-1 pr-2 text-xs font-medium text-muted-foreground">{period.label}</td>
                              {week.map((day) => {
                                const key = cellKey(day, period.id)
                                const state = cells[key]
                                return (
                                  <td key={key} className="p-0.5">
                                    <button
                                      onClick={() => toggleCell(day, period.id)}
                                      className={cn(
                                        'flex h-10 w-full items-center justify-center rounded-md border text-xs transition-colors',
                                        state?.assigned
                                          ? 'border-primary bg-primary text-primary-foreground'
                                          : 'border-dashed text-muted-foreground hover:bg-accent'
                                      )}
                                    >
                                      {state?.assigned ? <Check className="h-3.5 w-3.5" /> : ''}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">Click a cell to assign or remove that shift period.</p>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pendingSwitchId} onOpenChange={(open) => !open && setPendingSwitchId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You have unsaved changes</DialogTitle>
            <DialogDescription>Would you like to save them before continuing, or discard them?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => confirmSwitch(false)}>
              <X className="h-4 w-4" /> Discard
            </Button>
            <Button onClick={() => confirmSwitch(true)}>
              <Check className="h-4 w-4" /> Save & continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
