import { ReactNode } from 'react'
import { getPlanetImage } from '@/lib/planetImages'
import { cn } from '@/lib/utils'

interface PlanetBackgroundProps {
  planetSlug?: string
  className?: string
  children: ReactNode
  overlay?: boolean
}

export function PlanetBackground({ 
  planetSlug, 
  className, 
  children,
  overlay = true 
}: PlanetBackgroundProps) {
  const planetImage = getPlanetImage(planetSlug) || getPlanetImage('arid')
  
  return (
    <div 
      className={cn(
        'relative min-h-[600px] rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Planet background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${planetImage})`,
          filter: 'blur(2px) brightness(0.4)',
          transform: 'scale(1.1)',
        }}
      />
      
      {/* Overlay gradient for readability */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

