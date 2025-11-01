import { ReactNode, useEffect, useRef } from 'react'
import { X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PanelSize, PanelState } from '@/app/slices/panelSlice'

interface SlidingPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  size?: PanelSize
  panelState?: PanelState
  onMinimize?: () => void
  onMaximize?: () => void
  zIndex?: number
  hideBackdrop?: boolean
}

const SIZE_MAP: Record<PanelSize, string> = {
  [PanelSize.SMALL]: 'max-w-md',
  [PanelSize.MEDIUM]: 'max-w-2xl',
  [PanelSize.LARGE]: 'max-w-4xl',
  [PanelSize.XLARGE]: 'max-w-6xl',
  [PanelSize.FULL_HEIGHT]: 'max-w-full',
}

export function SlidingPanel({ 
  isOpen, 
  onClose, 
  title, 
  description,
  children,
  className,
  size = PanelSize.MEDIUM,
  panelState = PanelState.NORMAL,
  onMinimize,
  onMaximize,
  zIndex = 50,
  hideBackdrop = false,
}: SlidingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  // Don't render minimized panels here - they're handled by PanelManager as tabs
  if (panelState === PanelState.MINIMIZED) return null

  return (
    <>
      {/* Backdrop */}
      {!hideBackdrop && (
        <div 
          ref={backdropRef}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={(e) => {
            // Check if tutorial is active - if so, don't close panel on backdrop click
            const tutorialActive = document.querySelector('[data-tutorial-active="true"]')
            if (tutorialActive) {
              e.stopPropagation()
              return
            }
            onClose()
          }}
        />
      )}
      
      {/* Side Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed right-0 h-full bg-card border-l border-border z-50 shadow-2xl',
          'transform transition-all duration-300 ease-out',
          'overflow-hidden',
          SIZE_MAP[size],
          className
        )}
        style={{ zIndex }}
      >
        <Card className="h-full rounded-none border-0 panel-glass" style={{ clipPath: 'none' }}>
          {/* Sleek header with minimize/maximize */}
          <CardHeader className={cn(
            "sticky top-0 bg-muted/20 backdrop-blur-sm z-10 border-b border-border/50 transition-all duration-200",
            "p-3"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="truncate text-base font-semibold">{title}</CardTitle>
                {description && (
                  <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-1 ml-4">
                {onMinimize && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMinimize}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Content */}
          <CardContent className="p-6 transition-all duration-200 overflow-y-auto h-[calc(100%-56px)]">
            {children}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

