import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Settings2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateScheduleCodeType, useDeleteScheduleCodeType, useScheduleCodeTypes } from '@/hooks/useSchedule'
import { SCHEDULE_COLOR_PALETTE, scheduleSwatchClasses, type ScheduleColorKey } from '@/lib/scheduleCodes'
import { cn } from '@/lib/utils'

const COLOR_KEYS = Object.keys(SCHEDULE_COLOR_PALETTE) as ScheduleColorKey[]

export function ManageScheduleCodesDialog() {
  const { profile } = useAuth()
  const { data: codeTypes, isLoading } = useScheduleCodeTypes()
  const createCode = useCreateScheduleCodeType()
  const deleteCode = useDeleteScheduleCodeType()

  const [open, setOpen] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [label, setLabel] = React.useState('')
  const [color, setColor] = React.useState<ScheduleColorKey>('slate')
  const [rotates, setRotates] = React.useState(true)

  async function handleAdd() {
    if (!profile) return
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode || !label.trim()) {
      toast.error('Enter both a code and a label.')
      return
    }
    try {
      await createCode.mutateAsync({
        code: trimmedCode,
        label: label.trim(),
        color,
        sortOrder: (codeTypes?.length ?? 0) + 1,
        rotates,
        createdBy: profile.id,
      })
      toast.success(`Added ${trimmedCode}`)
      setCode('')
      setLabel('')
      setColor('slate')
      setRotates(true)
    } catch (e) {
      toast.error('Could not add that code', { description: (e as Error).message })
    }
  }

  async function handleDelete(codeToDelete: string) {
    try {
      await deleteCode.mutateAsync(codeToDelete)
      toast.success(`Removed ${codeToDelete}`)
    } catch {
      toast.error('Could not remove that code', {
        description: 'It may still be assigned to a trainee on the schedule.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-3.5 w-3.5" /> Manage codes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule codes</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            (codeTypes ?? []).map((ct) => (
              <div key={ct.code} className="flex items-center gap-2 rounded-lg border p-2">
                <span className={cn('h-4 w-4 shrink-0 rounded-sm', scheduleSwatchClasses(ct.color))} />
                <span className="w-14 shrink-0 truncate text-xs font-semibold">{ct.short_label}</span>
                <span className="flex-1 truncate text-xs text-muted-foreground">{ct.label}</span>
                {!ct.rotates && (
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">manual only</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive"
                  onClick={() => handleDelete(ct.code)}
                  disabled={deleteCode.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">Add a new code</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-code">Code</Label>
              <Input id="new-code" placeholder="OP4" value={code} onChange={(e) => setCode(e.target.value)} maxLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-label">Label</Label>
              <Input id="new-label" placeholder="Cardiology Clinic" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  title={SCHEDULE_COLOR_PALETTE[key].name}
                  onClick={() => setColor(key)}
                  className={cn(
                    'h-6 w-6 rounded-full transition-transform active:scale-90',
                    scheduleSwatchClasses(key),
                    color === key && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                  )}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={rotates} onCheckedChange={(v) => setRotates(v === true)} />
            Include in "Generate Schedule" (uncheck for one-off codes like Surprise)
          </label>
          <Button size="sm" className="w-full" onClick={handleAdd} disabled={createCode.isPending}>
            {createCode.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
