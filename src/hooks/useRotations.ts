import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Rotation } from '@/types/database'

export function useRotations() {
  return useQuery({
    queryKey: ['rotations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('rotations').select('*').order('start_date', { ascending: false })
      if (error) throw error
      return data as Rotation[]
    },
  })
}

export function useCreateRotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      department: string
      description?: string
      location?: string
      start_date: string
      end_date: string
      created_by: string
    }) => {
      const { error } = await supabase.from('rotations').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rotations'] }),
  })
}

export function useDeleteRotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rotations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rotations'] }),
  })
}
