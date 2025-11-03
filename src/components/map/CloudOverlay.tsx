import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface CloudOverlayProps {
  isVisible: boolean
  className?: string
  children: React.ReactNode
}

// Generate stable particle data
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    // Use a seeded random based on index for consistency
    const seed = i * 0.12345
    const random = (offset: number = 0) => {
      const x = Math.sin(seed + offset) * 10000
      return x - Math.floor(x)
    }
    
    return {
      id: i,
      left: random(1) * 100,
      top: random(2) * 100,
      width: random(3) * 8 + 4,
      height: random(4) * 8 + 4,
      opacity: random(5) * 0.5 + 0.3,
      delay: random(6) * 5,
      duration: random(7) * 10 + 5,
      offsetX: (random(8) - 0.5) * 20,
      offsetY: (random(9) - 0.5) * 20,
      opacityStart: random(10) * 0.3 + 0.2,
      opacityMid: random(11) * 0.5 + 0.4,
    }
  })
}

export function CloudOverlay({ isVisible, className, children }: CloudOverlayProps) {
  const particles = useMemo(() => generateParticles(20), [])

  if (isVisible) {
    return <>{children}</>
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      {/* Dark nebula cloud overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
        
        {/* Swirling cloud effect */}
        <div 
          className="absolute inset-0 opacity-90"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0, 0, 0, 0.95) 0%, transparent 50%),
              radial-gradient(ellipse 50% 60% at 70% 80%, rgba(0, 0, 0, 0.95) 0%, transparent 50%),
              radial-gradient(ellipse 40% 50% at 50% 50%, rgba(0, 0, 0, 0.9) 0%, transparent 60%),
              radial-gradient(ellipse 45% 35% at 20% 60%, rgba(0, 0, 0, 0.92) 0%, transparent 55%),
              radial-gradient(ellipse 55% 45% at 80% 30%, rgba(0, 0, 0, 0.93) 0%, transparent 50%)
            `,
            mixBlendMode: 'multiply',
          }}
        />
        
        {/* Subtle animated particles/dust effect */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full bg-black/40 blur-sm"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${particle.width}px`,
                height: `${particle.height}px`,
                opacity: particle.opacity,
                animation: `float-particle-${particle.id} ${particle.duration}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`,
              }}
            >
              <style>{`
                @keyframes float-particle-${particle.id} {
                  0%, 100% {
                    transform: translate(0, 0);
                    opacity: ${particle.opacityStart};
                  }
                  50% {
                    transform: translate(${particle.offsetX}px, ${particle.offsetY}px);
                    opacity: ${particle.opacityMid};
                  }
                }
              `}</style>
            </div>
          ))}
        </div>
        
        {/* Lock icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-black/60 border-2 border-muted/40 flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-muted-foreground/80" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground/80 font-medium">Undiscovered</p>
          </div>
        </div>
      </div>
    </div>
  )
}

