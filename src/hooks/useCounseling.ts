import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CaseDifficulty, CounselingAttempt, CounselingCase, CounselingCaseQuestion } from '@/types/database'

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
      const { data, error } = await supabase
        .from('counseling_cases')
        .select('*, questions:counseling_case_questions(*)')
        .eq('id', caseId!)
        .order('order_index', { foreignTable: 'counseling_case_questions', ascending: true })
        .single()
      if (error) throw error
      return data as CounselingCase & { questions: CounselingCaseQuestion[] }
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
    mutationFn: async (input: {
      caseId: string
      coveredPointIds: string[]
      durationSeconds: number
      mcqAnswers?: { question_id: string; selected_index: number }[]
    }) => {
      const { data, error } = await supabase.rpc('submit_counseling_attempt', {
        p_case_id: input.caseId,
        p_covered_point_ids: input.coveredPointIds,
        p_duration_seconds: input.durationSeconds,
        p_mcq_answers: input.mcqAnswers ?? [],
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

export interface CounselingChatTurn {
  role: 'user' | 'model'
  text: string
}

export function useCounselingChatReply() {
  return useMutation({
    mutationFn: async (input: {
      case: Pick<CounselingCase, 'patient_name' | 'patient_age' | 'patient_gender' | 'medication' | 'scenario'>
      history: CounselingChatTurn[]
      message: string
    }) => {
      const { data, error } = await supabase.functions.invoke('counseling-chat', { body: input })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.reply as string
    },
  })
}

export type CounselingQuestionInput = {
  question: string
  choices: string[]
  correct_index: number
  explanation?: string | null
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
    mutationFn: async (input: CounselingCaseInput & { questions?: CounselingQuestionInput[] }) => {
      const { questions, ...caseInput } = input
      const { data: created, error } = await supabase.from('counseling_cases').insert(caseInput).select().single()
      if (error) throw error

      if (questions && questions.length > 0) {
        const { error: qError } = await supabase.from('counseling_case_questions').insert(
          questions.map((q, idx) => ({
            case_id: created.id,
            question: q.question,
            choices: q.choices,
            correct_index: q.correct_index,
            explanation: q.explanation ?? null,
            order_index: idx,
          }))
        )
        if (qError) throw qError
      }
      return created as CounselingCase
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counseling-cases'] }),
  })
}

export function useUpdateCounselingCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      questions,
      ...input
    }: Partial<CounselingCaseInput> & { id: string; questions?: CounselingQuestionInput[] }) => {
      const { error } = await supabase.from('counseling_cases').update(input).eq('id', id)
      if (error) throw error

      if (questions) {
        const { error: deleteError } = await supabase.from('counseling_case_questions').delete().eq('case_id', id)
        if (deleteError) throw deleteError
        if (questions.length > 0) {
          const { error: qError } = await supabase.from('counseling_case_questions').insert(
            questions.map((q, idx) => ({
              case_id: id,
              question: q.question,
              choices: q.choices,
              correct_index: q.correct_index,
              explanation: q.explanation ?? null,
              order_index: idx,
            }))
          )
          if (qError) throw qError
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counseling-cases'] })
      queryClient.invalidateQueries({ queryKey: ['counseling-case'] })
    },
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

export type CounselingCaseImportRow = Omit<CounselingCaseInput, 'created_by'>

export function useBulkImportCounselingCases() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rows, created_by }: { rows: CounselingCaseImportRow[]; created_by: string }) => {
      const payload = rows.map((row) => ({ ...row, created_by }))
      const { error } = await supabase.from('counseling_cases').insert(payload)
      if (error) throw error
      return payload.length
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counseling-cases'] }),
  })
}
