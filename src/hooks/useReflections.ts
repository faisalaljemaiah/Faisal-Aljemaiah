import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Reflection, ReflectionStatus } from '@/types/database'

export function useMyReflections() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['reflections', 'me', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user!.id)
        .order('entry_date', { ascending: false })
      if (error) throw error
      return data as Reflection[]
    },
  })
}

export function useAllReflections() {
  return useQuery({
    queryKey: ['reflections', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections')
        .select('*, author:profiles!reflections_user_id_fkey(*)')
        .order('entry_date', { ascending: false })
      if (error) throw error
      return data as Reflection[]
    },
  })
}

export function useSaveReflection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id?: string
      user_id: string
      title: string
      content: string
      entry_date: string
      rotation_id?: string | null
      status: ReflectionStatus
    }) => {
      if (input.id) {
        const { id, ...rest } = input
        const { error } = await supabase.from('reflections').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('reflections').insert(input)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reflections'] }),
  })
}

export function useDeleteReflection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reflections').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reflections'] }),
  })
}

export function useReviewReflection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reviewer_id, reviewer_feedback }: { id: string; reviewer_id: string; reviewer_feedback: string }) => {
      const { error } = await supabase
        .from('reflections')
        .update({ status: 'reviewed', reviewer_id, reviewer_feedback })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reflections'] }),
  })
}
