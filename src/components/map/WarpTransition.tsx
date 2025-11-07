import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface WarpTransitionProps {
  onComplete?: () => void
  duration?: number // Animation duration in ms
  className?: string
}

/**
 * WarpTransition - Creates a zoom-in transition with glass blur background
 * 
 * Blurs the background (galaxy map) with a frosted glass effect,
 * then zooms the system view into focus from small to full size.
 */
export function WarpTransition({ 
  onComplete, 
  duration = 800,
  className 
}: WarpTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Start animation
    setIsAnimating(true)
    
    // Complete animation after duration
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false)
      onComplete?.()
    }, duration)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [duration, onComplete])
  
  if (!isAnimating) {
    return null
  }
  
  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] pointer-events-none',
        className
      )}
    >
      {/* Frosted glass blur overlay for background */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          animation: 'fadeInBlur 0.3s ease-out forwards',
        }}
      />
      
      {/* Zoom animation wrapper - system view zooms in */}
      <div
        className="absolute inset-0"
        style={{
          animation: `zoomInFocus ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards`,
          transformOrigin: 'center center',
        }}
      >
        {/* This will contain the system view content which will zoom in */}
      </div>
      
      {/* CSS animations */}
      <style>{`
        @keyframes fadeInBlur {
          from {
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            background-color: rgba(0, 0, 0, 0);
          }
          to {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background-color: rgba(0, 0, 0, 0.3);
          }
        }
        
        @keyframes zoomInFocus {
          0% {
            opacity: 0;
            transform: scale(0.3);
            filter: blur(20px);
          }
          40% {
            opacity: 0.7;
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
        }
      `}</style>
    </div>
  )
}

