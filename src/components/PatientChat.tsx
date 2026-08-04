import * as React from 'react'
import { Send, Stethoscope, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCounselingChatReply, type CounselingChatTurn } from '@/hooks/useCounseling'
import { getInitials, cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { CounselingCase } from '@/types/database'

interface PatientChatProps {
  case: Pick<CounselingCase, 'patient_name' | 'patient_age' | 'patient_gender' | 'medication' | 'scenario'>
}

interface DisplayMessage {
  role: 'user' | 'model'
  text: string
}

export function PatientChat({ case: c }: PatientChatProps) {
  const [started, setStarted] = React.useState(false)
  const [messages, setMessages] = React.useState<DisplayMessage[]>([])
  const [draft, setDraft] = React.useState('')
  const chatReply = useCounselingChatReply()
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, chatReply.isPending])

  async function sendTurn(history: CounselingChatTurn[], message: string, displayText?: string) {
    if (displayText) {
      setMessages((prev) => [...prev, { role: 'user', text: displayText }])
    }
    try {
      const reply = await chatReply.mutateAsync({ case: c, history, message })
      setMessages((prev) => [...prev, { role: 'model', text: reply }])
    } catch (e) {
      toast.error('Could not reach the practice patient', { description: (e as Error).message })
    }
  }

  function handleStart() {
    setStarted(true)
    void sendTurn([], '(The intern approaches you to begin the counseling conversation.)')
  }

  function handleReset() {
    setStarted(false)
    setMessages([])
    setDraft('')
  }

  function handleSend() {
    const text = draft.trim()
    if (!text || chatReply.isPending) return
    const history: CounselingChatTurn[] = messages.map((m) => ({ role: m.role, text: m.text }))
    setDraft('')
    void sendTurn(history, text, text)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope className="h-4 w-4 text-primary" /> Practice with {c.patient_name}
        </CardTitle>
        {started && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!started ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              Have a live counseling conversation with an AI playing {c.patient_name}. It's a low-stakes way to
              rehearse before you check off the counseling checklist.
            </p>
            <Button onClick={handleStart} disabled={chatReply.isPending}>
              Start conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <ScrollArea className="h-72 rounded-lg border p-3">
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={cn('flex items-end gap-2', m.role === 'user' && 'flex-row-reverse')}>
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {m.role === 'user' ? 'You' : getInitials(c.patient_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                        m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatReply.isPending && (
                  <div className="flex items-end gap-2">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-[10px]">{getInitials(c.patient_name)}</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Typing…</div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={`Say something to ${c.patient_name}...`}
                className="min-h-[44px] resize-none"
                rows={1}
              />
              <Button size="icon" onClick={handleSend} disabled={!draft.trim() || chatReply.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is an AI simulation for practice — it doesn't grade you. Use the checklist to track what you
              covered.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
