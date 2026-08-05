import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface OpAiChatTurn {
  role: 'user' | 'model'
  text: string
}

export function useOpAiChatReply() {
  return useMutation({
    mutationFn: async (input: { history: OpAiChatTurn[]; message: string }) => {
      const { data, error } = await supabase.functions.invoke('op-ai-chat', { body: input })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.reply as string
    },
  })
}
