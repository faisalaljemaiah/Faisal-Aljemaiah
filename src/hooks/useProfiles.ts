import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types/database'

export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true })
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useInterns() {
  return useQuery({
    queryKey: ['profiles', 'interns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'intern')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Profile> & { id: string }) => {
      const { error } = await supabase.from('profiles').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

export interface CreateInternInput {
  email: string
  full_name: string
  role?: UserRole
  school?: string
  cohort?: string
  year_level?: string
  phone?: string
}

export function useCreateIntern() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInternInput) => {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'create', ...input, redirectTo: `${window.location.origin}/reset-password` },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data as { user_id: string }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'delete', user_id },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

export function useAdjustPoints() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ user_id, points, reason }: { user_id: string; points: number; reason: string }) => {
      const { error } = await supabase.from('points_ledger').insert({
        user_id,
        points,
        reason,
        source_type: 'admin_adjustment',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}
