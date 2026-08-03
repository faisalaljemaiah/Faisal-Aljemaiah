export type ShiftPeriod = 'morning' | 'evening' | 'night'

export const SHIFT_PERIODS: { id: ShiftPeriod; label: string; startHour: number; endHour: number }[] = [
  { id: 'morning', label: 'Morning', startHour: 7, endHour: 15 },
  { id: 'evening', label: 'Evening', startHour: 15, endHour: 23 },
  { id: 'night', label: 'Night', startHour: 23, endHour: 7 },
]

export function periodTimes(date: Date, period: ShiftPeriod): { start: Date; end: Date } {
  const def = SHIFT_PERIODS.find((p) => p.id === period)!
  const start = new Date(date)
  start.setHours(def.startHour, 0, 0, 0)
  const end = new Date(date)
  if (def.endHour <= def.startHour) {
    end.setDate(end.getDate() + 1)
  }
  end.setHours(def.endHour, 0, 0, 0)
  return { start, end }
}

export function classifyPeriod(startTime: string): ShiftPeriod {
  const hour = new Date(startTime).getHours()
  if (hour >= 7 && hour < 15) return 'morning'
  if (hour >= 15 && hour < 23) return 'evening'
  return 'night'
}

export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function cellKey(date: Date, period: ShiftPeriod): string {
  return `${dateKey(date)}_${period}`
}

/** Monday on/before the given date. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** 28 consecutive days (4 weeks) starting from the Monday of the given anchor date. */
export function fourWeekRange(anchor: Date): Date[] {
  const start = startOfWeek(anchor)
  return Array.from({ length: 28 }, (_, i) => addDays(start, i))
}

export function chunkIntoWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}
