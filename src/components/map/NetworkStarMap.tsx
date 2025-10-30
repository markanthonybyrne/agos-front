import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Star, 
  Circle, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye,
  Navigation,
  Compass,
  Search,
  Filter,
  ArrowRight,
  MapPin
} from 'lucide-react'
import { Planet } from '@/types/api.types'
import { formatCoordinate } from '@/lib/coordinates'

interface NetworkStarMapProps {
  planets: Planet[]
  onPlanetHover?: (planet: Planet | null) => void
  onPlanetClick?: (planet: Planet) => void
  className?: string
}

interface NodePosition {
  x: number
  y: number
  id: number
  planet: Planet
  connections: number[]
  level: number
  color: string
  size: number
}

interface Connection {
  from: number
  to: number
  distance: number
  type: 'solid' | 'dashed'
  active: boolean
}

export function NetworkStarMap({ 
  planets, 
  onPlanetHover, 
  onPlanetClick,
  className = '' 
}: NetworkStarMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null)
  const [showConnections, setShowConnections] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'colonized' | 'available'>('all')
  const [currentLayer, setCurrentLayer] = useState<'galaxy' | 'quadrant' | 'sector' | 'planets'>('galaxy')
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null)
  const [selectedSector, setSelectedSector] = useState<number | null>(null)

  // Generate network layout based on current layer
  const generateNetworkLayout = useCallback((planets: Planet[], layer: string, selectedQ?: number, selectedS?: number): { nodes: NodePosition[], connections: Connection[] } => {
    const nodes: NodePosition[] = []
    const connections: Connection[] = []
    let nodeId = 0

    if (layer === 'galaxy') {
      // Galaxy view - show quadrants as large nodes
      const quadrants = new Map<number, Planet[]>()
      planets.forEach(planet => {
        const coord = formatCoordinate(planet.coordinate)
        const [q] = coord.split(':').map(Number)
        if (!quadrants.has(q)) quadrants.set(q, [])
        quadrants.get(q)!.push(planet)
      })

      const quadrantPositions = [
        { x: -300, y: -300 }, // Q1: Top-left
        { x: 300, y: -300 },  // Q2: Top-right
        { x: -300, y: 300 },  // Q3: Bottom-left
        { x: 300, y: 300 }    // Q4: Bottom-right
      ]

      quadrants.forEach((quadrantPlanets, quadrant) => {
        const pos = quadrantPositions[quadrant - 1] || { x: 0, y: 0 }
        const colonizedCount = quadrantPlanets.filter(p => p.owner_empire_id).length
        
        const node: NodePosition = {
          x: pos.x,
          y: pos.y,
          id: nodeId++,
          planet: quadrantPlanets[0],
          connections: [],
          level: 0,
          color: colonizedCount > 0 ? '#22c55e' : '#64748b',
          size: 20
        }
        nodes.push(node)
      })

      // Connect all quadrants
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          connections.push({
            from: nodes[i].id,
            to: nodes[j].id,
            distance: 600,
            type: 'dashed',
            active: true
          })
        }
      }
    } else if (layer === 'quadrant' && selectedQ) {
      // Quadrant view - show sectors
      const sectors = new Map<number, Planet[]>()
      planets.forEach(planet => {
        const coord = formatCoordinate(planet.coordinate)
        const [q, s] = coord.split(':').map(Number)
        if (q === selectedQ) {
          if (!sectors.has(s)) sectors.set(s, [])
          sectors.get(s)!.push(planet)
        }
      })

      const centerX = 0
      const centerY = 0
      const radius = 200

      sectors.forEach((sectorPlanets, sector) => {
        const angle = (sector - 1) * (Math.PI / 4)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const colonizedCount = sectorPlanets.filter(p => p.owner_empire_id).length

        const node: NodePosition = {
          x,
          y,
          id: nodeId++,
          planet: sectorPlanets[0],
          connections: [],
          level: 1,
          color: colonizedCount > 0 ? '#22c55e' : '#64748b',
          size: 16
        }
        nodes.push(node)
      })

      // Connect sectors to center
      const centerNode: NodePosition = {
        x: centerX,
        y: centerY,
        id: nodeId++,
        planet: sectors.values().next().value?.[0] || planets[0],
        connections: [],
        level: 0,
        color: '#ffaa00',
        size: 18
      }
      nodes.push(centerNode)

      nodes.forEach(node => {
        if (node.level === 1) {
          node.connections.push(centerNode.id)
          centerNode.connections.push(node.id)
          connections.push({
            from: node.id,
            to: centerNode.id,
            distance: radius,
            type: 'solid',
            active: true
          })
        }
      })
    } else if (layer === 'sector' && selectedQ && selectedS) {
      // Sector view - show galaxies
      const galaxies = new Map<number, Planet[]>()
      planets.forEach(planet => {
        const coord = formatCoordinate(planet.coordinate)
        const [q, s, g] = coord.split(':').map(Number)
        if (q === selectedQ && s === selectedS) {
          if (!galaxies.has(g)) galaxies.set(g, [])
          galaxies.get(g)!.push(planet)
        }
      })

      const centerX = 0
      const centerY = 0
      const radius = 150

      galaxies.forEach((galaxyPlanets, galaxy) => {
        const angle = (galaxy - 1) * (Math.PI / 3)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const colonizedCount = galaxyPlanets.filter(p => p.owner_empire_id).length

        const node: NodePosition = {
          x,
          y,
          id: nodeId++,
          planet: galaxyPlanets[0],
          connections: [],
          level: 2,
          color: colonizedCount > 0 ? '#22c55e' : '#64748b',
          size: 14
        }
        nodes.push(node)
      })

      // Connect galaxies to center
      const centerNode: NodePosition = {
        x: centerX,
        y: centerY,
        id: nodeId++,
        planet: galaxies.values().next().value?.[0] || planets[0],
        connections: [],
        level: 0,
        color: '#4ade80',
        size: 16
      }
      nodes.push(centerNode)

      nodes.forEach(node => {
        if (node.level === 2) {
          node.connections.push(centerNode.id)
          centerNode.connections.push(node.id)
          connections.push({
            from: node.id,
            to: centerNode.id,
            distance: radius,
            type: 'solid',
            active: true
          })
        }
      })
    } else if (layer === 'planets' && selectedQ && selectedS) {
      // Planet view - show individual planets
      const filteredPlanets = planets.filter(planet => {
        const coord = formatCoordinate(planet.coordinate)
        const [q, s] = coord.split(':').map(Number)
        return q === selectedQ && s === selectedS
      })

      const centerX = 0
      const centerY = 0
      const radius = 120

      filteredPlanets.forEach((planet, index) => {
        const angle = (index / filteredPlanets.length) * Math.PI * 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const isColonized = planet.owner_empire_id

        const node: NodePosition = {
          x,
          y,
          id: nodeId++,
          planet,
          connections: [],
          level: 3,
          color: isColonized ? '#22c55e' : '#64748b',
          size: isColonized ? 12 : 8
        }
        nodes.push(node)
      })

      // Connect planets to center
      const centerNode: NodePosition = {
        x: centerX,
        y: centerY,
        id: nodeId++,
        planet: filteredPlanets[0] || planets[0],
        connections: [],
        level: 0,
        color: '#ff6600',
        size: 14
      }
      nodes.push(centerNode)

      nodes.forEach(node => {
        if (node.level === 3) {
          node.connections.push(centerNode.id)
          centerNode.connections.push(node.id)
          connections.push({
            from: node.id,
            to: centerNode.id,
            distance: radius,
            type: 'solid',
            active: true
          })
        }
      })
    }

    return { nodes, connections }
  }, [])

  // Generate layout based on current layer
  const networkLayout = generateNetworkLayout(planets, currentLayer, selectedQuadrant || undefined, selectedSector || undefined)

  // Filter nodes based on type
  const filteredNodes = networkLayout.nodes.filter(node => {
    switch (filterType) {
      case 'colonized':
        return node.planet.owner_empire_id
      case 'available':
        return !node.planet.owner_empire_id
      default:
        return true
    }
  })

  // Render the network
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
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = Math.random() * 1.5
      ctx.fillRect(x, y, size, size)
    }

    // Apply zoom and pan
    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    // Draw connections
    if (showConnections) {
      networkLayout.connections.forEach(conn => {
        const fromNode = networkLayout.nodes.find(n => n.id === conn.from)
        const toNode = networkLayout.nodes.find(n => n.id === conn.to)
        
        if (!fromNode || !toNode) return

        ctx.strokeStyle = conn.active ? 'rgba(100, 200, 255, 0.4)' : 'rgba(100, 100, 100, 0.2)'
        ctx.lineWidth = conn.type === 'dashed' ? 2 : 1
        
        if (conn.type === 'dashed') {
          ctx.setLineDash([8, 4])
        } else {
          ctx.setLineDash([])
        }

        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.stroke()

        // Draw direction arrows for active connections
        if (conn.active) {
          const midX = (fromNode.x + toNode.x) / 2
          const midY = (fromNode.y + toNode.y) / 2
          const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
          
          ctx.fillStyle = '#ff6600'
          ctx.save()
          ctx.translate(midX, midY)
          ctx.rotate(angle)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(-8, -4)
          ctx.lineTo(-8, 4)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }
      })
    }

    // Draw nodes
    filteredNodes.forEach(node => {
      const isHovered = hoveredPlanet?.id === node.planet.id
      const isSelected = selectedPlanet?.id === node.planet.id

      // Node glow effect
      if (isHovered || isSelected) {
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size + 8
        )
        gradient.addColorStop(0, node.color + '80')
        gradient.addColorStop(1, node.color + '00')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size + 8, 0, Math.PI * 2)
        ctx.fill()
      }

      // Main node
      const nodeGradient = ctx.createRadialGradient(
        node.x - node.size * 0.3, 
        node.y - node.size * 0.3, 
        0,
        node.x, 
        node.y, 
        node.size
      )
      nodeGradient.addColorStop(0, node.color)
      nodeGradient.addColorStop(0.7, node.color + 'cc')
      nodeGradient.addColorStop(1, node.color + '66')

      ctx.fillStyle = nodeGradient
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
      ctx.fill()

      // Node border
      ctx.strokeStyle = isSelected ? '#ffffff' : node.color + 'aa'
      ctx.lineWidth = isSelected ? 3 : 1
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
      ctx.stroke()

      // Node label
      if (isHovered || isSelected || node.level <= 1) {
        const coord = formatCoordinate(node.planet.coordinate)
        const [, , , p] = coord.split(':').map(Number)
        const label = node.planet.name || `P${p}`
        
        ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc'
        ctx.font = `${node.level === 0 ? '14px' : node.level === 1 ? '12px' : '10px'} monospace`
        ctx.textAlign = 'center'
        ctx.fillText(label, node.x, node.y - node.size - 12)
      }
    })

    ctx.restore()
  }, [networkLayout, filteredNodes, hoveredPlanet, selectedPlanet, zoom, panX, panY, showConnections])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render()
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [render])

  // Handle mouse events
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - panX) / zoom
    const y = (event.clientY - rect.top - panY) / zoom

    if (isDragging) {
      setPanX(prev => prev + (event.clientX - dragStart.x))
      setPanY(prev => prev + (event.clientY - dragStart.y))
      setDragStart({ x: event.clientX, y: event.clientY })
      return
    }

    // Find node under mouse
    let foundPlanet: Planet | null = null
    for (const node of filteredNodes) {
      const distance = Math.sqrt(
        Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
      )

      if (distance < node.size + 5) {
        foundPlanet = node.planet
        break
      }
    }

    setHoveredPlanet(foundPlanet)
    onPlanetHover?.(foundPlanet)
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setHoveredPlanet(null)
    onPlanetHover?.(null)
    setIsDragging(false)
  }

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - panX) / zoom
    const y = (event.clientY - rect.top - panY) / zoom

    for (const node of filteredNodes) {
      const distance = Math.sqrt(
        Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
      )

      if (distance < node.size + 5) {
        setSelectedPlanet(node.planet)
        
        // Handle layer navigation
        if (currentLayer === 'galaxy') {
          const coord = formatCoordinate(node.planet.coordinate)
          const [q] = coord.split(':').map(Number)
          setSelectedQuadrant(q)
          setCurrentLayer('quadrant')
          setZoom(1)
          setPanX(0)
          setPanY(0)
        } else if (currentLayer === 'quadrant') {
          const coord = formatCoordinate(node.planet.coordinate)
          const [, s] = coord.split(':').map(Number)
          setSelectedSector(s)
          setCurrentLayer('sector')
          setZoom(1)
          setPanX(0)
          setPanY(0)
        } else if (currentLayer === 'sector') {
          const coord = formatCoordinate(node.planet.coordinate)
          const [, , g] = coord.split(':').map(Number)
          setCurrentLayer('planets')
          setZoom(1)
          setPanX(0)
          setPanY(0)
        } else if (currentLayer === 'planets') {
          // At planet level, show planet details
          onPlanetClick?.(node.planet)
        }
        break
      }
    }
  }

  const resetView = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
    setSelectedPlanet(null)
    setCurrentLayer('galaxy')
    setSelectedQuadrant(null)
    setSelectedSector(null)
  }

  const goBack = () => {
    if (currentLayer === 'planets') {
      setCurrentLayer('sector')
    } else if (currentLayer === 'sector') {
      setCurrentLayer('quadrant')
    } else if (currentLayer === 'quadrant') {
      setCurrentLayer('galaxy')
      setSelectedQuadrant(null)
    }
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex gap-2">
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
            onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.3))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={currentLayer === 'galaxy'}
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConnections(!showConnections)}
          >
            <Navigation className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterType(prev => 
              prev === 'all' ? 'colonized' : prev === 'colonized' ? 'available' : 'all'
            )}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Badge variant="outline" className="bg-black/50 text-white">
          <Compass className="w-3 h-3 mr-1" />
          {currentLayer.charAt(0).toUpperCase() + currentLayer.slice(1)}
        </Badge>
        <Badge variant="outline" className="bg-black/50 text-white">
          <MapPin className="w-3 h-3 mr-1" />
          {filteredNodes.length} Nodes
        </Badge>
        {selectedQuadrant && (
          <Badge variant="outline" className="bg-black/50 text-white">
            Q{selectedQuadrant}
          </Badge>
        )}
        {selectedSector && (
          <Badge variant="outline" className="bg-black/50 text-white">
            S{selectedSector}
          </Badge>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full rounded-lg border border-cyan/20 cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
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
            
            {/* Additional stats for planet level */}
            {currentLayer === 'planets' && (
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Population:</span>
                  <span>{(hoveredPlanet as any).population ?? 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resources:</span>
                  <span>T: {(hoveredPlanet as any).tellerium ?? (hoveredPlanet as any).tellerium_balance ?? 0} K: {(hoveredPlanet as any).krypton ?? (hoveredPlanet as any).krypton_balance ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Defense:</span>
                  <span>{(hoveredPlanet as any).defense_rating ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Facilities:</span>
                  <span>{hoveredPlanet.facilities?.length || 0}</span>
                </div>
              </div>
            )}
            
            {/* Layer-specific instructions */}
            <div className="mt-2 text-xs text-muted-foreground">
              {currentLayer === 'galaxy' && 'Click to explore quadrant'}
              {currentLayer === 'quadrant' && 'Click to explore sector'}
              {currentLayer === 'sector' && 'Click to explore galaxy'}
              {currentLayer === 'planets' && 'Click to view planet details'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="absolute bottom-4 right-4 z-10 panel-glass border-muted/20 max-w-xs">
        <CardContent className="pt-4">
          <h4 className="font-semibold mb-2 text-sm">
            {currentLayer === 'galaxy' && 'Galaxy View'}
            {currentLayer === 'quadrant' && 'Quadrant View'}
            {currentLayer === 'sector' && 'Sector View'}
            {currentLayer === 'planets' && 'Planet View'}
          </h4>
          <div className="space-y-1 text-xs">
            {currentLayer === 'galaxy' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span>Quadrant (Colonized)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span>Quadrant (Available)</span>
                </div>
              </>
            )}
            {currentLayer === 'quadrant' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                  <span>Quadrant Center</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span>Sector (Colonized)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span>Sector (Available)</span>
                </div>
              </>
            )}
            {currentLayer === 'sector' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span>Galaxy (Colonized)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span>Galaxy (Available)</span>
                </div>
              </>
            )}
            {currentLayer === 'planets' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                  <span>Galaxy Center</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Colonized Planet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span>Available Planet</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-400"></div>
              <span>Connections</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-orange-400" />
              <span>Active Routes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
