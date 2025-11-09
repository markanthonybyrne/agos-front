import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MapPin, CheckCircle } from 'lucide-react'
import { formatCoordinate, normalizeCoordinate, resolveCoordinateToXY } from '@/lib/coordinates'
import { Coordinate } from '@/types/game.types'

interface VisualCoordinateSelectorProps {
  onSelect: (coordinate: Coordinate) => void
  currentCoordinate?: Coordinate
}

export function VisualCoordinateSelector({ onSelect, currentCoordinate }: VisualCoordinateSelectorProps) {
  const [region, setRegion] = useState<string>('')
  const [system, setSystem] = useState<string>('')
  const [planet, setPlanet] = useState<string>('')
  const [rawInput, setRawInput] = useState<string>('')

  useEffect(() => {
    const normalized = normalizeCoordinate(currentCoordinate ?? null)
    if (normalized) {
      setRegion(String(normalized.region))
      setSystem(String(normalized.system))
      setPlanet(String(normalized.planet))
      setRawInput(`${normalized.region}:${normalized.system}:${normalized.planet}`)
    }
  }, [currentCoordinate])

  const parsed = useMemo(() => {
    // Prefer the structured fields, fallback to raw text entry
    const structuredRegion = Number(region)
    const structuredSystem = Number(system)
    const structuredPlanet = Number(planet)

    if (
      Number.isFinite(structuredRegion) &&
      Number.isFinite(structuredSystem) &&
      Number.isFinite(structuredPlanet) &&
      structuredRegion > 0 &&
      structuredSystem > 0 &&
      structuredPlanet > 0
    ) {
      return {
        region: structuredRegion,
        system: structuredSystem,
        planet: structuredPlanet,
      }
    }

    const normalized = normalizeCoordinate(rawInput)
    if (normalized) {
      return normalized
    }

    return null
  }, [region, system, planet, rawInput])

  const resolved = useMemo(() => {
    if (!parsed) {
      return null
    }
    return resolveCoordinateToXY(parsed)
  }, [parsed])

  const isComplete = Boolean(parsed)

  const handleApply = () => {
    if (!parsed) {
      return
    }
    onSelect({ region: parsed.region, system: parsed.system, planet: parsed.planet })
  }

  return (
    <div className="space-y-6">
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Target Coordinate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="region-input">Region</Label>
              <Input
                id="region-input"
                type="number"
                min={1}
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="system-input">System</Label>
              <Input
                id="system-input"
                type="number"
                min={1}
                value={system}
                onChange={(event) => setSystem(event.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planet-input">Planet</Label>
              <Input
                id="planet-input"
                type="number"
                min={1}
                value={planet}
                onChange={(event) => setPlanet(event.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="raw-input">Quick Entry (region:system:planet)</Label>
            <Input
              id="raw-input"
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              placeholder="1:42:3"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/15 p-3">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Current Selection</div>
              <div className="font-mono text-lg">
                {isComplete ? formatCoordinate(parsed) : '—'}
              </div>
              {resolved && (
                <div className="text-xs text-muted-foreground">
                  Approx. Position: ({resolved.x}, {resolved.y})
                </div>
              )}
            </div>
            <Badge variant={isComplete ? 'default' : 'outline'} className="flex items-center gap-1 px-3 py-1">
              <CheckCircle className={`w-4 h-4 ${isComplete ? 'text-emerald-400' : 'text-muted-foreground'}`} />
              {isComplete ? 'Ready' : 'Incomplete'}
            </Badge>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleApply} disabled={!parsed}>
              Set Destination
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
