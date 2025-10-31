import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Star, 
  Circle, 
  Orbit, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye,
  Navigation,
  Compass
} from 'lucide-react'
import { Planet } from '@/types/api.types'
import { formatCoordinate } from '@/lib/coordinates'

interface StellarMap3DProps {
  planets: Planet[]
  onPlanetHover?: (planet: Planet | null) => void
  onPlanetClick?: (planet: Planet) => void
  className?: string
}

interface PlanetPosition {
  x: number
  y: number
  z: number
  radius: number
  orbitRadius: number
  angle: number
  speed: number
}

export function StellarMap3D({ 
  planets, 
  onPlanetHover, 
  onPlanetClick,
  className = '' 
}: StellarMap3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  const [viewMode, setViewMode] = useState<'top' | 'side' | 'perspective'>('perspective')

  // Generate planet positions based on coordinates
  const generatePlanetPositions = useCallback((planets: Planet[]): Map<number, PlanetPosition> => {
    const positions = new Map<number, PlanetPosition>()
    
    planets.forEach((planet, index) => {
      const coord = formatCoordinate(planet.coordinate)
      const [q, s, g, p] = coord.split(':').map(Number)
      
      // Create orbital system based on coordinates
      const quadrantAngle = (q - 1) * (Math.PI / 2) // 4 quadrants
      const sectorAngle = (s - 1) * (Math.PI / 8) // 8 sectors per quadrant
      const galaxyRadius = 50 + (g - 1) * 30 // Distance from center
      const planetAngle = (p - 1) * (Math.PI / 16) // 16 planets per galaxy
      
      const orbitRadius = galaxyRadius + (p - 1) * 5
      const angle = quadrantAngle + sectorAngle + planetAngle
      
      positions.set(planet.id, {
        x: Math.cos(angle) * orbitRadius,
        y: Math.sin(angle) * orbitRadius,
        z: (Math.random() - 0.5) * 20, // Random height variation
        radius: planet.owner_empire_id ? 8 : 6, // Colonized planets are larger
        orbitRadius,
        angle,
        speed: 0.001 + Math.random() * 0.002 // Random orbital speed
      })
    })
    
    return positions
  }, [])

  const [planetPositions] = useState(() => generatePlanetPositions(planets))

  // 3D projection functions
  const project3D = (x: number, y: number, z: number, viewMode: string) => {
    const scale = zoom * 0.8
    const centerX = 400
    const centerY = 300
    
    switch (viewMode) {
      case 'top':
        return {
          x: centerX + x * scale,
          y: centerY + y * scale,
          z: z
        }
      case 'side':
        return {
          x: centerX + x * scale,
          y: centerY + z * scale,
          z: y
        }
      case 'perspective':
      default:
        const perspective = 500
        const factor = perspective / (perspective + z)
        return {
          x: centerX + x * scale * factor,
          y: centerY + y * scale * factor,
          z: z
        }
    }
  }

  // Render the 3D scene
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw starfield background
    ctx.fillStyle = '#1a1a2e'
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = Math.random() * 2
      ctx.fillRect(x, y, size, size)
    }

    // Draw central star
    const centerX = 400
    const centerY = 300
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30)
    gradient.addColorStop(0, '#ffff00')
    gradient.addColorStop(0.3, '#ffaa00')
    gradient.addColorStop(1, '#ff6600')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2)
    ctx.fill()

    // Add star glow effect
    ctx.shadowColor = '#ffff00'
    ctx.shadowBlur = 20
    ctx.fillStyle = '#ffff00'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Draw orbital rings
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 4; i++) {
      const radius = 80 + i * 40
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Sort planets by z-depth for proper rendering
    const sortedPlanets = planets
      .map(planet => ({
        planet,
        position: planetPositions.get(planet.id)
      }))
      .filter(item => item.position)
      .sort((a, b) => (b.position?.z || 0) - (a.position?.z || 0))

    // Draw planets
    sortedPlanets.forEach(({ planet, position }) => {
      if (!position) return

      // Update planet position for animation
      if (isAnimating) {
        position.angle += position.speed
        position.x = Math.cos(position.angle) * position.orbitRadius
        position.y = Math.sin(position.angle) * position.orbitRadius
      }

      const projected = project3D(position.x, position.y, position.z, viewMode)
      
      // Skip if planet is behind the camera
      if (projected.z < -400) return

      const isColonized = planet.owner_empire_id
      const isHovered = hoveredPlanet?.id === planet.id

      // Draw planet
      const planetGradient = ctx.createRadialGradient(
        projected.x - position.radius * 0.3, 
        projected.y - position.radius * 0.3, 
        0,
        projected.x, 
        projected.y, 
        position.radius
      )
      
      if (isColonized) {
        planetGradient.addColorStop(0, '#4ade80')
        planetGradient.addColorStop(0.7, '#22c55e')
        planetGradient.addColorStop(1, '#16a34a')
      } else {
        planetGradient.addColorStop(0, '#94a3b8')
        planetGradient.addColorStop(0.7, '#64748b')
        planetGradient.addColorStop(1, '#475569')
      }

      ctx.fillStyle = planetGradient
      ctx.beginPath()
      ctx.arc(projected.x, projected.y, position.radius, 0, Math.PI * 2)
      ctx.fill()

      // Add planet glow
      if (isHovered) {
        ctx.shadowColor = isColonized ? '#4ade80' : '#94a3b8'
        ctx.shadowBlur = 15
        ctx.fillStyle = isColonized ? '#4ade80' : '#94a3b8'
        ctx.beginPath()
        ctx.arc(projected.x, projected.y, position.radius + 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Draw planet label
      if (isHovered || projected.z > -200) {
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(
          planet.name || `Planet ${formatCoordinate(planet.coordinate).split(':')[3]}`,
          projected.x,
          projected.y - position.radius - 10
        )
      }
    })

    // Draw connection lines for nearby planets
    if (hoveredPlanet) {
      const hoveredPos = planetPositions.get(hoveredPlanet.id)
      if (hoveredPos) {
        const hoveredProjected = project3D(hoveredPos.x, hoveredPos.y, hoveredPos.z, viewMode)
        
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        
        sortedPlanets.forEach(({ planet, position }) => {
          if (planet.id === hoveredPlanet.id || !position) return
          
          const distance = Math.sqrt(
            Math.pow(hoveredPos.x - position.x, 2) + 
            Math.pow(hoveredPos.y - position.y, 2) + 
            Math.pow(hoveredPos.z - position.z, 2)
          )
          
          if (distance < 100) {
            const projected = project3D(position.x, position.y, position.z, viewMode)
            ctx.beginPath()
            ctx.moveTo(hoveredProjected.x, hoveredProjected.y)
            ctx.lineTo(projected.x, projected.y)
            ctx.stroke()
          }
        })
        
        ctx.setLineDash([])
      }
    }

  }, [planets, planetPositions, hoveredPlanet, zoom, rotation, isAnimating, viewMode])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render()
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [render, isAnimating])

  // Handle mouse events
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find planet under mouse
    let foundPlanet: Planet | null = null
    for (const planet of planets) {
      const position = planetPositions.get(planet.id)
      if (!position) continue

      const projected = project3D(position.x, position.y, position.z, viewMode)
      const distance = Math.sqrt(
        Math.pow(x - projected.x, 2) + Math.pow(y - projected.y, 2)
      )

      if (distance < position.radius + 5) {
        foundPlanet = planet
        break
      }
    }

    setHoveredPlanet(foundPlanet)
    onPlanetHover?.(foundPlanet)
  }

  const handleMouseLeave = () => {
    setHoveredPlanet(null)
    onPlanetHover?.(null)
  }

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPlanet) {
      onPlanetClick?.(hoveredPlanet)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.5))}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAnimating(!isAnimating)}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(prev => 
            prev === 'top' ? 'side' : prev === 'side' ? 'perspective' : 'top'
          )}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>

      {/* View Mode Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="outline" className="bg-black/50 text-white">
          <Compass className="w-3 h-3 mr-1" />
          {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
        </Badge>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full rounded-lg border border-cyan/20 cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {/* Planet Info Panel */}
      {hoveredPlanet && (
        <Card className="absolute bottom-4 left-4 z-10 panel-glass border-cyan/20 max-w-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Circle className={`w-4 h-4 ${hoveredPlanet.owner_empire_id ? 'text-green-400' : 'text-muted-foreground'}`} />
              <span className="font-semibold">
                {hoveredPlanet.name || `Planet ${formatCoordinate(hoveredPlanet.coordinate).split(':')[3]}`}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {formatCoordinate(hoveredPlanet.coordinate)}
            </div>
            <Badge 
              variant={hoveredPlanet.owner_empire_id ? 'default' : 'outline'}
              className={hoveredPlanet.owner_empire_id ? 'bg-green-500' : ''}
            >
              {hoveredPlanet.state}
            </Badge>
            {hoveredPlanet.owner_empire_id && (
              <div className="text-xs text-muted-foreground mt-1">
                Owner: Empire #{hoveredPlanet.owner_empire_id}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="absolute bottom-4 right-4 z-10 panel-glass border-muted/20 max-w-xs">
        <CardContent className="pt-4">
          <h4 className="font-semibold mb-2 text-sm">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span>Colonized</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span>Central Star</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-400"></div>
              <span>Orbital Rings</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






