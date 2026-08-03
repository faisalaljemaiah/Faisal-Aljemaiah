import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const [drugCompletions, counselingAttempts, reflections, shiftAssignments, profiles] = await Promise.all([
        supabase.from('drug_of_day_completions').select('id, completed_at'),
        supabase.from('counseling_attempts').select('id, score, completed_at'),
        supabase.from('reflections').select('id, status'),
        supabase.from('shift_assignments').select('id, status'),
        supabase.from('profiles').select('id, role, points'),
      ])

      if (drugCompletions.error) throw drugCompletions.error
      if (counselingAttempts.error) throw counselingAttempts.error
      if (reflections.error) throw reflections.error
      if (shiftAssignments.error) throw shiftAssignments.error
      if (profiles.error) throw profiles.error

      const attendanceBreakdown = shiftAssignments.data!.reduce<Record<string, number>>((acc, s) => {
        acc[s.status] = (acc[s.status] ?? 0) + 1
        return acc
      }, {})

      const reflectionBreakdown = reflections.data!.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1
        return acc
      }, {})

      const avgCounselingScore = counselingAttempts.data!.length
        ? Math.round(
            counselingAttempts.data!.reduce((sum, a) => sum + a.score, 0) / counselingAttempts.data!.length
          )
        : 0

      const interns = profiles.data!.filter((p) => p.role === 'intern')
      const avgPoints = interns.length ? Math.round(interns.reduce((sum, p) => sum + p.points, 0) / interns.length) : 0

      return {
        totalDrugCompletions: drugCompletions.data!.length,
        totalCounselingAttempts: counselingAttempts.data!.length,
        avgCounselingScore,
        avgPoints,
        internCount: interns.length,
        attendanceBreakdown,
        reflectionBreakdown,
      }
    },
  })
}
