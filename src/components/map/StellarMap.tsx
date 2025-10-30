import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCoordinate } from '@/lib/coordinates'
import { 
  Star, 
  Circle, 
  MapPin, 
  Eye, 
  Compass,
  Zap,
  Shield,
  Ship
} from 'lucide-react'

interface StellarMapProps {
  quadrants: any[]
  sectors: any[]
  galaxies: any[]
  planets: any[]
  onNavigate: (level: string, data: any) => void
  onPlanetHover: (planet: any) => void
  onPlanetLeave: () => void
  className?: string
}

export function StellarMap({ 
  quadrants, 
  sectors, 
  galaxies, 
  planets, 
  onNavigate, 
  onPlanetHover, 
  onPlanetLeave,
  className = '' 
}: StellarMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredItem, setHoveredItem] = useState<any>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Generate star field background
  const generateStars = (count: number, width: number, height: number) => {
    const stars = []
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.8 + 0.2
      })
    }
    return stars
  }

  // Generate nebula clouds
  const generateNebula = (width: number, height: number) => {
    const nebula = []
    for (let i = 0; i < 3; i++) {
      nebula.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 100 + 50,
        opacity: Math.random() * 0.3 + 0.1,
        color: ['#19EAFD', '#3A3A3D', '#1C2024'][Math.floor(Math.random() * 3)]
      })
    }
    return nebula
  }

  // Draw the stellar map
  const drawMap = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.log('Canvas ref not found')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('Canvas context not found')
      return
    }

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      console.log('Canvas has zero dimensions:', rect)
      return
    }

    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const width = rect.width
    const height = rect.height

    console.log('Drawing map with dimensions:', width, height)
    console.log('Data:', { quadrants: quadrants.length, sectors: sectors.length, galaxies: galaxies.length, planets: planets.length })

    // Clear canvas
    ctx.fillStyle = '#17191D'
    ctx.fillRect(0, 0, width, height)

    // Draw star field
    const stars = generateStars(200, width, height)
    stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw nebula
    const nebula = generateNebula(width, height)
    nebula.forEach(cloud => {
      const gradient = ctx.createRadialGradient(
        cloud.x, cloud.y, 0,
        cloud.x, cloud.y, cloud.radius
      )
      gradient.addColorStop(0, `${cloud.color}${Math.floor(cloud.opacity * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, `${cloud.color}00`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw quadrants
    const quadrantSize = Math.min(width, height) / 4
    const centerX = width / 2
    const centerY = height / 2

    quadrants.forEach((quadrant, index) => {
      const angle = (index / quadrants.length) * Math.PI * 2
      const x = centerX + Math.cos(angle) * quadrantSize * 0.6
      const y = centerY + Math.sin(angle) * quadrantSize * 0.6

      // Draw quadrant circle
      ctx.strokeStyle = '#19EAFD'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, quadrantSize * 0.3, 0, Math.PI * 2)
      ctx.stroke()

      // Draw quadrant label
      ctx.fillStyle = '#19EAFD'
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`Q${quadrant.id}`, x, y - 5)

      // Draw sector indicators
      const sectorCount = Math.min(quadrant.sectors?.length || 0, 8)
      for (let i = 0; i < sectorCount; i++) {
        const sectorAngle = (i / sectorCount) * Math.PI * 2
        const sectorX = x + Math.cos(sectorAngle) * quadrantSize * 0.2
        const sectorY = y + Math.sin(sectorAngle) * quadrantSize * 0.2
        
        ctx.fillStyle = '#3A3A3D'
        ctx.beginPath()
        ctx.arc(sectorX, sectorY, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Draw planets
    planets.forEach(planet => {
      const coord = formatCoordinate(planet.coordinate)
      const parts = coord.split(':')
      const quadIndex = parseInt(parts[0]) - 1
      const sectorIndex = parseInt(parts[1]) - 1
      const galaxyIndex = parseInt(parts[2]) - 1
      const planetIndex = parseInt(parts[3]) - 1

      if (quadIndex >= 0 && quadIndex < quadrants.length) {
        const quadrant = quadrants[quadIndex]
        const angle = (quadIndex / quadrants.length) * Math.PI * 2
        const quadX = centerX + Math.cos(angle) * quadrantSize * 0.6
        const quadY = centerY + Math.sin(angle) * quadrantSize * 0.6

        // Calculate planet position within quadrant
        const planetAngle = (planetIndex / 8) * Math.PI * 2
        const planetRadius = quadrantSize * 0.1 + (galaxyIndex * 10)
        const planetX = quadX + Math.cos(planetAngle) * planetRadius
        const planetY = quadY + Math.sin(planetAngle) * planetRadius

        // Draw planet
        const isColonized = planet.owner_empire_id
        ctx.fillStyle = isColonized ? '#10B981' : '#6B7280'
        ctx.beginPath()
        ctx.arc(planetX, planetY, 4, 0, Math.PI * 2)
        ctx.fill()

        // Draw planet glow if colonized
        if (isColonized) {
          const glowGradient = ctx.createRadialGradient(planetX, planetY, 0, planetX, planetY, 8)
          glowGradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
          glowGradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(planetX, planetY, 8, 0, Math.PI * 2)
          ctx.fill()
        }

        // Check if planet is hovered
        const mouseX = (hoveredItem?.x || 0) * zoom + pan.x
        const mouseY = (hoveredItem?.y || 0) * zoom + pan.y
        const distance = Math.sqrt((mouseX - planetX) ** 2 + (mouseY - planetY) ** 2)
        
        if (distance < 10) {
          // Draw planet info
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(planetX + 10, planetY - 20, 150, 40)
          
          ctx.fillStyle = '#19EAFD'
          ctx.font = '12px monospace'
          ctx.textAlign = 'left'
          ctx.fillText(planet.name || `Planet ${parts[3]}`, planetX + 15, planetY - 5)
          ctx.fillText(coord, planetX + 15, planetY + 10)
        }
      }
    })

    // Draw grid lines
    ctx.strokeStyle = 'rgba(58, 58, 61, 0.3)'
    ctx.lineWidth = 1
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }
  }

  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setPan(prev => ({
          x: prev.x + (e.clientX - dragStart.x),
          y: prev.y + (e.clientY - dragStart.y)
        }))
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)))
  }

  // Redraw when data changes
  useEffect(() => {
    // Add a small delay to ensure canvas is properly mounted
    const timer = setTimeout(() => {
      drawMap()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [quadrants, sectors, galaxies, planets, zoom, pan, hoveredItem])

  // Also redraw on window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => drawMap(), 100)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Show fallback if no data
  if (quadrants.length === 0 && planets.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <Card className="panel-glass border-cyan/20">
          <CardContent className="pt-6 text-center">
            <Star className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Universe Data</h3>
            <p className="text-muted-foreground">
              Unable to load universe data for the stellar map.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Card className="panel-glass border-cyan/20 overflow-hidden">
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            className="w-full h-96 cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{ background: '#17191D', minHeight: '384px' }}
          />
          
          {/* Map Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
              className="bg-black/50 border-cyan/50"
            >
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
              className="bg-black/50 border-cyan/50"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPan({ x: 0, y: 0 })}
              className="bg-black/50 border-cyan/50"
            >
              <Compass className="w-4 h-4" />
            </Button>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 bg-black/50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span>Colonized</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full" />
              <span>Uncolonized</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
