import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Plus, X, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateAllianceCreationRequestMutation } from '@/api/endpoints/alliancesApi'
import { parseCoordinate, formatCoordinate } from '@/lib/coordinates'
import { AllianceCreationRequestCoordinate } from '@/types/api.types'

const createRequestSchema = z.object({
  name: z.string().min(3, 'Alliance name must be at least 3 characters').max(50, 'Alliance name must be less than 50 characters'),
  tag: z.string().min(2, 'Tag must be at least 2 characters').max(10, 'Tag must be less than 10 characters').regex(/^[A-Z0-9]+$/, 'Tag must contain only uppercase letters and numbers'),
})

type CreateRequestFormData = z.infer<typeof createRequestSchema>

interface CreateAllianceRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAllianceRequestDialog({ open, onOpenChange }: CreateAllianceRequestDialogProps) {
  const [coordinates, setCoordinates] = useState<Array<{ quadrant: number; sector: number; galaxy: number; planet: number } | null>>([
    null, null, null, null, null
  ])
  const [createRequest, { isLoading }] = useCreateAllianceCreationRequestMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      name: '',
      tag: '',
    }
  })

  const updateCoordinate = (index: number, value: string) => {
    const coord = parseCoordinate(value)
    setCoordinates(prev => {
      const newCoords = [...prev]
      newCoords[index] = coord
      return newCoords
    })
  }

  const removeCoordinate = (index: number) => {
    setCoordinates(prev => {
      const newCoords = [...prev]
      newCoords[index] = null
      return newCoords
    })
  }

  const onSubmit = async (data: CreateRequestFormData) => {
    const validCoordinates = coordinates.filter((coord): coord is AllianceCreationRequestCoordinate => coord !== null)
    
    if (validCoordinates.length !== 5) {
      toast.error('Please provide exactly 5 supporter coordinates')
      return
    }

    // Check for duplicates
    const coordStrings = validCoordinates.map(c => `${c.quadrant}:${c.sector}:${c.galaxy}:${c.planet}`)
    const uniqueCoords = new Set(coordStrings)
    if (uniqueCoords.size !== 5) {
      toast.error('All supporter coordinates must be unique')
      return
    }

    try {
      await createRequest({
        name: data.name,
        tag: data.tag.toUpperCase(),
        coordinates: validCoordinates,
      }).unwrap()
      toast.success('Alliance creation request submitted! Waiting for supporters...')
      reset()
      setCoordinates([null, null, null, null, null])
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit creation request')
    }
  }

  const handleClose = () => {
    reset()
    setCoordinates([null, null, null, null, null])
    onOpenChange(false)
  }

  const validCoordinatesCount = coordinates.filter(c => c !== null).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              Short identifier (uppercase letters and numbers only)
            </p>
          </div>

          {/* Supporter Coordinates */}
          <div className="space-y-4">
            <Label>Supporter Coordinates (5 required)</Label>
            <div className="space-y-3">
              {coordinates.map((coord, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Supporter ${index + 1} (e.g., 1:1:2:1)`}
                      value={coord ? formatCoordinate(coord) : ''}
                      onChange={(e) => updateCoordinate(index, e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  {coord && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCoordinate(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-medium ${validCoordinatesCount === 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                {validCoordinatesCount}/5 coordinates
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              How It Works
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Provide exactly 5 unique planet coordinates</li>
              <li>• Empires at those coordinates will be asked to support your alliance</li>
              <li>• Once all 5 approve, the alliance will be created automatically</li>
              <li>• You will become the leader, all supporters become members</li>
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
              disabled={isLoading || validCoordinatesCount !== 5}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
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

