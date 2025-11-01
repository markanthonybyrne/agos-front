import { useEffect, useState, useRef } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TutorialStep } from '@/config/tutorialSteps'
import { cn } from '@/lib/utils'

interface TutorialSpotlightProps {
  isActive: boolean
  step: TutorialStep
  currentStepIndex: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
  onClose: () => void
}

export function TutorialSpotlight({
  isActive,
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onSkip,
  onClose,
}: TutorialSpotlightProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [annotationPosition, setAnnotationPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')
  const overlayRef = useRef<HTMLDivElement>(null)
  const annotationRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!isActive || !step.targetSelector) return
    
    // Find target element
    const element = document.querySelector(step.targetSelector) as HTMLElement
    if (!element) {
      console.warn(`Tutorial spotlight: Element not found for selector "${step.targetSelector}"`)
      return
    }
    
    setTargetElement(element)
    
    // Calculate position
    const updatePosition = () => {
      const rect = element.getBoundingClientRect()
      setPosition({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      })
      
      // Determine annotation position (prefer bottom, fallback to top)
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      if (spaceBelow > 120) {
        setAnnotationPosition('bottom')
      } else if (spaceAbove > 120) {
        setAnnotationPosition('top')
      } else if (rect.right < window.innerWidth / 2) {
        setAnnotationPosition('right')
      } else {
        setAnnotationPosition('left')
      }
    }
    
    updatePosition()
    
    // Add highlight class to element
    element.classList.add('tutorial-highlighted')
    
    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    
    // Update position on scroll/resize
    const handleUpdate = () => {
      updatePosition()
    }
    
    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)
    
    return () => {
      element.classList.remove('tutorial-highlighted')
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [isActive, step.targetSelector])
  
  if (!isActive || !targetElement) return null
  
  const progress = ((currentStepIndex + 1) / totalSteps) * 100
  
  // Calculate annotation position
  let annotationStyle: React.CSSProperties = {}
  let arrowStyle: React.CSSProperties = {}
  
  switch (annotationPosition) {
    case 'bottom':
      annotationStyle = {
        top: `${position.y + position.height + 16}px`,
        left: `${position.x + position.width / 2}px`,
        transform: 'translateX(-50%)',
      }
      arrowStyle = {
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderBottomColor: 'hsl(var(--card))',
      }
      break
    case 'top':
      annotationStyle = {
        bottom: `${window.innerHeight - position.y + 16}px`,
        left: `${position.x + position.width / 2}px`,
        transform: 'translateX(-50%)',
      }
      arrowStyle = {
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderTopColor: 'hsl(var(--card))',
      }
      break
    case 'right':
      annotationStyle = {
        top: `${position.y + position.height / 2}px`,
        left: `${position.x + position.width + 16}px`,
        transform: 'translateY(-50%)',
      }
      arrowStyle = {
        right: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        borderRightColor: 'hsl(var(--card))',
      }
      break
    case 'left':
      annotationStyle = {
        top: `${position.y + position.height / 2}px`,
        right: `${window.innerWidth - position.x + 16}px`,
        transform: 'translateY(-50%)',
      }
      arrowStyle = {
        left: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        borderLeftColor: 'hsl(var(--card))',
      }
      break
  }
  
  return (
    <>
      {/* Dark overlay with cutout - higher z-index than panels */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse ${position.width + 40}px ${position.height + 40}px at ${position.x + position.width / 2}px ${position.y + position.height / 2}px, transparent 0%, transparent 60%, rgba(0, 0, 0, 0.85) 100%)`,
        }}
      />
      
      {/* Highlight border around element */}
      <div
        className="fixed z-[9999] pointer-events-none border-2 border-cyan-400 rounded-lg animate-pulse"
        style={{
          left: `${position.x - 4}px`,
          top: `${position.y - 4}px`,
          width: `${position.width + 8}px`,
          height: `${position.height + 8}px`,
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.3)',
        }}
      />
      
      {/* Annotation tooltip */}
      <div
        ref={annotationRef}
        className="fixed z-[10000] pointer-events-auto"
        style={annotationStyle}
      >
        <div className="relative panel-glass surface-gradient border border-cyan-500/40 card-glow p-4 shadow-2xl max-w-xs">
          {/* Arrow */}
          <div
            className="absolute border-8 border-transparent"
            style={arrowStyle}
          />
          
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-cyan-400 glow-cyan mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.annotation || step.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Progress indicator */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-muted-foreground">
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-xs h-auto py-0 text-muted-foreground hover:text-foreground"
                >
                  Skip
                </Button>
              </div>
              <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            {/* Action button */}
            <Button
              onClick={onNext}
              size="sm"
              className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2"
            >
              {currentStepIndex === totalSteps - 1 ? 'Complete Tutorial' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

