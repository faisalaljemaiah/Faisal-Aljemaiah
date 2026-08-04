import * as React from 'react'
import { LogIn, LogOut, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Reveal } from '@/components/Reveal'
import { ScheduleCalendar } from '@/components/ScheduleCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyShiftAssignments, useUpdateShiftAssignmentStatus } from '@/hooks/useShifts'
import { useRotations } from '@/hooks/useRotations'
import { formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { ShiftStatus } from '@/types/database'

const statusVariant: Record<ShiftStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline'> = {
  scheduled: 'secondary',
  confirmed: 'default',
  completed: 'success',
  missed: 'destructive',
  excused: 'outline',
  late: 'warning',
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = React.useState(new Date())
  const { data: assignments, isLoading } = useMyShiftAssignments()
  const { data: rotations } = useRotations()
  const updateStatus = useUpdateShiftAssignmentStatus()

  const dayAssignments = (assignments ?? [])
    .filter((a) => a.shift && new Date(a.shift.start_time).toDateString() === selectedDate.toDateString())
    .sort((a, b) => new Date(a.shift!.start_time).getTime() - new Date(b.shift!.start_time).getTime())

  async function handleCheckIn(id: string) {
    try {
      await updateStatus.mutateAsync({ id, status: 'confirmed', checkInTime: new Date().toISOString() })
      toast.success('Checked in')
    } catch (e) {
      toast.error('Could not check in', { description: (e as Error).message })
    }
  }

  async function handleCheckOut(id: string) {
    try {
      await updateStatus.mutateAsync({ id, status: 'completed', checkOutTime: new Date().toISOString() })
      toast.success('Checked out')
    } catch (e) {
      toast.error('Could not check out', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader title="Schedule" description="Your rotation calendar, shift assignments, and attendance." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-1"><Card>
          <CardContent className="pt-5">
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ScheduleCalendar assignments={assignments ?? []} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            )}
          </CardContent>
        </Card></Reveal>

        <Reveal delay={70} className="lg:col-span-2"><Card>
          <CardHeader>
            <CardTitle>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : dayAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shifts scheduled this day.</p>
            ) : (
              dayAssignments.map((a) => (
                <div key={a.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.shift!.title}</p>
                      <Badge variant={statusVariant[a.status]} className="capitalize">
                        {a.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatTime(a.shift!.start_time)} – {formatTime(a.shift!.end_time)}
                    </p>
                    {a.shift!.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {a.shift!.location}
                      </p>
                    )}
                    {a.shift!.description && <p className="mt-2 text-sm">{a.shift!.description}</p>}
                  </div>

                  <div className="flex gap-2">
                    {a.status === 'scheduled' && (
                      <Button size="sm" onClick={() => handleCheckIn(a.id)} disabled={updateStatus.isPending}>
                        <LogIn className="h-4 w-4" /> Check in
                      </Button>
                    )}
                    {a.status === 'confirmed' && (
                      <Button size="sm" variant="secondary" onClick={() => handleCheckOut(a.id)} disabled={updateStatus.isPending}>
                        <LogOut className="h-4 w-4" /> Check out
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card></Reveal>
      </div>

      <Reveal delay={140}><Card className="mt-4">
        <CardHeader>
          <CardTitle>Active Rotations</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(rotations ?? []).length === 0 && <p className="text-sm text-muted-foreground">No rotations published yet.</p>}
          {(rotations ?? []).map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.department}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(r.start_date)} – {formatDate(r.end_date)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card></Reveal>
    </div>
  )
}
