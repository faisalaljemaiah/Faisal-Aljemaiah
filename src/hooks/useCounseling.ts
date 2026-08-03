import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CaseDifficulty, CounselingAttempt, CounselingCase } from '@/types/database'

export function useCounselingCases() {
  return useQuery({
    queryKey: ['counseling-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('counseling_cases')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CounselingCase[]
    },
  })
}

export function useAllCounselingCases() {
  return useQuery({
    queryKey: ['counseling-cases', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('counseling_cases').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as CounselingCase[]
    },
  })
}

export function useCounselingCase(caseId?: string) {
  return useQuery({
    queryKey: ['counseling-case', caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase.from('counseling_cases').select('*').eq('id', caseId!).single()
      if (error) throw error
      return data as CounselingCase
    },
  })
}

export function useMyCounselingAttempts() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['counseling-attempts', 'me', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('counseling_attempts')
        .select('*, case:counseling_cases(*)')
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
      if (error) throw error
      return data as CounselingAttempt[]
    },
  })
}

export function useSubmitCounselingAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { caseId: string; coveredPointIds: string[]; durationSeconds: number }) => {
      const { data, error } = await supabase.rpc('submit_counseling_attempt', {
        p_case_id: input.caseId,
        p_covered_point_ids: input.coveredPointIds,
        p_duration_seconds: input.durationSeconds,
      })
      if (error) throw error
      return data as CounselingAttempt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counseling-attempts'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export type CounselingCaseInput = {
  title: string
  patient_name: string
  patient_age?: number | null
  patient_gender?: string | null
  medication: string
  scenario: string
  difficulty: CaseDifficulty
  learning_objectives: string[]
  key_counseling_points: { id: string; label: string; detail: string }[]
  common_pitfalls?: string | null
  is_active: boolean
  created_by: string
}

export function useCreateCounselingCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CounselingCaseInput) => {
      const { error } = await supabase.from('counseling_cases').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counseling-cases'] }),
  })
}

export function useUpdateCounselingCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CounselingCaseInput> & { id: string }) => {
      const { error } = await supabase.from('counseling_cases').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counseling-cases'] }),
  })
}

export function useDeleteCounselingCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('counseling_cases').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counseling-cases'] }),
  })
}
