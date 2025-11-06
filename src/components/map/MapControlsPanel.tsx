import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Navigation, Search, Home, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CoordinateSearchBar } from './CoordinateSearchBar'
import { CoordinateJumpPanel } from './CoordinateJumpPanel'
import { Planet } from '@/types/api.types'

interface MapControlsPanelProps {
  zoomPan: {
    scale: number
    zoomIn: () => void
    zoomOut: () => void
    reset: () => void
  }
  zoomLevel: string
  allPlanets: Planet[]
  onSearch: (centerX: number, centerY: number, normalizedZoom: number) => void
  gridWidth: number
  gridHeight: number
  systemsCount: number
  minScale?: number
  maxScale?: number
  onNavigateToCore?: () => void
  showSpiralGuidelines?: boolean
  onToggleSpiralGuidelines?: (show: boolean) => void
}

export function MapControlsPanel({
  zoomPan,
  zoomLevel,
  allPlanets,
  onSearch,
  gridWidth,
  gridHeight,
  systemsCount,
  minScale = 0.09,
  maxScale = 1.554,
  onNavigateToCore,
  showSpiralGuidelines = false,
  onToggleSpiralGuidelines,
}: MapControlsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showJumpPanel, setShowJumpPanel] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const panelContent = (
    <>
      {/* Pull-out Tab - appears when panel is collapsed, always visible on right edge */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'fixed z-50',
            'w-12 h-32',
            'panel-glass border-l-2 border-primary/50 backdrop-blur-md',
            'flex items-center justify-center',
            'transition-all duration-300',
            'hover:bg-primary/20 hover:border-primary/70 hover:scale-105',
            'shadow-lg shadow-primary/30',
            'pointer-events-auto',
            'group'
          )}
          style={{
            position: 'fixed',
            right: 0,
            top: '50%',
            left: 'auto',
            transform: 'translateY(-50%)',
            clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)',
            zIndex: 50,
          }}
          aria-label="Open map controls"
        >
          <ChevronLeft className="w-5 h-5 text-primary group-hover:text-primary/90 transition-colors" />
        </button>
      )}

      {/* Collapsible Panel - slides from right, overlays map */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 transition-transform duration-300 ease-in-out',
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ 
          right: '0px',
          width: '320px',
          maxWidth: '90vw' // Prevent overflow on small screens
        }}
      >
        <Card className="w-full h-full flex flex-col rounded-none border-l border-r border-border/50 panel-glass surface-gradient card-glow vignette pointer-events-auto">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-border/50 bg-muted/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading glow-cyan">Map Controls</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded(false)}
                aria-label="Collapse panel"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Zoom Level Info */}
            <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
              <div className="text-sm font-mono text-foreground">
                Zoom: {zoomLevel}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(((zoomPan.scale - minScale) / (maxScale - minScale)) * 350)}% • {allPlanets.length.toLocaleString()} planets • {systemsCount.toLocaleString()} systems
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Zoom</h4>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={zoomPan.zoomIn}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <ZoomIn className="w-4 h-4" />
                  Zoom In
                </Button>
                <Button
                  onClick={zoomPan.zoomOut}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <ZoomOut className="w-4 h-4" />
                  Zoom Out
                </Button>
                <Button
                  onClick={zoomPan.reset}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Zoom
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Search</h4>
              <div className="w-full">
                <CoordinateSearchBar
                  planets={allPlanets}
                  onSearch={onSearch}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Navigation</h4>
              <div className="flex flex-col gap-2">
                {onNavigateToCore && (
                  <Button
                    onClick={onNavigateToCore}
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <Home className="w-4 h-4" />
                    Navigate to Core
                  </Button>
                )}
                <Button
                  onClick={() => setShowJumpPanel(true)}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Navigation className="w-4 h-4" />
                  Jump to Coordinates
                </Button>
              </div>
            </div>

            {/* Visual Options */}
            {onToggleSpiralGuidelines && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Visual Options</h4>
                <Button
                  onClick={() => onToggleSpiralGuidelines(!showSpiralGuidelines)}
                  className={cn(
                    "w-full justify-start gap-2",
                    showSpiralGuidelines && "bg-primary/20"
                  )}
                  variant="outline"
                >
                  <Eye className="w-4 h-4" />
                  {showSpiralGuidelines ? 'Hide' : 'Show'} Spiral Guidelines
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Jump Panel - overlay */}
      {showJumpPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <CoordinateJumpPanel
              planets={allPlanets}
              onJump={(centerX, centerY, normalizedZoom) => {
                onSearch(centerX, centerY, normalizedZoom)
                setShowJumpPanel(false)
              }}
              onClose={() => setShowJumpPanel(false)}
              gridWidth={gridWidth}
              gridHeight={gridHeight}
            />
          </div>
        </div>
      )}
    </>
  )

  // Render to document.body via portal to ensure proper positioning
  return createPortal(panelContent, document.body)
}

