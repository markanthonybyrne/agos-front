import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateAllianceMutation } from '@/api/endpoints/alliancesApi'
import { Plus, Crown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const createAllianceSchema = z.object({
  name: z.string().min(3, 'Alliance name must be at least 3 characters').max(50, 'Alliance name must be less than 50 characters'),
  tag: z.string().min(2, 'Tag must be at least 2 characters').max(10, 'Tag must be less than 10 characters').regex(/^[A-Z0-9]+$/, 'Tag must contain only uppercase letters and numbers'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

type CreateAllianceData = z.infer<typeof createAllianceSchema>

interface CreateAllianceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAllianceDialog({ open, onOpenChange }: CreateAllianceDialogProps) {
  const [createAlliance, { isLoading }] = useCreateAllianceMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateAllianceData>({
    resolver: zodResolver(createAllianceSchema),
    defaultValues: {
      name: '',
      tag: '',
      description: ''
    }
  })

  const onSubmit = async (data: CreateAllianceData) => {
    try {
      await createAlliance(data).unwrap()
      toast.success('Alliance created successfully!')
      reset()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create alliance')
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] panel-glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Create New Alliance
          </DialogTitle>
          <DialogDescription>
            Form your own alliance and invite other empires to join your cause.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Alliance Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Alliance Name</Label>
            <Input
              id="name"
              placeholder="Enter alliance name..."
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

          {/* Alliance Tag */}
          <div className="space-y-2">
            <Label htmlFor="tag">Alliance Tag</Label>
            <Input
              id="tag"
              placeholder="Enter tag (e.g., EMPIRE)"
              {...register('tag')}
              className={errors.tag ? 'border-destructive' : ''}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.tag && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-3 h-3" />
                {errors.tag.message}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Short identifier for your alliance (uppercase letters and numbers only)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your alliance's goals and values..."
              rows={4}
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-3 h-3" />
                {errors.description.message}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Optional description to help other empires understand your alliance
            </p>
          </div>

          {/* Alliance Creation Info */}
          <div className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              Alliance Creation
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You will become the leader of the alliance</li>
              <li>• You can invite other empires to join</li>
              <li>• Alliance resources will be shared among members</li>
              <li>• You can set alliance policies and permissions</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Alliance
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

