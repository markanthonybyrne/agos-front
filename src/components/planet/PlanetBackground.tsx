import { ReactNode, useMemo } from 'react'
import { getPlanetImage, asteroidImg } from '@/lib/planetImages'
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
  
  // Generate random asteroid clusters for aesthetic background
  const asteroids = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const clusterX = Math.random() * 100 // 0-100% of container
      const clusterY = Math.random() * 100
      const clusterSize = 3 + Math.random() * 4 // 3-7 asteroids per cluster
      
      return {
        id: `asteroid-cluster-${i}`,
        x: clusterX,
        y: clusterY,
        count: Math.floor(clusterSize),
        baseSize: 12 + Math.random() * 16, // 12-28px base size
      }
    })
  }, [])
  
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
      
      {/* Asteroid clusters - rendered after planet bg but before overlay for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
        {asteroids.map((cluster) => (
          <div
            key={cluster.id}
            className="absolute"
            style={{
              left: `${cluster.x}%`,
              top: `${cluster.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {Array.from({ length: cluster.count }).map((_, i) => {
              // Create more varied positioning within cluster
              const angle = (i / cluster.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
              const radius = 25 + Math.random() * 50
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius
              const size = cluster.baseSize * (0.8 + Math.random() * 0.4)
              const rotation = Math.random() * 360
              const opacity = 0.5 + Math.random() * 0.3 // 0.5-0.8 opacity for better visibility
              
              return (
                <img
                  key={`${cluster.id}-${i}`}
                  src={asteroidImg}
                  alt="Asteroid"
                  className="absolute"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                    opacity,
                    filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.4)) brightness(1.1)',
                    mixBlendMode: 'screen', // Make asteroids glow more
                  }}
                  onError={(e) => {
                    // Silently handle missing asteroid image
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      
      {/* Overlay gradient for readability - asteroids show through with reduced opacity */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/55 to-background/75" style={{ zIndex: 8 }} />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

