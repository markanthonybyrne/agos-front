import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useCreateAllianceGroupMutation, useUpdateAllianceGroupMutation } from '@/api/endpoints/alliancesApi'
import { AllianceGroup, AllianceMember, AlliancePermissions } from '@/types/api.types'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
})

type GroupFormData = z.infer<typeof groupSchema>

interface GroupFormProps {
  allianceId: number
  members: AllianceMember[]
  group?: AllianceGroup
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupForm({ allianceId, members, group, open, onOpenChange }: GroupFormProps) {
  const [selectedMembers, setSelectedMembers] = useState<number[]>(
    group?.members.map(m => m.id) || []
  )
  const [permissions, setPermissions] = useState<AlliancePermissions>(
    group?.permissions || {
      manage_fund: false,
      recruit_members: false,
      kick_members: false,
      manage_groups: false,
      edit_global_options: false,
      view_join_requests: false,
      view_status: false,
    }
  )

  const [createGroup] = useCreateAllianceGroupMutation()
  const [updateGroup] = useUpdateAllianceGroupMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || '',
    }
  })

  const toggleMember = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const togglePermission = (key: keyof AlliancePermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const onSubmit = async (data: GroupFormData) => {
    try {
      if (group) {
        await updateGroup({
          allianceId,
          groupId: group.id,
          data: {
            name: data.name,
            members: selectedMembers,
            permissions
          }
        }).unwrap()
        toast.success('Group updated successfully')
      } else {
        await createGroup({
          allianceId,
          data: {
            name: data.name,
            members: selectedMembers,
            permissions
          }
        }).unwrap()
        toast.success('Group created successfully')
      }
      reset()
      setSelectedMembers([])
      setPermissions({
        manage_fund: false,
        recruit_members: false,
        kick_members: false,
        manage_groups: false,
        edit_global_options: false,
        view_join_requests: false,
        view_status: false,
      })
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save group')
    }
  }

  const handleClose = () => {
    reset()
    setSelectedMembers(group?.members.map(m => m.id) || [])
    setPermissions(group?.permissions || {
      manage_fund: false,
      recruit_members: false,
      kick_members: false,
      manage_groups: false,
      edit_global_options: false,
      view_join_requests: false,
      view_status: false,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto panel-glass">
        <DialogHeader>
          <DialogTitle>{group ? 'Edit Group' : 'Create Group'}</DialogTitle>
          <DialogDescription>
            {group ? 'Update group members and permissions' : 'Create a new permission group'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Recruitment Minister"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-3 h-3" />
                {errors.name.message}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="space-y-2">
            <Label>Members</Label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 p-2 hover:bg-muted/20 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="space-y-3 border rounded-lg p-4">
              {Object.entries(permissions).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm cursor-pointer">
                    {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={() => togglePermission(key as keyof AlliancePermissions)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {group ? 'Update Group' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

