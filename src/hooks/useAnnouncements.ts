import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Announcement, AnnouncementPriority } from '@/types/database'

export function useAnnouncements(limit?: number) {
  return useQuery({
    queryKey: ['announcements', limit],
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select('*, author:profiles(*)')
        .order('published_at', { ascending: false })
      if (limit) query = query.limit(limit)
      const { data, error } = await query
      if (error) throw error
      return data as Announcement[]
    },
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      body: string
      priority: AnnouncementPriority
      created_by: string
      expires_at?: string | null
    }) => {
      const { error } = await supabase.from('announcements').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })
}
