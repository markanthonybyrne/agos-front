import { Planet } from '@/types/api.types'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Circle, Home, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface PlanetGridProps {
  planets: Planet[]
  isLoading?: boolean
  onPlanetClick: (planet: Planet) => void
  selectedPlanetId?: number
}

export function PlanetGrid({ planets, isLoading, onPlanetClick, selectedPlanetId }: PlanetGridProps) {
  const { empire } = useAuth()

  // Create a dynamic grid that shows all planets
  // Calculate grid size based on the highest planet number found
  const planetNumbers = planets.map(p => {
    const coord = parseCoordinate(p.coordinate)
    return coord?.planet || 0
  }).filter(n => n > 0)
  
  const maxPlanetNumber = planetNumbers.length > 0 
    ? Math.max(...planetNumbers)
    : 10 // Default to 10 if no valid planet numbers
  
  const gridCols = 5
  const gridRows = Math.ceil(maxPlanetNumber / gridCols)
  const grid: (Planet | null)[][] = Array(gridRows).fill(null).map(() => Array(gridCols).fill(null))

  // Populate grid with planets based on planet number
  planets.forEach((planet) => {
    const coord = parseCoordinate(planet.coordinate)
    if (coord && coord.planet >= 1) {
      const planetIndex = coord.planet - 1 // 0-based index
      const row = Math.floor(planetIndex / gridCols)
      const col = planetIndex % gridCols
      if (row < gridRows && col < gridCols) {
        grid[row][col] = planet
      }
    }
  })

  const getPlanetStatusColor = (planet: Planet) => {
    if (planet.owner_empire_id === empire?.id) {
      return planet.state === 'homeworld' ? 'text-green-400' : 'text-blue-400'
    }
    if (planet.owner_empire_id) {
      return 'text-red-400'
    }
    return 'text-muted-foreground'
  }

  const getPlanetStatusBadge = (planet: Planet) => {
    if (planet.owner_empire_id === empire?.id) {
      return planet.state === 'homeworld' ? (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <Home className="w-3 h-3 mr-1" />
          Homeworld
        </Badge>
      ) : (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Colony</Badge>
      )
    }
    if (planet.owner_empire_id) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Occupied
        </Badge>
      )
    }
    return <Badge variant="outline">Unsettled</Badge>
  }

  const getPlanetThumbnail = (planet: Planet) => {
    if (planet.type?.slug) {
      return `/assets/images/${planet.type.slug}.jpg`
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: Math.max(planets.length, 10) }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {grid.map((row, rowIndex) =>
        row.map((planet, colIndex) => {
          const gridKey = `${rowIndex}-${colIndex}`
          const planetNumber = rowIndex * gridCols + colIndex + 1
          
          if (!planet) {
            return (
              <div
                key={gridKey}
                className="aspect-square rounded-lg border border-muted/20 bg-muted/5 flex items-center justify-center"
              >
                <span className="text-xs text-muted-foreground">
                  {planetNumber}
                </span>
              </div>
            )
          }

          const coord = parseCoordinate(planet.coordinate)
          const isSelected = planet.id === selectedPlanetId
          const isOwned = planet.owner_empire_id === empire?.id
          const isDiscovered = planet.discovered !== false // Default to true if not specified
          const isVisible = planet.visibility?.is_visible !== false

          return (
            <Card
              key={planet.id}
              className={cn(
                "aspect-square cursor-pointer transition-all hover:scale-105 hover:border-cyan/60",
                isSelected && 'border-cyan-400 ring-2 ring-cyan-400/50',
                !isSelected && 'border-muted/20',
                isOwned ? 'bg-green-500/5' : planet.owner_empire_id ? 'bg-red-500/5' : 'bg-muted/5',
                !isDiscovered && "opacity-50 grayscale",
                !isVisible && "border-dashed"
              )}
              onClick={() => onPlanetClick(planet)}
            >
              <div className="h-full p-2 flex flex-col items-center justify-center relative overflow-hidden">
                {getPlanetThumbnail(planet) && (
                  <img
                    src={getPlanetThumbnail(planet)!}
                    alt={planet.type?.name || 'Planet'}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-1 w-full">
                  <Circle className={`w-6 h-6 ${getPlanetStatusColor(planet)}`} />
                  <span className="text-xs font-semibold text-center truncate w-full">
                    {planet.name || `P${coord?.planet || ''}`}
                  </span>
                  <div className="scale-75">
                    {getPlanetStatusBadge(planet)}
                  </div>
                  {!isDiscovered && (
                    <span className="text-xs text-muted-foreground mt-1">Undiscovered</span>
                  )}
                </div>
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}

