import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ZoomIn, ZoomOut, RotateCcw, Home, Maximize2 } from 'lucide-react'

interface ZoomControlsProps {
  scale: number
  minScale: number
  maxScale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onZoomToQuadrant?: (quadrant: number) => void
  className?: string
}

/**
 * ZoomControls - UI controls for zoom and pan operations
 */
export function ZoomControls({
  scale,
  minScale,
  maxScale,
  onZoomIn,
  onZoomOut,
  onReset,
  onZoomToQuadrant,
  className = ''
}: ZoomControlsProps) {
  const zoomPercent = Math.round(scale * 100)

  return (
    <Card className={`panel-glass border-cyan/20 p-2 ${className}`}>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomIn}
          disabled={scale >= maxScale}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomOut}
          disabled={scale <= minScale}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {onZoomToQuadrant && (
          <>
            <div className="border-t border-border/50 my-1" />
            {[1, 2, 3, 4].map(q => (
              <Button
                key={q}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => onZoomToQuadrant(q)}
                title={`Go to Quadrant ${q}`}
              >
                {q}
              </Button>
            ))}
          </>
        )}

        <div className="border-t border-border/50 mt-1 pt-2">
          <div className="text-xs text-center text-muted-foreground font-mono">
            {zoomPercent}%
          </div>
        </div>
      </div>
    </Card>
  )
}

