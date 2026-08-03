import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ShiftAssignment } from '@/types/database'

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function ScheduleCalendar({
  assignments,
  selectedDate,
  onSelectDate,
}: {
  assignments: ShiftAssignment[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
}) {
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(selectedDate))

  const byDay = React.useMemo(() => {
    const map = new Map<string, ShiftAssignment[]>()
    for (const a of assignments) {
      if (!a.shift) continue
      const key = new Date(a.shift.start_time).toDateString()
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return map
  }, [assignments])

  const firstDay = startOfMonth(viewMonth)
  const lastDay = endOfMonth(viewMonth)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ]

  const today = new Date()

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const dayAssignments = byDay.get(date.toDateString()) ?? []
          const isToday = date.toDateString() === today.toDateString()
          const isSelected = date.toDateString() === selectedDate.toDateString()

          return (
            <button
              key={i}
              onClick={() => onSelectDate(date)}
              className={cn(
                'flex aspect-square flex-col items-center justify-start gap-0.5 rounded-lg border p-1 text-xs transition-colors hover:bg-accent',
                isSelected && 'border-primary bg-accent',
                isToday && !isSelected && 'border-primary/50'
              )}
            >
              <span className={cn('font-medium', isToday && 'text-primary')}>{date.getDate()}</span>
              {dayAssignments.length > 0 && (
                <span className="flex gap-0.5">
                  {dayAssignments.slice(0, 3).map((_, idx) => (
                    <span key={idx} className="h-1.5 w-1.5 rounded-full bg-primary" />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
