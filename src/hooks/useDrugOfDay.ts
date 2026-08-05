import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { DrugOfDay, DrugOfDayCompletion, DrugOfDayQuestion } from '@/types/database'

export function useTodaysDrug() {
  return useQuery({
    queryKey: ['drug-of-day', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drug_of_day')
        .select('*, questions:drug_of_day_questions(*)')
        .lte('publish_date', new Date().toISOString().slice(0, 10))
        .order('publish_date', { ascending: false })
        .order('order_index', { foreignTable: 'drug_of_day_questions', ascending: true })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as (DrugOfDay & { questions: DrugOfDayQuestion[] }) | null
    },
  })
}

// Includes upcoming (not just past) entries — needed both to show admins
// what's already scheduled and to know which dates bulk-imported drugs
// should skip.
export function useDrugOfDayHistory() {
  return useQuery({
    queryKey: ['drug-of-day', 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drug_of_day')
        .select('*')
        .order('publish_date', { ascending: false })
        .limit(90)
      if (error) throw error
      return data as DrugOfDay[]
    },
  })
}

export function useMyDrugOfDayCompletion(drugOfDayId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['drug-of-day-completion', drugOfDayId, user?.id],
    enabled: !!drugOfDayId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drug_of_day_completions')
        .select('*')
        .eq('drug_of_day_id', drugOfDayId!)
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as DrugOfDayCompletion | null
    },
  })
}

export function useSubmitDrugOfDayQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { drugOfDayId: string; answers: { question_id: string; selected_index: number }[] }) => {
      const { data, error } = await supabase.rpc('submit_drug_of_day_quiz', {
        p_drug_of_day_id: input.drugOfDayId,
        p_answers: input.answers,
      })
      if (error) throw error
      return data as DrugOfDayCompletion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drug-of-day-completion'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useCreateDrugOfDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      drug_name: string
      generic_name?: string
      drug_class?: string
      mechanism: string
      indications: string
      contraindications: string
      counseling_points: string
      publish_date: string
      created_by: string
      questions: { question: string; choices: string[]; correct_index: number; explanation?: string }[]
    }) => {
      const { questions, ...drugInput } = input
      const { data: drug, error } = await supabase.from('drug_of_day').insert(drugInput).select().single()
      if (error) throw error

      if (questions.length > 0) {
        const { error: qError } = await supabase.from('drug_of_day_questions').insert(
          questions.map((q, idx) => ({
            drug_of_day_id: drug.id,
            question: q.question,
            choices: q.choices,
            correct_index: q.correct_index,
            explanation: q.explanation ?? null,
            order_index: idx,
          }))
        )
        if (qError) throw qError
      }
      return drug as DrugOfDay
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drug-of-day'] }),
  })
}

export interface DrugOfDayImportRow {
  drug_name: string
  generic_name?: string
  drug_class?: string
  mechanism: string
  indications: string
  contraindications: string
  counseling_points: string
}

export function useBulkImportDrugsOfDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      rows,
      publishDates,
      created_by,
    }: {
      rows: DrugOfDayImportRow[]
      publishDates: string[]
      created_by: string
    }) => {
      const payload = rows.map((row, idx) => ({ ...row, publish_date: publishDates[idx], created_by }))
      const { error } = await supabase.from('drug_of_day').insert(payload)
      if (error) throw error
      return payload.length
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drug-of-day'] }),
  })
}

export function useDeleteDrugOfDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drug_of_day').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drug-of-day'] }),
  })
}
