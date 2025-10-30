import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, Send, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateJoinRequestMutation } from '@/api/endpoints/alliancesApi'

const joinRequestSchema = z.object({
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
})

type JoinRequestFormData = z.infer<typeof joinRequestSchema>

interface JoinRequestFormProps {
  allianceId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function JoinRequestForm({ allianceId, open, onOpenChange, onSuccess }: JoinRequestFormProps) {
  const [createRequest, { isLoading }] = useCreateJoinRequestMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<JoinRequestFormData>({
    resolver: zodResolver(joinRequestSchema),
    defaultValues: {
      message: '',
    }
  })

  const message = watch('message')
  const messageLength = message?.length || 0
  const maxLength = 2000

  const onSubmit = async (data: JoinRequestFormData) => {
    try {
      await createRequest({
        allianceId,
        data: { message: data.message }
      }).unwrap()
      toast.success('Join request submitted successfully!')
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to submit join request'
      if (errorMessage.includes('cooldown')) {
        toast.error('You can only submit one request per alliance every 24 hours')
      } else {
        toast.error(errorMessage)
      }
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
            <Send className="w-5 h-5 text-blue-400" />
            Submit Join Request
          </DialogTitle>
          <DialogDescription>
            Write a message explaining why you want to join this alliance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Tell us about yourself, your experience, and why you want to join..."
              rows={6}
              {...register('message')}
              className={errors.message ? 'border-destructive' : ''}
            />
            <div className="flex items-center justify-between text-xs">
              {errors.message ? (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {errors.message.message}
                </div>
              ) : (
                <div />
              )}
              <span className={`text-muted-foreground ${messageLength > maxLength * 0.9 ? 'text-yellow-400' : ''}`}>
                {messageLength}/{maxLength}
              </span>
            </div>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-yellow-400 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-yellow-400 mb-1">24-Hour Cooldown</p>
                <p>You can only submit one join request per alliance every 24 hours.</p>
              </div>
            </div>
          </div>

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
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

