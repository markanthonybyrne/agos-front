import { useState } from 'react'
import { ChevronRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'

interface NavigationBreadcrumbsProps {
  quadrant?: number
  sector?: number
  galaxy?: number
  onNavigate: (level: 'quadrant' | 'sector' | 'galaxy' | 'planet', data?: any) => void
  onCoordinateJump: (coordinate: string) => void
}

export function NavigationBreadcrumbs({
  quadrant,
  sector,
  galaxy,
  onNavigate,
  onCoordinateJump,
}: NavigationBreadcrumbsProps) {
  const [coordinateInput, setCoordinateInput] = useState('')

  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const coord = parseCoordinate(coordinateInput.trim())
    if (coord) {
      onCoordinateJump(formatCoordinate(coord))
    }
  }

  type BreadcrumbPart = { label: string; level: 'quadrant' | 'sector' | 'galaxy' | 'planet'; data?: { id: number } }
  
  const breadcrumbParts: BreadcrumbPart[] = [
    { label: 'Universe', level: 'quadrant' },
    quadrant && { label: `Quadrant ${quadrant}`, level: 'sector', data: { id: quadrant } },
    sector && { label: `Sector ${sector}`, level: 'galaxy', data: { id: sector } },
    galaxy && { label: `Galaxy ${galaxy}`, level: 'planet', data: { id: galaxy } },
  ].filter((part): part is BreadcrumbPart => Boolean(part))

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {breadcrumbParts.map((part, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <Button
            variant={index === breadcrumbParts.length - 1 ? 'default' : 'ghost'}
            size="sm"
            onClick={() => part && onNavigate(part.level, part.data)}
            className="h-auto py-1 px-2"
          >
            {part.label}
          </Button>
        </div>
      ))}
      
      <div className="flex items-center gap-2 ml-auto">
        <form onSubmit={handleCoordinateSubmit} className="flex gap-2">
          <Input
            placeholder="1:1:1:1"
            value={coordinateInput}
            onChange={(e) => setCoordinateInput(e.target.value)}
            className="w-32 h-8 text-sm font-mono"
          />
          <Button type="submit" size="sm" variant="outline">
            <MapPin className="w-3 h-3 mr-1" />
            Jump
          </Button>
        </form>
      </div>
    </div>
  )
}

