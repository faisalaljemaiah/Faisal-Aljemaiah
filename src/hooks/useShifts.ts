import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
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
