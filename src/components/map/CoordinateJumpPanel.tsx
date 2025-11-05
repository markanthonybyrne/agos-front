import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveCoordinate } from '@/lib/coordinateResolver'
import { Planet } from '@/types/api.types'

interface CoordinateJumpPanelProps {
  onJump: (centerX: number, centerY: number, normalizedZoom: number) => void
  onClose: () => void
  gridWidth: number
  gridHeight: number
  planets?: Planet[]
}

export function CoordinateJumpPanel({
  onJump,
  onClose,
  gridWidth,
  gridHeight,
  planets,
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

    try {
      // Use coordinate resolver for clean, maintainable code
      // Pass planets to look up actual planet coordinates if available
      const resolution = resolveCoordinate(coordinate, planets)
      
      // Trigger smooth transition with normalized zoom
      onJump(resolution.centerX, resolution.centerY, resolution.normalizedZoom)
      setCoordinate('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate jump location'
      setError(errorMessage)
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

