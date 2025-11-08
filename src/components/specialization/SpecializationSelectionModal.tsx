import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Lock } from 'lucide-react'
import { useSelectSpecializationMutation } from '@/api/endpoints/empiresApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { toast } from 'sonner'
import { SpecializationBadge } from './SpecializationBadge'

interface SpecializationSelectionModalProps {
  open: boolean
  onClose: () => void
  availableSpecializations: Array<'industrial' | 'military' | 'relic'>
}

const specializationDescriptions: Record<string, string> = {
  industrial: 'Focus on production, efficiency, and resource generation. Unlocks advanced manufacturing and automation technologies.',
  military: 'Focus on combat, fleet operations, and defensive capabilities. Unlocks advanced weapons and strategic technologies.',
  relic: 'Focus on ancient technologies, exploration, and unique abilities. Unlocks rare and powerful technologies.',
}

export function SpecializationSelectionModal({
  open,
  onClose,
  availableSpecializations,
}: SpecializationSelectionModalProps) {
  const [selectedSpecializations, setSelectedSpecializations] = useState<Set<'industrial' | 'military' | 'relic'>>(new Set())
  const [selectSpecialization, { isLoading }] = useSelectSpecializationMutation()
  const { data: meData } = useGetMeQuery()
  const unlocked = meData?.empire?.specializations_unlocked || []

  const handleToggleSpecialization = (spec: 'industrial' | 'military' | 'relic') => {
    const newSet = new Set(selectedSpecializations)
    if (newSet.has(spec)) {
      newSet.delete(spec)
    } else {
      newSet.add(spec)
    }
    setSelectedSpecializations(newSet)
  }

  const handleConfirm = async () => {
    if (selectedSpecializations.size === 0) {
      toast.error('Please select at least one specialization')
      return
    }

    try {
      // Option B: Can unlock multiple specializations
      for (const spec of selectedSpecializations) {
        await selectSpecialization({ specialization: spec }).unwrap()
      }
      toast.success(`Specialization${selectedSpecializations.size > 1 ? 's' : ''} unlocked successfully!`)
      onClose()
      setSelectedSpecializations(new Set())
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to unlock specialization')
    }
  }

  const allSpecializations: Array<'industrial' | 'military' | 'relic'> = ['industrial', 'military', 'relic']

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="panel-glass surface-gradient card-glow border-purple/30 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Your Specialization</DialogTitle>
          <DialogDescription>
            At Era 3, you can unlock specializations that unlock new technology paths. You can select one or more specializations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {allSpecializations.map((spec) => {
            const isUnlocked = unlocked.includes(spec)
            const isSelected = selectedSpecializations.has(spec)
            const isAvailable = availableSpecializations.includes(spec) || isUnlocked

            return (
              <Card
                key={spec}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-purple-400 bg-purple/10'
                    : isUnlocked
                    ? 'border-green/20 bg-green/5'
                    : 'border-muted/20'
                } ${!isAvailable ? 'opacity-50' : ''}`}
                onClick={() => isAvailable && !isUnlocked && handleToggleSpecialization(spec)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <SpecializationBadge specialization={spec} />
                        {isUnlocked && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Unlocked
                          </Badge>
                        )}
                        {isSelected && !isUnlocked && (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {specializationDescriptions[spec]}
                      </p>
                    </div>
                    {!isAvailable && (
                      <Lock className="w-5 h-5 text-muted-foreground mt-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || selectedSpecializations.size === 0}
          >
            {isLoading ? 'Unlocking...' : `Unlock Specialization${selectedSpecializations.size > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

