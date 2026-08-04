import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { dateKey } from '@/lib/scheduleDates'
import type { ScheduleColorKey } from '@/lib/scheduleCodes'
import type { GeneratedRow } from '@/lib/scheduleGenerate'
import type { ScheduleCodeType, ScheduleEntry } from '@/types/database'

export function useScheduleCodeTypes() {
  return useQuery({
    queryKey: ['schedule-code-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('schedule_code_types').select('*').order('sort_order', { ascending: true })
      if (error) throw error
      return data as ScheduleCodeType[]
    },
  })
}

export function useCreateScheduleCodeType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      code,
      label,
      color,
      sortOrder,
      rotates,
      createdBy,
    }: {
      code: string
      label: string
      color: ScheduleColorKey
      sortOrder: number
      rotates: boolean
      createdBy: string
    }) => {
      const { error } = await supabase
        .from('schedule_code_types')
        .insert({ code, short_label: code, label, color, sort_order: sortOrder, rotates, created_by: createdBy })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-code-types'] })
    },
  })
}

export function useDeleteScheduleCodeType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from('schedule_code_types').delete().eq('code', code)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-code-types'] })
    },
  })
}

export function useMyScheduleEntries(startDate: Date, endDate: Date) {
  const { user } = useAuth()
  const startKey = dateKey(startDate)
  const endKey = dateKey(endDate)
  return useQuery({
    queryKey: ['schedule-entries', 'me', user?.id, startKey, endKey],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_entries')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', startKey)
        .lte('date', endKey)
      if (error) throw error
      return data as ScheduleEntry[]
    },
  })
}

export function useAllScheduleEntries(startDate: Date, endDate: Date) {
  const startKey = dateKey(startDate)
  const endKey = dateKey(endDate)
  return useQuery({
    queryKey: ['schedule-entries', 'all', startKey, endKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_entries')
        .select('*, user:profiles!schedule_entries_user_id_fkey(*)')
        .gte('date', startKey)
        .lte('date', endKey)
      if (error) throw error
      return data as ScheduleEntry[]
    },
  })
}

export function useSetScheduleEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      date,
      code,
      createdBy,
    }: {
      userId: string
      date: Date
      code: string | null
      createdBy: string
    }) => {
      if (code === null) {
        const { error } = await supabase
          .from('schedule_entries')
          .delete()
          .eq('user_id', userId)
          .eq('date', dateKey(date))
        if (error) throw error
        return
      }
      const { error } = await supabase
        .from('schedule_entries')
        .upsert({ user_id: userId, date: dateKey(date), code, created_by: createdBy }, { onConflict: 'user_id,date' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-entries'] })
    },
  })
}

export function useBulkSetScheduleEntries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rows: GeneratedRow[]) => {
      if (rows.length === 0) return
      const { error } = await supabase.from('schedule_entries').upsert(rows, { onConflict: 'user_id,date' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-entries'] })
    },
  })
}
