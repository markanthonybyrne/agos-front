import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  empire_name: z.string().min(3, 'Empire name must be at least 3 characters').max(100, 'Empire name must be less than 100 characters'),
  empire_description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

type ProfileData = z.infer<typeof profileSchema>

interface ProfileSettingsProps {
  user: any
  empire: any
  onUpdate: (data: any) => Promise<any>
  isLoading: boolean
}

export function ProfileSettings({ user, empire, onUpdate, isLoading }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      empire_name: empire?.name || '',
      empire_description: empire?.description || ''
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: ProfileData) => {
    try {
      const result = await onUpdate(data)
      if (result && typeof result === 'object' && 'unwrap' in result) {
        await result.unwrap()
      }
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  const hasChanges = Object.keys(watchedValues).some(key => 
    watchedValues[key as keyof ProfileData] !== (key.includes('empire') ? empire?.[key.replace('empire_', '')] : user?.[key])
  )

  return (
    <div className="space-y-6">
      {/* User Profile */}
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            User Profile
          </CardTitle>
          <CardDescription>
            Update your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...register('username')}
                  disabled={!isEditing}
                  className={errors.username ? 'border-destructive' : ''}
                />
                {errors.username && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {errors.username.message}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled={!isEditing}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </div>
                )}
              </div>
            </div>

            {/* Empire Name */}
            <div className="space-y-2">
              <Label htmlFor="empire_name">Empire Name</Label>
              <Input
                id="empire_name"
                {...register('empire_name')}
                disabled={!isEditing}
                className={errors.empire_name ? 'border-destructive' : ''}
              />
              {errors.empire_name && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.empire_name.message}
                </div>
              )}
            </div>

            {/* Empire Description */}
            <div className="space-y-2">
              <Label htmlFor="empire_description">Empire Description</Label>
              <Textarea
                id="empire_description"
                rows={4}
                placeholder="Describe your empire's goals and values..."
                {...register('empire_description')}
                disabled={!isEditing}
                className={errors.empire_description ? 'border-destructive' : ''}
              />
              {errors.empire_description && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.empire_description.message}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Optional description to help other players understand your empire
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {!isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !hasChanges}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>
            Your account activity and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Joined</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {empire?.planets?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Planets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {empire?.score || 0}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {empire?.alliance?.name || 'Independent'}
              </div>
              <div className="text-sm text-muted-foreground">Alliance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

