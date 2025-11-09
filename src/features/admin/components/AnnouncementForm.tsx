import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateAnnouncementMutation, useUpdateAnnouncementMutation } from '@/api/endpoints/adminApi'
import { Announcement } from '@/types/api.types'
import { toast } from 'sonner'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['info', 'warning', 'alert', 'success']),
  is_pinned: z.boolean().default(false),
  is_active: z.boolean().default(true),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

interface AnnouncementFormProps {
  announcement?: Announcement
  onSuccess: () => void
  onCancel: () => void
}

export function AnnouncementForm({ announcement, onSuccess, onCancel }: AnnouncementFormProps) {
  const isEditing = !!announcement

  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation()
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation()

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: isEditing
      ? {
          title: announcement.title,
          message: announcement.message ?? announcement.content ?? announcement.body ?? '',
          priority: (['info', 'warning', 'alert', 'success'] as const).includes(
            (announcement.priority ?? '') as AnnouncementFormData['priority'],
          )
            ? (announcement.priority as AnnouncementFormData['priority'])
            : 'info',
          is_pinned: announcement.is_pinned ?? false,
          is_active: announcement.is_active ?? true,
          starts_at: announcement.starts_at ?? '',
          expires_at: announcement.expires_at ?? '',
        }
      : {
          title: '',
          message: '',
          priority: 'info',
          is_pinned: false,
          is_active: true,
          starts_at: '',
          expires_at: '',
        },
  })

  const handleSubmit = async (data: AnnouncementFormData) => {
    try {
      if (isEditing) {
        await updateAnnouncement({
          id: announcement.id,
          data: {
            ...data,
            starts_at: data.starts_at || undefined,
            expires_at: data.expires_at || undefined,
          },
        }).unwrap()
      } else {
        await createAnnouncement({
          ...data,
          starts_at: data.starts_at || undefined,
          expires_at: data.expires_at || undefined,
        }).unwrap()
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} announcement`)
    }
  }

  const isLoading = isCreating || isUpdating

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Enter announcement title..."
          {...form.register('title')}
          disabled={isLoading}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          placeholder="Enter announcement message..."
          rows={6}
          {...form.register('message')}
          disabled={isLoading}
        />
        {form.formState.errors.message && (
          <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority *</Label>
        <Select
          value={form.watch('priority')}
          onValueChange={(value) => form.setValue('priority', value as AnnouncementFormData['priority'])}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="alert">Alert</SelectItem>
            <SelectItem value="success">Success</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.priority && (
          <p className="text-sm text-destructive">{form.formState.errors.priority.message}</p>
        )}
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_pinned"
            {...form.register('is_pinned')}
            className="w-4 h-4"
            disabled={isLoading}
          />
          <Label htmlFor="is_pinned" className="cursor-pointer">Pin to top</Label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            {...form.register('is_active')}
            className="w-4 h-4"
            disabled={isLoading}
          />
          <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="starts_at">Start Date/Time (Optional)</Label>
        <Input
          id="starts_at"
          type="datetime-local"
          {...form.register('starts_at')}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">Leave empty to start immediately</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expires_at">Expiration Date/Time (Optional)</Label>
        <Input
          id="expires_at"
          type="datetime-local"
          {...form.register('expires_at')}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  )
}

