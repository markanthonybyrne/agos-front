import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { regionSystemToXy, xyToRegionSystem } from '@/lib/coordinateUtils'
import { normalizeCoordinate, resolveCoordinateToXY, formatCoordinate } from '@/lib/coordinates'
import { useAuth } from '@/hooks/useAuth'
import { 
  Send, 
  MapPin, 
  Zap, 
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

const signalFormSchema = z.object({
  type: z.enum(['fleet', 'orbital_defence', 'planetary', 'all_frequency', 'events']),
})

type SignalFormData = z.infer<typeof signalFormSchema>

type SignalType = 'fleet' | 'orbital_defence' | 'planetary' | 'all_frequency' | 'events'

interface InitialTarget {
  coordinate?: string
  x?: number
  y?: number
  region?: number
  system?: number
  planet?: number
  quadrant?: number
  sector?: number
  galaxy?: number
  type?: SignalType
}

interface SignalFormProps {
  onLaunch: (data: {
    origin_planet_id: number
    target_region: number
    target_system: number
    target_planet: number
    target_x: number
    target_y: number
    type: string
  }) => void | Promise<void>
  isLoading: boolean
  initialTarget?: InitialTarget
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

type ParsedCoordinate = {
  region: number
  system: number
  planet: number
  x: number
  y: number
}

export function SignalForm({ onLaunch, isLoading, initialTarget }: SignalFormProps) {
  const { empire } = useAuth()
  const [coordinateInput, setCoordinateInput] = useState(() => {
    if (typeof initialTarget?.x === 'number' && typeof initialTarget?.y === 'number') {
      return `X:${initialTarget.x}:${initialTarget.y}`
    }
    return initialTarget?.coordinate ?? ''
  })
  const [parsedCoordinate, setParsedCoordinate] = useState<ParsedCoordinate | null>(null)

  const {
    handleSubmit,
    setValue,
    watch,
  } = useForm<SignalFormData>({
    resolver: zodResolver(signalFormSchema),
  })

  const selectedType = watch('type')
  const selectedSignalType = signalTypes.find(t => t.value === selectedType)

  const parseCoordinate = useCallback((input: string): ParsedCoordinate | null => {
    const trimmed = input.trim()
    if (!trimmed) {
      return null
    }

    // Accept explicit X:Y inputs (optionally prefixed with X:)
    const xyMatch = trimmed.match(/^X\s*:\s*(\d{1,4})\s*:\s*(\d{1,4})$/i) || trimmed.match(/^(\d{1,4})\s*:\s*(\d{1,4})$/)
    if (xyMatch) {
      const x = Number(xyMatch[1])
      const y = Number(xyMatch[2])
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
      if (x < 0 || x > 2000 || y < 0 || y > 1000) return null
      const hierarchical = xyToRegionSystem(x, y)
      return {
        x,
        y,
        region: hierarchical.region,
        system: hierarchical.system,
        planet: hierarchical.planet,
      }
    }

    // Normalise Region:System:Planet strings (and legacy formats) via helper
    const normalized = normalizeCoordinate(trimmed)
    if (normalized) {
      const resolved = resolveCoordinateToXY(normalized)
      if (resolved) {
        return {
          region: normalized.region,
          system: normalized.system,
          planet: normalized.planet,
          x: resolved.x,
          y: resolved.y,
        }
      }
    }

    return null
  }, [])

  const handleCoordinateChange = useCallback((value: string) => {
    setCoordinateInput(value)
    const parsed = parseCoordinate(value)
    setParsedCoordinate(parsed)
  }, [parseCoordinate])

  const onSubmit = (data: SignalFormData) => {
    if (!parsedCoordinate) {
      toast.error('Invalid coordinate format. Use X:123:456')
      return
    }
    if (!empire?.homeworld_planet_id) {
      toast.error('Unable to determine origin planet. Please ensure you are logged in.')
      return
    }

    onLaunch({
      origin_planet_id: empire.homeworld_planet_id,
      target_region: parsedCoordinate.region,
      target_system: parsedCoordinate.system,
      target_planet: parsedCoordinate.planet,
      target_x: parsedCoordinate.x,
      target_y: parsedCoordinate.y,
      type: data.type
    })
  }

  useEffect(() => {
    if (!initialTarget) return

    if (initialTarget.type) {
      setValue('type', initialTarget.type)
    }

    if (typeof initialTarget.x === 'number' && typeof initialTarget.y === 'number') {
      const formatted = `X:${initialTarget.x}:${initialTarget.y}`
      handleCoordinateChange(formatted)
      return
    }

    if (
      typeof initialTarget.region === 'number' &&
      typeof initialTarget.system === 'number' &&
      typeof initialTarget.planet === 'number'
    ) {
      handleCoordinateChange(`${initialTarget.region}:${initialTarget.system}:${initialTarget.planet}`)
      return
    }

    if (
      initialTarget.quadrant &&
      initialTarget.sector &&
      initialTarget.galaxy &&
      initialTarget.planet
    ) {
      const legacyCoordinate = initialTarget.system
        ? `${initialTarget.quadrant}:${initialTarget.sector}:${initialTarget.galaxy}:${initialTarget.system}:${initialTarget.planet}`
        : `${initialTarget.quadrant}:${initialTarget.sector}:${initialTarget.galaxy}:${initialTarget.planet}`
      handleCoordinateChange(legacyCoordinate)
    }
  }, [handleCoordinateChange, initialTarget, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Target Coordinate */}
      <div className="space-y-2">
        <Label htmlFor="coordinate_input">Target Coordinate</Label>
        <div className="space-y-2">
          <Input
            id="coordinate_input"
            placeholder="Enter coordinate (e.g., X:250:375)"
            value={coordinateInput}
            onChange={(e) => handleCoordinateChange(e.target.value)}
          />
          {parsedCoordinate && (
            <div className="flex flex-col gap-1 text-sm text-green-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Region:System:Planet — {formatCoordinate(parsedCoordinate)}</span>
              </div>
              <div className="ml-6 text-xs text-green-200">
                Approx. Position: X:{parsedCoordinate.x} Y:{parsedCoordinate.y}
              </div>
            </div>
          )}
          {coordinateInput && !parsedCoordinate && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Invalid format. Use X:123:456 or Region:System:Planet (e.g. 1:42:3)</span>
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
                  {parsedCoordinate ? `${parsedCoordinate.region}:${parsedCoordinate.system}:${parsedCoordinate.planet}` : 'Invalid coordinate'}
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
