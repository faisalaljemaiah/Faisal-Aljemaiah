import { PageHeader } from '@/components/PageHeader'
import AdminScheduleGrid from './AdminScheduleGrid'

export default function AdminSchedulesPage() {
  return (
    <div>
      <PageHeader title="Schedule" description="Assign a daily activity code to each trainee, Sunday through Thursday." />
      <AdminScheduleGrid />
    </div>
  )
}
