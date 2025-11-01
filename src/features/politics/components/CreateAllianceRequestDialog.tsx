import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Crown } from 'lucide-react'
import { CreateAllianceRequestForm } from './CreateAllianceRequestForm'

interface CreateAllianceRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAllianceRequestDialog({ open, onOpenChange }: CreateAllianceRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto panel-glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Submit Alliance Creation Request
          </DialogTitle>
          <DialogDescription>
            Create an alliance by getting 5 supporters. Enter 5 planet coordinates where supporters can be found.
          </DialogDescription>
        </DialogHeader>

        <CreateAllianceRequestForm onSuccess={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
