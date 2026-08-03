import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LeaderboardRow, UserBadge } from '@/types/database'

export type LeaderboardPeriod = 'all_time' | 'weekly' | 'monthly'

const viewByPeriod: Record<LeaderboardPeriod, string> = {
  all_time: 'leaderboard_all_time',
  weekly: 'leaderboard_weekly',
  monthly: 'leaderboard_monthly',
}

export function useLeaderboard(period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const { data, error } = await supabase.from(viewByPeriod[period]).select('*').order('rank', { ascending: true }).limit(50)
      if (error) throw error
      return data as LeaderboardRow[]
    },
  })
}

export function useMyBadges(userId?: string) {
  return useQuery({
    queryKey: ['user-badges', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId!)
        .order('awarded_at', { ascending: false })
      if (error) throw error
      return data as UserBadge[]
    },
  })
}
