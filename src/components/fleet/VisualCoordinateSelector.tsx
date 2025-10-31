import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, MapPin, CheckCircle } from 'lucide-react'
import { formatCoordinate } from '@/lib/coordinates'
import { Coordinate } from '@/types/game.types'

interface VisualCoordinateSelectorProps {
  onSelect: (coordinate: Coordinate) => void
  currentCoordinate?: Coordinate
}

export function VisualCoordinateSelector({
  onSelect,
  currentCoordinate,
}: VisualCoordinateSelectorProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(
    currentCoordinate?.quadrant || null
  )
  const [selectedSector, setSelectedSector] = useState<number | null>(
    currentCoordinate?.sector || null
  )
  const [selectedGalaxy, setSelectedGalaxy] = useState<number | null>(
    currentCoordinate?.galaxy || null
  )
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(
    currentCoordinate?.planet || null
  )

  // Generate options based on current selection
  const generateOptions = (max: number) => {
    return Array.from({ length: max }, (_, i) => i + 1)
  }

  const handleSelect = (level: 'quadrant' | 'sector' | 'galaxy' | 'planet', value: number) => {
    switch (level) {
      case 'quadrant':
        setSelectedQuadrant(value)
        setSelectedSector(null)
        setSelectedGalaxy(null)
        setSelectedPlanet(null)
        break
      case 'sector':
        setSelectedSector(value)
        setSelectedGalaxy(null)
        setSelectedPlanet(null)
        break
      case 'galaxy':
        setSelectedGalaxy(value)
        setSelectedPlanet(null)
        break
      case 'planet':
        setSelectedPlanet(value)
        break
    }
  }

  const handleConfirm = () => {
    if (
      selectedQuadrant !== null &&
      selectedSector !== null &&
      selectedGalaxy !== null &&
      selectedPlanet !== null
    ) {
      onSelect({
        quadrant: selectedQuadrant,
        sector: selectedSector,
        galaxy: selectedGalaxy,
        planet: selectedPlanet,
      })
    }
  }

  const isComplete =
    selectedQuadrant !== null &&
    selectedSector !== null &&
    selectedGalaxy !== null &&
    selectedPlanet !== null

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="font-semibold">Destination: </span>
        </div>
        <Badge variant={isComplete ? 'default' : 'outline'} className="text-lg font-mono px-4">
          {selectedQuadrant || '?'}:{selectedSector || '?'}:{selectedGalaxy || '?'}:
          {selectedPlanet || '?'}
        </Badge>
      </div>

      {/* Selection hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Quadrant Selection */}
        <Card className="panel-glass border-cyan/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Quadrant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {generateOptions(10).map((quad) => (
                <Button
                  key={quad}
                  variant={selectedQuadrant === quad ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelect('quadrant', quad)}
                  className="font-mono"
                >
                  {quad}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sector Selection */}
        <Card
          className={`panel-glass ${selectedQuadrant !== null ? 'border-blue/20' : 'border-muted/20 opacity-50'}`}
        >
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedQuadrant !== null ? (
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                {generateOptions(20).map((sec) => (
                  <Button
                    key={sec}
                    variant={selectedSector === sec ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelect('sector', sec)}
                    className="font-mono"
                    disabled={selectedQuadrant === null}
                  >
                    {sec}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Select Quadrant first
              </p>
            )}
          </CardContent>
        </Card>

        {/* Galaxy Selection */}
        <Card
          className={`panel-glass ${selectedSector !== null ? 'border-purple/20' : 'border-muted/20 opacity-50'}`}
        >
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Galaxy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSector !== null ? (
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                {generateOptions(20).map((gal) => (
                  <Button
                    key={gal}
                    variant={selectedGalaxy === gal ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelect('galaxy', gal)}
                    className="font-mono"
                    disabled={selectedSector === null}
                  >
                    {gal}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Select Sector first
              </p>
            )}
          </CardContent>
        </Card>

        {/* Planet Selection */}
        <Card
          className={`panel-glass ${selectedGalaxy !== null ? 'border-green/20' : 'border-muted/20 opacity-50'}`}
        >
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Planet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedGalaxy !== null ? (
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                {generateOptions(20).map((pla) => (
                  <Button
                    key={pla}
                    variant={selectedPlanet === pla ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelect('planet', pla)}
                    className="font-mono"
                    disabled={selectedGalaxy === null}
                  >
                    {pla}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Select Galaxy first
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm button */}
      <Button
        onClick={handleConfirm}
        disabled={!isComplete}
        className="w-full text-lg py-6"
        size="lg"
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        Confirm Destination
      </Button>
    </div>
  )
}

