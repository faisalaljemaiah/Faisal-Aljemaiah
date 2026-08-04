export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Sunday on/before the given date, the first day of the program's work week. */
export function startOfWorkWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

/** Sunday through Thursday for the work week containing `date`. */
export function workWeek(date: Date): Date[] {
  const start = startOfWorkWeek(date)
  return Array.from({ length: 5 }, (_, i) => addDays(start, i))
}

/** `weekCount` consecutive work weeks (Sun–Thu each), starting from the week containing `anchor`. */
export function workWeeks(anchor: Date, weekCount: number): Date[][] {
  const start = startOfWorkWeek(anchor)
  return Array.from({ length: weekCount }, (_, w) => workWeek(addDays(start, w * 7)))
}

export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
