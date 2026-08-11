import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Drug, MedicationCategory, OpSite } from '@/types/database'

export function useDrugSearch(search: string, category?: MedicationCategory | 'all', opSite?: OpSite | 'all') {
  return useQuery({
    queryKey: ['drugs', search, category, opSite],
    queryFn: async () => {
      let query = supabase.from('drugs').select('*').order('generic_name', { ascending: true })
      const term = search.trim().replace(/[,()%]/g, '')
      if (term) {
        query = query.or(`generic_name.ilike.%${term}%,brand_names.cs.{${term}}`)
      }
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }
      if (opSite && opSite !== 'all') {
        query = query.eq('op_site', opSite)
      }
      const { data, error } = await query.limit(200)
      if (error) throw error
      return data as Drug[]
    },
  })
}

export function useDrugCategories() {
  return useQuery({
    queryKey: ['drugs', 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drugs').select('category').not('category', 'is', null)
      if (error) throw error
      const unique = Array.from(new Set((data as { category: string }[]).map((d) => d.category))).sort()
      return unique
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

export type DrugImportRow = Omit<DrugInput, 'image_urls'>

export function useBulkImportDrugs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rows, created_by }: { rows: DrugImportRow[]; created_by: string }) => {
      const payload = rows.map((row) => ({ ...row, image_urls: [], created_by }))
      const { error } = await supabase.from('drugs').insert(payload)
      if (error) throw error
      return payload.length
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drugs'] }),
  })
}

export function useUploadDrugImage() {
  return useMutation({
    mutationFn: async ({ drugId, file }: { drugId: string; file: File }) => {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${drugId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('medication-images').upload(path, file, {
        cacheControl: '31536000',
        upsert: false,
      })
      if (error) throw error
      const { data } = supabase.storage.from('medication-images').getPublicUrl(path)
      return data.publicUrl
    },
  })
}

export function useRemoveDrugImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ drugId, url, remainingUrls }: { drugId: string; url: string; remainingUrls: string[] }) => {
      const path = url.split('/medication-images/')[1]
      if (path) {
        await supabase.storage.from('medication-images').remove([path])
      }
      const { error } = await supabase.from('drugs').update({ image_urls: remainingUrls }).eq('id', drugId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drugs'] }),
  })
}
