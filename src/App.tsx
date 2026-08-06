import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ProtectedRoute, RoleRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import NotFoundPage from '@/pages/NotFoundPage'

const SchedulePage = lazy(() => import('@/pages/SchedulePage'))
const DrugOfDayPage = lazy(() => import('@/pages/DrugOfDayPage'))
const DrugLocatorPage = lazy(() => import('@/pages/DrugLocatorPage'))
const CounselingSimulatorPage = lazy(() => import('@/pages/CounselingSimulatorPage'))
const CounselingCasePage = lazy(() => import('@/pages/CounselingCasePage'))
const ReflectionsPage = lazy(() => import('@/pages/ReflectionsPage'))
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'))
const AnnouncementsPage = lazy(() => import('@/pages/AnnouncementsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'))
const AdminInternsPage = lazy(() => import('@/pages/admin/AdminInternsPage'))
const AdminSchedulesPage = lazy(() => import('@/pages/admin/AdminSchedulesPage'))
const AdminDrugOfDayPage = lazy(() => import('@/pages/admin/AdminDrugOfDayPage'))
const AdminDrugLocatorPage = lazy(() => import('@/pages/admin/AdminDrugLocatorPage'))
const AdminCounselingCasesPage = lazy(() => import('@/pages/admin/AdminCounselingCasesPage'))
const AdminAnnouncementsPage = lazy(() => import('@/pages/admin/AdminAnnouncementsPage'))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))
const AdminReflectionsPage = lazy(() => import('@/pages/admin/AdminReflectionsPage'))

function RouteFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="drug-of-the-day" element={<DrugOfDayPage />} />
            <Route path="drug-locator" element={<DrugLocatorPage />} />
            <Route path="counseling-simulator" element={<CounselingSimulatorPage />} />
            <Route path="counseling-simulator/:caseId" element={<CounselingCasePage />} />
            <Route path="reflections" element={<ReflectionsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="profile" element={<ProfilePage />} />

            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="interns" element={<AdminInternsPage />} />
                <Route path="schedules" element={<AdminSchedulesPage />} />
                <Route path="drug-of-the-day" element={<AdminDrugOfDayPage />} />
                <Route path="drug-locator" element={<AdminDrugLocatorPage />} />
                <Route path="counseling-cases" element={<AdminCounselingCasesPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="reflections" element={<AdminReflectionsPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
