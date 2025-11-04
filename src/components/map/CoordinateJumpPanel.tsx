import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getQuadrantXyRange,
  getSectorXyRange,
  getGalaxyXyRange,
  getSystemXyRange,
  hierarchicalToXy,
} from '@/lib/coordinateUtils'

interface CoordinateJumpPanelProps {
  onJump: (centerX: number, centerY: number, zoomLevel: number) => void
  onClose: () => void
  gridWidth: number
  gridHeight: number
}

export function CoordinateJumpPanel({
  onJump,
  onClose,
  gridWidth,
  gridHeight,
}: CoordinateJumpPanelProps) {
  const [coordinate, setCoordinate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleJump = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!coordinate.trim()) {
      setError('Please enter a coordinate')
      return
    }

    // Parse coordinate (support 1-5 parts: Q, Q:S, Q:S:G, Q:S:G:SY, Q:S:G:SY:P)
    const parts = coordinate
      .trim()
      .split(':')
      .map((p) => p.trim())
      .filter((p) => p !== '')
      .map(Number)

    if (parts.length === 0 || parts.length > 5) {
      setError('Invalid coordinate format. Use: Q, Q:S, Q:S:G, Q:S:G:SY, or Q:S:G:SY:P')
      return
    }

    // Validate all parts are numbers
    if (parts.some((p) => isNaN(p) || p <= 0)) {
      setError('All coordinate parts must be positive numbers')
      return
    }

    try {
      let centerX = 0
      let centerY = 0
      let zoomLevel = 0.05 // Default zoom

      if (parts.length === 1) {
        // Quadrant only (e.g., "2")
        const [q] = parts
        if (q < 1 || q > 4) {
          setError('Quadrant must be between 1 and 4')
          return
        }
        const range = getQuadrantXyRange(q)
        centerX = (range.x_min + range.x_max) / 2
        centerY = (range.y_min + range.y_max) / 2
        zoomLevel = 0.05 // Sector level zoom
      } else if (parts.length === 2) {
        // Quadrant:Sector (e.g., "1:2")
        const [q, s] = parts
        if (q < 1 || q > 4 || s < 1 || s > 4) {
          setError('Quadrant must be 1-4, Sector must be 1-4')
          return
        }
        const range = getSectorXyRange(q, s)
        centerX = (range.x_min + range.x_max) / 2
        centerY = (range.y_min + range.y_max) / 2
        zoomLevel = 0.1 // Galaxy level zoom
      } else if (parts.length === 3) {
        // Quadrant:Sector:Galaxy (e.g., "1:2:3")
        const [q, s, g] = parts
        if (q < 1 || q > 4 || s < 1 || s > 4 || g < 1 || g > 10) {
          setError('Quadrant: 1-4, Sector: 1-4, Galaxy: 1-10')
          return
        }
        const range = getGalaxyXyRange(q, s, g)
        centerX = (range.x_min + range.x_max) / 2
        centerY = (range.y_min + range.y_max) / 2
        zoomLevel = 0.4 // Galaxy view zoom
      } else if (parts.length === 4) {
        // Quadrant:Sector:Galaxy:System (e.g., "1:2:3:4")
        const [q, s, g, sy] = parts
        if (q < 1 || q > 4 || s < 1 || s > 4 || g < 1 || g > 10 || sy < 1 || sy > 10) {
          setError('Quadrant: 1-4, Sector: 1-4, Galaxy: 1-10, System: 1-10')
          return
        }
        const range = getSystemXyRange(q, s, g, sy)
        centerX = (range.x_min + range.x_max) / 2
        centerY = (range.y_min + range.y_max) / 2
        zoomLevel = 0.6 // System view zoom
      } else if (parts.length === 5) {
        // Quadrant:Sector:Galaxy:System:Planet (e.g., "1:2:3:4:5")
        const [q, s, g, sy, p] = parts
        if (q < 1 || q > 4 || s < 1 || s > 4 || g < 1 || g > 10 || sy < 1 || sy > 10 || p < 1 || p > 15) {
          setError('Quadrant: 1-4, Sector: 1-4, Galaxy: 1-10, System: 1-10, Planet: 1-15')
          return
        }
        // For planet level, first get the system range, then approximate planet position within it
        const systemRange = getSystemXyRange(q, s, g, sy)
        // Approximate planet position within system (planets are distributed within system bounds)
        // Use a simple hash-like distribution
        const planetOffsetX = ((p - 1) % 5) * ((systemRange.x_max - systemRange.x_min) / 5)
        const planetOffsetY = Math.floor((p - 1) / 5) * ((systemRange.y_max - systemRange.y_min) / 5)
        centerX = systemRange.x_min + planetOffsetX + (systemRange.x_max - systemRange.x_min) / 10
        centerY = systemRange.y_min + planetOffsetY + (systemRange.y_max - systemRange.y_min) / 10
        zoomLevel = 3.0 // High zoom for planet detail
      }

      // Jump to the location
      onJump(centerX, centerY, zoomLevel)
      setCoordinate('')
    } catch (err) {
      setError('Failed to calculate jump location')
      console.error('Jump error:', err)
    }
  }

  return (
    <Card className="panel-glass border-cyan/20 angled-corners shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading glow-cyan flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Jump to Coordinates
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJump} className="space-y-3">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="e.g., 2, 1:2, 1:2:3, 1:2:3:4, 1:2:3:4:5"
              value={coordinate}
              onChange={(e) => {
                setCoordinate(e.target.value)
                setError(null)
              }}
              className="font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Enter 1-5 coordinate parts (Q, Q:S, Q:S:G, Q:S:G:SY, Q:S:G:SY:P)
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 angled-corners">
              Jump
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="angled-corners"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

