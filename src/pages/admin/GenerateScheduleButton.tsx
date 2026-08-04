import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useBulkSetScheduleEntries } from '@/hooks/useSchedule'
import { generateFairSchedule } from '@/lib/scheduleGenerate'
import type { Profile, ScheduleCodeType, ScheduleEntry } from '@/types/database'

export function GenerateScheduleButton({
  interns,
  codeTypes,
  weeks,
  entries,
  rangeLabel,
}: {
  interns: Profile[]
  codeTypes: ScheduleCodeType[]
  weeks: Date[][]
  entries: ScheduleEntry[]
  rangeLabel: string
}) {
  const { profile } = useAuth()
  const bulkSet = useBulkSetScheduleEntries()
  const [open, setOpen] = React.useState(false)

  const rotatingCodes = codeTypes.filter((c) => c.rotates)
  const days = weeks.flat()

  async function handleGenerate() {
    if (!profile) return
    if (rotatingCodes.length === 0) {
      toast.error('Add at least one code first', { description: 'Codes marked "manual only" are skipped by the generator.' })
      return
    }
    if (interns.length === 0) {
      toast.error('No trainees to schedule yet.')
      return
    }
    try {
      const rows = generateFairSchedule({
        internIds: interns.map((i) => i.id),
        days,
        rotatingCodes,
        existingEntries: entries,
        createdBy: profile.id,
      })
      if (rows.length === 0) {
        toast.info('Nothing to fill — every day in this range already has a code.')
        setOpen(false)
        return
      }
      await bulkSet.mutateAsync(rows)
      toast.success(`Filled ${rows.length} empty day${rows.length === 1 ? '' : 's'} across ${interns.length} trainee${interns.length === 1 ? '' : 's'}`)
      setOpen(false)
    } catch (e) {
      toast.error('Could not generate the schedule', { description: (e as Error).message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Wand2 className="h-3.5 w-3.5" /> Generate Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate schedule</DialogTitle>
          <DialogDescription>
            Fills every empty day for {rangeLabel} by fairly rotating each trainee through{' '}
            {rotatingCodes.length} site{rotatingCodes.length === 1 ? '' : 's'} — whoever's had the least of a
            site so far gets it next. Days you've already assigned by hand are left untouched.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={bulkSet.isPending}>
            {bulkSet.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
