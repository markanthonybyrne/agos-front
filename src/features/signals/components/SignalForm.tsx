import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCoordinate } from '@/lib/coordinates'
import { 
  Send, 
  MapPin, 
  Zap, 
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

const signalFormSchema = z.object({
  target_quadrant: z.number().min(1, 'Quadrant must be at least 1'),
  target_sector: z.number().min(1, 'Sector must be at least 1'),
  target_galaxy: z.number().min(1, 'Galaxy must be at least 1'),
  target_planet: z.number().min(1, 'Planet must be at least 1'),
  type: z.enum(['fleet', 'orbital_defence', 'planetary', 'all_frequency', 'events']),
})

type SignalFormData = z.infer<typeof signalFormSchema>

interface SignalFormProps {
  onLaunch: (data: { target_quadrant: number; target_sector: number; target_galaxy: number; target_planet: number; type: string }) => void | Promise<void>
  isLoading: boolean
}

const signalTypes = [
  {
    value: 'fleet',
    label: 'Fleet Detection',
    description: 'Detect enemy fleets and ship movements',
    cost: 1,
    icon: '🚀'
  },
  {
    value: 'orbital_defence',
    label: 'Orbital Defence',
    description: 'Analyze orbital defence systems',
    cost: 2,
    icon: '🛡️'
  },
  {
    value: 'planetary',
    label: 'Planetary Analysis',
    description: 'Gather intelligence on planet facilities and resources',
    cost: 3,
    icon: '🌍'
  },
  {
    value: 'all_frequency',
    label: 'All Frequency',
    description: 'Comprehensive scan of all detectable signals',
    cost: 5,
    icon: '📡'
  },
  {
    value: 'events',
    label: 'Event Detection',
    description: 'Detect recent events and activities',
    cost: 1,
    icon: '⚡'
  }
]

export function SignalForm({ onLaunch, isLoading }: SignalFormProps) {
  const [coordinateInput, setCoordinateInput] = useState('')
  const [parsedCoordinate, setParsedCoordinate] = useState<{quadrant: number, sector: number, galaxy: number, planet: number} | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SignalFormData>({
    resolver: zodResolver(signalFormSchema),
    defaultValues: {
      type: 'fleet',
      target_quadrant: 1,
      target_sector: 1,
      target_galaxy: 1,
      target_planet: 1
    }
  })

  const selectedType = watch('type')
  const selectedSignalType = signalTypes.find(t => t.value === selectedType)

  const parseCoordinate = (input: string) => {
    // Parse coordinate format: Q:S:G:P (e.g., "1:2:3:4")
    const parts = input.split(':').map(p => parseInt(p.trim()))
    if (parts.length === 4 && parts.every(p => !isNaN(p) && p > 0)) {
      return {
        quadrant: parts[0],
        sector: parts[1],
        galaxy: parts[2],
        planet: parts[3]
      }
    }
    return null
  }

  const handleCoordinateChange = (value: string) => {
    setCoordinateInput(value)
    const parsed = parseCoordinate(value)
    setParsedCoordinate(parsed)
    
    if (parsed) {
      setValue('target_quadrant', parsed.quadrant)
      setValue('target_sector', parsed.sector)
      setValue('target_galaxy', parsed.galaxy)
      setValue('target_planet', parsed.planet)
    }
  }

  const onSubmit = (data: SignalFormData) => {
    if (!parsedCoordinate) {
      toast.error('Invalid coordinate format. Use Q:S:G:P (e.g., 1:2:3:4)')
      return
    }
    onLaunch({
      target_quadrant: data.target_quadrant,
      target_sector: data.target_sector,
      target_galaxy: data.target_galaxy,
      target_planet: data.target_planet,
      type: data.type
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Target Coordinate */}
      <div className="space-y-2">
        <Label htmlFor="coordinate_input">Target Coordinate</Label>
        <div className="space-y-2">
          <Input
            id="coordinate_input"
            placeholder="Enter coordinate (e.g., 1:2:3:4)"
            value={coordinateInput}
            onChange={(e) => handleCoordinateChange(e.target.value)}
          />
          {parsedCoordinate && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <MapPin className="w-4 h-4" />
              <span>Valid coordinate: {parsedCoordinate.quadrant}:{parsedCoordinate.sector}:{parsedCoordinate.galaxy}:{parsedCoordinate.planet}</span>
            </div>
          )}
          {coordinateInput && !parsedCoordinate && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Invalid format. Use Q:S:G:P (e.g., 1:2:3:4)</span>
            </div>
          )}
        </div>
      </div>

      {/* Signal Type Selection */}
      <div className="space-y-4">
        <Label>Signal Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signalTypes.map((type) => (
            <Card
              key={type.value}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                selectedType === type.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
              onClick={() => setValue('type', type.value as any)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{type.icon}</span>
                      <h3 className="font-semibold">{type.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {type.cost} probe{type.cost > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Signal Details */}
      {selectedSignalType && (
        <Card className="panel-glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Signal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium">{selectedSignalType.label}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cost:</span>
                <span className="ml-2 font-medium">{selectedSignalType.cost} probe{selectedSignalType.cost > 1 ? 's' : ''}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Target:</span>
                <span className="ml-2 font-medium font-mono">
                  {parsedCoordinate ? `${parsedCoordinate.quadrant}:${parsedCoordinate.sector}:${parsedCoordinate.galaxy}:${parsedCoordinate.planet}` : 'Invalid coordinate'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium">1 tick</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-400 mb-1">Signal Information</p>
                <p className="text-muted-foreground">
                  {selectedSignalType.description}. The signal will be processed during the next game tick and results will be available in your signal history.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading || !parsedCoordinate}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Launching Signal...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Launch Signal
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
