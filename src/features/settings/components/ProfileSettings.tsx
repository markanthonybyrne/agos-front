import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Save, AlertCircle, Upload, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/common/Avatar'
import { getUserAvatarUrl } from '@/lib/avatar'
import {
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useUpdateEmpireDescriptionMutation,
  useGetMeQuery,
} from '@/api/endpoints/authApi'

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  empire_name: z.string().min(3, 'Empire name must be at least 3 characters').max(100, 'Empire name must be less than 100 characters'),
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { data: meData, refetch: refetchMe } = useGetMeQuery()
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation()
  const [deleteAvatar, { isLoading: isDeletingAvatar }] = useDeleteAvatarMutation()
  const [updateEmpireDescription] = useUpdateEmpireDescriptionMutation()

  const currentUser = meData?.user || user
  const currentEmpire = meData?.empire || empire
  
  const [empireDescription, setEmpireDescription] = useState('')
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false)

  // Update empire description state when data changes
  useEffect(() => {
    if (currentEmpire?.description !== undefined) {
      setEmpireDescription(currentEmpire.description || '')
    }
  }, [currentEmpire?.description])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      empire_name: currentEmpire?.name || '',
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: ProfileData) => {
    try {
      // Update profile fields (empire_description is handled separately)
      const result = await onUpdate(data)
      if (result && typeof result === 'object' && 'unwrap' in result) {
        await result.unwrap()
      }
      
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      refetchMe()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update profile')
    }
  }

  const handleEmpireDescriptionSave = async () => {
    if (empireDescription === currentEmpire?.description) {
      return
    }
    
    setIsUpdatingDescription(true)
    try {
      await updateEmpireDescription({ description: empireDescription }).unwrap()
      toast.success('Empire description updated successfully!')
      refetchMe()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update empire description')
    } finally {
      setIsUpdatingDescription(false)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
    setAvatarPreview(null)
  }

  const hasChanges = Object.keys(watchedValues).some(key => 
    watchedValues[key as keyof ProfileData] !== (key.includes('empire') ? currentEmpire?.[key.replace('empire_', '')] : currentUser?.[key])
  )

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar file must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload avatar
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      await uploadAvatar(formData).unwrap()
      toast.success('Avatar uploaded successfully!')
      refetchMe()
      setAvatarPreview(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload avatar')
      setAvatarPreview(null)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to delete your avatar?')) {
      return
    }

    try {
      await deleteAvatar().unwrap()
      toast.success('Avatar deleted successfully!')
      refetchMe()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete avatar')
    }
  }

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
          {/* Avatar Section */}
          <div className="mb-6 pb-6 border-b border-border">
            <Label className="text-sm font-medium mb-3 block">Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar
                src={avatarPreview ? null : getUserAvatarUrl(currentUser)}
                name={currentUser?.username}
                size="lg"
                className="border-2 border-primary/30"
              />
              {avatarPreview && (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingAvatar}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                      </span>
                    </Button>
                  </label>
                  {(currentUser?.avatar_url || currentUser?.avatar_path) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isDeletingAvatar}
                      onClick={handleDeleteAvatar}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeletingAvatar ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF or WebP. Max 2MB.
                </p>
              </div>
            </div>
          </div>

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

            {/* Empire Description - Always editable */}
            <div className="space-y-2">
              <Label htmlFor="empire_description">Empire Description</Label>
              <Textarea
                id="empire_description"
                rows={4}
                placeholder="Describe your empire's goals and values..."
                value={empireDescription}
                onChange={(e) => setEmpireDescription(e.target.value)}
                className="min-h-[100px]"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Optional description to help other players understand your empire
                </p>
                <p className="text-xs text-muted-foreground">
                  {empireDescription.length}/500
                </p>
              </div>
              {empireDescription !== currentEmpire?.description && (
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmpireDescription(currentEmpire?.description || '')
                    }}
                    disabled={isUpdatingDescription}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleEmpireDescriptionSave}
                    disabled={isUpdatingDescription}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isUpdatingDescription ? (
                      <>
                        <div className="w-3 h-3 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-2" />
                        Save Description
                      </>
                    )}
                  </Button>
                </div>
              )}
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
                    disabled={isLoading || isUpdatingDescription || !hasChanges}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {(isLoading || isUpdatingDescription) ? (
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
    </div>
  )
}

