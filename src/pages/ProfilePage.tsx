import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdateProfile } from '@/hooks/useProfiles'
import { getInitials } from '@/lib/utils'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  school: z.string().optional(),
  cohort: z.string().optional(),
  year_level: z.string().optional(),
  bio: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { profile, refreshProfile, updatePassword } = useAuth()
  const updateProfile = useUpdateProfile()
  const [passwordSubmitting, setPasswordSubmitting] = React.useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          full_name: profile.full_name,
          phone: profile.phone ?? '',
          school: profile.school ?? '',
          cohort: profile.cohort ?? '',
          year_level: profile.year_level ?? '',
          bio: profile.bio ?? '',
        }
      : undefined,
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })

  async function onSaveProfile(values: ProfileFormValues) {
    if (!profile) return
    try {
      await updateProfile.mutateAsync({ id: profile.id, ...values })
      await refreshProfile()
      toast.success('Profile updated')
    } catch (e) {
      toast.error('Could not update profile', { description: (e as Error).message })
    }
  }

  async function onChangePassword(values: PasswordFormValues) {
    setPasswordSubmitting(true)
    const { error } = await updatePassword(values.password)
    setPasswordSubmitting(false)
    if (error) {
      toast.error('Could not change password', { description: error })
      return
    }
    toast.success('Password changed successfully')
    resetPasswordForm()
  }

  if (!profile) return null

  return (
    <div>
      <PageHeader title="Profile & Settings" description="Manage your account details and security." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <Badge className="capitalize">{profile.role}</Badge>
            <div className="w-full border-t pt-4 text-left text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Points</span>
                <span className="font-medium">{profile.points}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">School</span>
                <span className="font-medium">{profile.school || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Cohort</span>
                <span className="font-medium">{profile.cohort || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full name</Label>
                    <Input id="full_name" {...registerProfile('full_name')} />
                    {profileErrors.full_name && <p className="text-xs text-destructive">{profileErrors.full_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...registerProfile('phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school">School</Label>
                    <Input id="school" {...registerProfile('school')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cohort">Cohort</Label>
                    <Input id="cohort" {...registerProfile('cohort')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_level">Year level</Label>
                    <Input id="year_level" {...registerProfile('year_level')} placeholder="e.g. P4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={3} {...registerProfile('bio')} />
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Choose a new password for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input id="password" type="password" {...registerPassword('password')} />
                    {passwordErrors.password && <p className="text-xs text-destructive">{passwordErrors.password.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input id="confirmPassword" type="password" {...registerPassword('confirmPassword')} />
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={passwordSubmitting}>
                  {passwordSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
