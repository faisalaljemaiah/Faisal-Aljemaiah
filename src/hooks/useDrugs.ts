import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Drug } from '@/types/database'

export function useDrugSearch(search: string) {
  return useQuery({
    queryKey: ['drugs', search],
    queryFn: async () => {
      let query = supabase.from('drugs').select('*').order('generic_name', { ascending: true })
      const term = search.trim().replace(/[,()%]/g, '')
      if (term) {
        query = query.or(`generic_name.ilike.%${term}%,brand_names.cs.{${term}}`)
      }
      const { data, error } = await query.limit(100)
      if (error) throw error
      return data as Drug[]
    },
  })
}

export type DrugInput = Omit<Drug, 'id' | 'created_at' | 'updated_at' | 'created_by'>

export function useCreateDrug() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DrugInput & { created_by: string }) => {
      const { error } = await supabase.from('drugs').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drugs'] }),
  })
}

export function useUpdateDrug() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<DrugInput> & { id: string }) => {
      const { error } = await supabase.from('drugs').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drugs'] }),
  })
}

export function useDeleteDrug() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drugs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drugs'] }),
  })
}
