import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PanelSize, PanelState } from '@/app/slices/panelSlice'

interface SlidingPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string | ReactNode
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
  [PanelSize.SMALL]: 'w-full sm:max-w-md',
  [PanelSize.MEDIUM]: 'w-full sm:max-w-2xl',
  [PanelSize.LARGE]: 'w-full sm:max-w-4xl',
  [PanelSize.XLARGE]: 'w-full sm:max-w-6xl',
  [PanelSize.FULL_HEIGHT]: 'w-full',
}

// Custom width override for admin panel (70% viewport width)
const CUSTOM_WIDTH_CLASS = '!w-[70vw]'

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
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure portal only renders on client side
  useEffect(() => {
    setMounted(true)
  }, [])

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
    if (isOpen && panelRef.current && isVisible) {
      const firstFocusable = panelRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }
  }, [isOpen, isVisible])

  // Handle slide-in animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Early returns AFTER all hooks - these control visibility, not hook execution
  if (!mounted) {
    return null
  }

  if (panelState === PanelState.MINIMIZED) {
    return null
  }

  if (!isOpen && !isVisible) {
    return null
  }

  const panelContent = (
    <>
      {/* Backdrop */}
      {!hideBackdrop && (
        <div 
          ref={backdropRef}
          className={cn(
            "sliding-panel-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-out",
            isAnimating ? "opacity-100" : "opacity-0"
          )}
          style={{ 
            zIndex: zIndex - 1, // Backdrop should be just below the panel
            pointerEvents: isAnimating ? 'auto' : 'none'
          }}
          onClick={(e) => {
            if (!isAnimating) return
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
          'sliding-panel-container fixed right-0 top-0 flex h-full max-h-screen border-l border-border shadow-2xl bg-transparent',
          'overflow-hidden flex-col',
          className?.includes(CUSTOM_WIDTH_CLASS) ? '' : SIZE_MAP[size],
          className
        )}
        style={{ 
          zIndex,
          width: className?.includes(CUSTOM_WIDTH_CLASS) ? '70vw' : undefined,
          transform: isAnimating ? 'translate3d(0, 0, 0)' : 'translate3d(100%, 0, 0)',
          transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease-out',
          opacity: isAnimating ? 1 : 0,
        }}
        onWheelCapture={(event) => {
          event.stopPropagation()
        }}
        onMouseDownCapture={(event) => {
          event.stopPropagation()
        }}
        onTouchStartCapture={(event) => {
          event.stopPropagation()
        }}
      >
        <Card className="flex h-full min-h-0 flex-col rounded-none border-0 panel-glass" style={{ clipPath: 'none' }}>
          {/* Sleek header with minimize/maximize */}
          <CardHeader 
            className={cn(
              "sliding-panel-content sticky top-0 z-10 border-b border-brand-cyan/30 bg-[rgba(8,14,23,0.88)] backdrop-blur-md",
              "p-3 transition-opacity duration-200 flex-shrink-0 shadow-[0_10px_25px_rgba(0,0,0,0.35)]",
              isAnimating ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className={cn(
                  "truncate text-base font-semibold text-brand-cyan",
                  typeof title !== 'string' && "flex items-center gap-2"
                )}>
                  {title}
                </CardTitle>
                {description && (
                  <CardDescription className="mt-0.5 text-xs text-muted-foreground/80">{description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-1 ml-4">
                {onMinimize && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMinimize}
                    className="h-6 w-6 text-muted-foreground hover:text-brand-cyan hover:bg-[rgba(50,142,119,0.08)]"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/15"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Content */}
          <CardContent 
            className={cn(
              "sliding-panel-content flex-1 overflow-y-auto p-4 md:p-6 transition-opacity duration-200 min-h-0",
              isAnimating ? "opacity-100" : "opacity-0"
            )}
          >
            {children}
          </CardContent>
        </Card>
      </div>
    </>
  )

  // Render to document.body via portal to escape stacking context
  return createPortal(panelContent, document.body)
}

