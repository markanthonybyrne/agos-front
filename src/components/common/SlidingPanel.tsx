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

  const isMinimized = panelState === PanelState.MINIMIZED

  return (
    <>
      {/* Backdrop */}
      {!hideBackdrop && (
        <div 
          ref={backdropRef}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          style={{ opacity: isMinimized ? 0 : 1 }}
        />
      )}
      
      {/* Side Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed right-0 h-full bg-card border-l border-border z-50',
          'transform transition-all duration-300 ease-out',
          'overflow-hidden',
          SIZE_MAP[size],
          isMinimized ? 'translate-y-[calc(100%-60px)]' : 'translate-y-0',
          className
        )}
        style={{ zIndex }}
      >
        <Card className="h-full rounded-none border-0 panel-glass">
          {/* Header with minimize/maximize */}
          <CardHeader className={cn(
            "sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b transition-all duration-200",
            isMinimized && "border-0"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="truncate">{title}</CardTitle>
                {description && !isMinimized && (
                  <CardDescription className="mt-1">{description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {onMinimize && onMaximize && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isMinimized ? onMaximize : onMinimize}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isMinimized ? (
                      <Maximize2 className="w-4 h-4" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Content */}
          <CardContent className={cn(
            "p-6 transition-all duration-200 overflow-y-auto",
            isMinimized && "hidden",
            !isMinimized && "h-[calc(100%-80px)]"
          )}>
            {children}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

