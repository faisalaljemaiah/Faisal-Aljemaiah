import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalyticsSummary } from '@/hooks/useAnalytics'
import { useLeaderboard } from '@/hooks/useLeaderboard'

const COLORS = ['#1a5c3f', '#3d8f68', '#8fc9a8', '#c7e3d3', '#e0685a', '#e0b85a']

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useAnalyticsSummary()
  const { data: topInterns } = useLeaderboard('all_time')

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Analytics" description="Program-wide performance and engagement metrics." />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const attendanceData = Object.entries(data.attendanceBreakdown).map(([name, value]) => ({ name, value }))
  const reflectionData = Object.entries(data.reflectionBreakdown).map(([name, value]) => ({ name, value }))
  const topTenData = (topInterns ?? []).slice(0, 10).map((r) => ({ name: r.full_name.split(' ')[0], points: r.points }))

  const stats = [
    { label: 'Active Interns', value: data.internCount },
    { label: 'Avg. Points / Intern', value: data.avgPoints },
    { label: 'Drug Quiz Completions', value: data.totalDrugCompletions },
    { label: 'Avg. Counseling Score', value: `${data.avgCounselingScore}%` },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Analytics" description="Program-wide performance and engagement metrics." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Interns by Points</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTenData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="points" fill="#1a5c3f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {attendanceData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No shift data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendanceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {attendanceData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reflection Status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {reflectionData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No reflections yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reflectionData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {reflectionData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
