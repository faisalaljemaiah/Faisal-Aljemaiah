import * as React from 'react'
import { Sparkles, Send, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useOpAiChatReply, type OpAiChatTurn } from '@/hooks/useOpAi'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DisplayMessage {
  role: 'user' | 'model'
  text: string
}

const SUGGESTIONS = [
  'What do the schedule codes (OP1, OP2, COMP...) mean?',
  'Give me a mnemonic for beta-blocker side effects.',
  'How do I submit a reflection?',
  'Quiz me on one counseling point for metformin.',
]

export function OpAiChat() {
  const { profile } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<DisplayMessage[]>([])
  const [draft, setDraft] = React.useState('')
  const chatReply = useOpAiChatReply()
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, chatReply.isPending])

  async function sendTurn(text: string) {
    const history: OpAiChatTurn[] = messages.map((m) => ({ role: m.role, text: m.text }))
    setMessages((prev) => [...prev, { role: 'user', text }])
    setDraft('')
    try {
      const reply = await chatReply.mutateAsync({ history, message: text })
      setMessages((prev) => [...prev, { role: 'model', text: reply }])
    } catch (e) {
      toast.error('OP AI is unavailable', { description: (e as Error).message })
    }
  }

  function handleSend() {
    const text = draft.trim()
    if (!text || chatReply.isPending) return
    void sendTurn(text)
  }

  function handleReset() {
    setMessages([])
    setDraft('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open OP AI"
        className={cn(
          'fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-gradient-to-br from-teal-500 to-primary text-white shadow-lg shadow-teal-600/30',
          'transition-transform duration-200 ease-out-expo hover:scale-105 active:scale-95',
          'md:bottom-6 md:right-6',
          open && 'scale-0 opacity-0 pointer-events-none'
        )}
      >
        <Sparkles className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-3 pr-12">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-primary text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                OP AI
              </SheetTitle>
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <SheetDescription className="text-xs">
              For educational use only — not a substitute for your preceptor or official clinical references.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    Hi{profile?.full_name ? ` ${profile.full_name.split(' ')[0]}` : ''}! Ask me about pharmacy
                    concepts, study help, or how anything in OP Interns works.
                  </p>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void sendTurn(s)}
                        className="rounded-lg border bg-muted/40 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn('flex items-end gap-2', m.role === 'user' && 'flex-row-reverse')}>
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {m.role === 'user' ? (profile ? getInitials(profile.full_name) : 'You') : <Sparkles className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
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
                    <AvatarFallback className="text-[10px]">
                      <Sparkles className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Thinking…</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="flex items-end gap-2 border-t p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask OP AI anything..."
              className="min-h-[44px] resize-none"
              rows={1}
            />
            <Button size="icon" onClick={handleSend} disabled={!draft.trim() || chatReply.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
