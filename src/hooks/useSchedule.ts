import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { dateKey } from '@/lib/scheduleDates'
import type { ScheduleCode, ScheduleEntry } from '@/types/database'

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
        .select('*, user:profiles(*)')
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
      code: ScheduleCode | null
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
