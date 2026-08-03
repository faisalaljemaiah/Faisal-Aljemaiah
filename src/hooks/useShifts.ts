import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { periodTimes, SHIFT_PERIODS, type ShiftPeriod } from '@/lib/shiftPeriods'
import type { Shift, ShiftAssignment, ShiftStatus } from '@/types/database'

export function useMyShiftAssignments() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['shift-assignments', 'me', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_assignments')
        .select('*, shift:shifts(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as ShiftAssignment[]).filter((a) => a.shift)
    },
  })
}

export function useAllShiftAssignments() {
  return useQuery({
    queryKey: ['shift-assignments', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_assignments')
        .select('*, shift:shifts(*), user:profiles(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ShiftAssignment[]
    },
  })
}

export function useShiftAssignmentsInRange(startIso: string, endIso: string) {
  return useQuery({
    queryKey: ['shift-assignments', 'range', startIso, endIso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_assignments')
        .select('*, shift:shifts!inner(*), user:profiles(*)')
        .gte('shift.start_time', startIso)
        .lt('shift.start_time', endIso)
      if (error) throw error
      return data as ShiftAssignment[]
    },
  })
}

export interface ScheduleChange {
  date: Date
  period: ShiftPeriod
}

export function useSaveInternSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      internId,
      toAssign,
      toRemoveAssignmentIds,
      createdBy,
    }: {
      internId: string
      toAssign: ScheduleChange[]
      toRemoveAssignmentIds: string[]
      createdBy: string
    }) => {
      if (toRemoveAssignmentIds.length > 0) {
        const { error } = await supabase.from('shift_assignments').delete().in('id', toRemoveAssignmentIds)
        if (error) throw error
      }

      for (const { date, period } of toAssign) {
        const { start, end } = periodTimes(date, period)
        const startIso = start.toISOString()
        const endIso = end.toISOString()

        const { data: existing, error: findError } = await supabase
          .from('shifts')
          .select('id')
          .eq('start_time', startIso)
          .eq('end_time', endIso)
          .maybeSingle()
        if (findError) throw findError

        let shiftId = existing?.id as string | undefined
        if (!shiftId) {
          const label = SHIFT_PERIODS.find((p) => p.id === period)!.label
          const { data: created, error: createError } = await supabase
            .from('shifts')
            .insert({
              title: `${label} Shift`,
              shift_type: 'clinical',
              start_time: startIso,
              end_time: endIso,
              created_by: createdBy,
            })
            .select('id')
            .single()
          if (createError) throw createError
          shiftId = created.id
        }

        const { error: assignError } = await supabase
          .from('shift_assignments')
          .upsert({ shift_id: shiftId, user_id: internId }, { onConflict: 'shift_id,user_id', ignoreDuplicates: true })
        if (assignError) throw assignError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
  })
}

export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shifts').select('*').order('start_time', { ascending: true })
      if (error) throw error
      return data as Shift[]
    },
  })
}

export function useUpdateShiftAssignmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      checkInTime,
      checkOutTime,
    }: {
      id: string
      status: ShiftStatus
      checkInTime?: string
      checkOutTime?: string
    }) => {
      const { error } = await supabase
        .from('shift_assignments')
        .update({
          status,
          ...(checkInTime ? { check_in_time: checkInTime } : {}),
          ...(checkOutTime ? { check_out_time: checkOutTime } : {}),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] })
    },
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      description?: string
      location?: string
      shift_type: string
      rotation_id?: string | null
      start_time: string
      end_time: string
      created_by: string
      assignee_ids: string[]
    }) => {
      const { assignee_ids, ...shiftInput } = input
      const { data: shift, error } = await supabase.from('shifts').insert(shiftInput).select().single()
      if (error) throw error

      if (assignee_ids.length > 0) {
        const { error: assignError } = await supabase
          .from('shift_assignments')
          .insert(assignee_ids.map((user_id) => ({ shift_id: shift.id, user_id })))
        if (assignError) throw assignError
      }
      return shift as Shift
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] })
    },
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shifts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] })
    },
  })
}
