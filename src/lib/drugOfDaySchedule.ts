function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Walks forward one calendar day at a time from today, skipping any date
// that already has a Drug of the Day (publish_date is unique in the DB),
// until it has `count` open dates.
export function nextAvailableDates(count: number, takenDates: Iterable<string>, from: Date = new Date()): string[] {
  const taken = new Set(takenDates)
  const result: string[] = []
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)

  while (result.length < count) {
    const key = dateKey(cursor)
    if (!taken.has(key)) result.push(key)
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}
