import { dateKey } from './scheduleDates'
import type { ScheduleCodeType, ScheduleEntry } from '@/types/database'

export interface GeneratedRow {
  user_id: string
  date: string
  code: string
  created_by: string
}

// Fills every empty trainee/day cell in `days` with whichever rotating code
// that trainee has had the least of so far — a greedy least-used-first
// assignment. Days already carrying a code are left untouched. The starting
// trainee rotates each day so the same person doesn't systematically get
// first pick of the least-common code.
export function generateFairSchedule({
  internIds,
  days,
  rotatingCodes,
  existingEntries,
  createdBy,
}: {
  internIds: string[]
  days: Date[]
  rotatingCodes: ScheduleCodeType[]
  existingEntries: ScheduleEntry[]
  createdBy: string
}): GeneratedRow[] {
  if (rotatingCodes.length === 0 || internIds.length === 0) return []

  const filled = new Set(existingEntries.map((e) => `${e.user_id}_${e.date}`))
  const counts = new Map<string, Map<string, number>>()
  for (const id of internIds) {
    counts.set(
      id,
      new Map(rotatingCodes.map((c) => [c.code, 0]))
    )
  }
  for (const e of existingEntries) {
    const codeCounts = counts.get(e.user_id)
    if (codeCounts?.has(e.code)) {
      codeCounts.set(e.code, (codeCounts.get(e.code) ?? 0) + 1)
    }
  }

  const rows: GeneratedRow[] = []

  days.forEach((day, dayIdx) => {
    const key = dateKey(day)
    const rotation = dayIdx % internIds.length
    const order = [...internIds.slice(rotation), ...internIds.slice(0, rotation)]

    for (const internId of order) {
      if (filled.has(`${internId}_${key}`)) continue

      const codeCounts = counts.get(internId)!
      let bestCode = rotatingCodes[0].code
      let bestCount = Infinity
      for (const c of rotatingCodes) {
        const n = codeCounts.get(c.code) ?? 0
        if (n < bestCount) {
          bestCount = n
          bestCode = c.code
        }
      }

      rows.push({ user_id: internId, date: key, code: bestCode, created_by: createdBy })
      codeCounts.set(bestCode, bestCount + 1)
      filled.add(`${internId}_${key}`)
    }
  })

  return rows
}
