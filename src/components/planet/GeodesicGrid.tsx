import { useMemo, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetPlanetDefencesQuery } from '@/api/endpoints/defencesApi'
import { useGetBuildableItemsQuery, useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { Facility, Defence } from '@/types/api.types'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { getFacilityImage } from '@/lib/facilityImages'
import { getDefenseImage } from '@/lib/defenseImages'

interface GeodesicGridProps {
  planetId: number
  planetSize: number // Size of the planet image in pixels
}

interface GridCell {
  id: number
  vertices: Array<{ x: number; y: number; z: number }> // 3D vertices
  projected: Array<{ x: number; y: number }> // 2D projected vertices
  center: { x: number; y: number; z: number }
  projectedCenter: { x: number; y: number }
  facility?: Facility | null
  defence?: Defence | null
  isPentagon?: boolean
}

function normalize(v: { x: number; y: number; z: number }) {
  const len = Math.sqrt(v.x**2 + v.y**2 + v.z**2)
  return len > 0 ? { x: v.x/len, y: v.y/len, z: v.z/len } : v
}

// Generate geodesic sphere with hexagonal grid pattern
function generateGeodesicSphere(subdivisions: number = 4) {
  const cells: GridCell[] = []
  const radius = 1.0
  const cellSize = 0.15 // Fine-tuned for complete coverage with clean spacing
  
  // Create more rings for full planet coverage
  const rings = subdivisions * 5 + 1 // Increased rings for better coverage
  let cellId = 0
  
  for (let ring = 0; ring < rings; ring++) {
    const theta = (Math.PI * ring) / (rings - 1) // 0 to PI (latitude)
    const ringRadius = Math.sin(theta) // Radius at this latitude
    const ringY = Math.cos(theta) // Y position
    
    // Skip only very small rings near poles
    if (ringRadius < 0.1) continue
    
    // Calculate spacing for full coverage
    // For hexagons: horizontal spacing ≈ √3 * radius for proper tiling
    // Reduced gap slightly to ensure complete coverage
    const hexagonSpacing = cellSize * Math.sqrt(3) * 1.05 // 5% gap for tight but clean coverage
    const circumference = 2 * Math.PI * ringRadius
    const idealCellCount = Math.max(8, Math.floor(circumference / hexagonSpacing))
    // Slightly increase max cells to ensure full coverage
    const maxCellCount = Math.floor(ringRadius * 16) // Increased slightly for complete coverage
    const cellCount = Math.min(idealCellCount, maxCellCount)
    
    // Create cells around this latitude ring
    for (let i = 0; i < cellCount; i++) {
      const phi = (2 * Math.PI * i) / cellCount // Longitude angle
      
      // Calculate cell center position on sphere
      const centerX = ringRadius * Math.cos(phi)
      const centerZ = ringRadius * Math.sin(phi)
      const center = normalize({ x: centerX, y: ringY, z: centerZ })
      
      // Create hexagon vertices (always hexagons for consistency)
      // Rotate hexagons to be flat-top (horizontal) relative to the sphere's surface
      const vertexCount = 6
      const vertices: Array<{ x: number; y: number; z: number }> = []
      // Use consistent cell size for simplicity
      const adaptiveCellSize = cellSize
      
      // For flat-top hexagons, rotate by 30 degrees (π/6)
      const rotationOffset = Math.PI / 6
      
      // Calculate tangent vectors for this point on the sphere
      // These define the local coordinate system on the sphere surface
      
      // Tangent vector pointing "east" (along longitude) - normalized
      const tangentEast = normalize({ 
        x: -Math.sin(phi), 
        y: 0, 
        z: Math.cos(phi) 
      })
      
      // Tangent vector pointing "north" (along latitude) - normalized
      const tangentNorth = normalize({
        x: -Math.cos(theta) * Math.cos(phi),
        y: Math.sin(theta),
        z: -Math.cos(theta) * Math.sin(phi)
      })
      
      // Generate hexagon vertices in the tangent plane
      for (let v = 0; v < vertexCount; v++) {
        const baseAngle = (Math.PI * 2 * v) / vertexCount
        const vertexAngle = baseAngle + rotationOffset
        
        // Calculate vertex position in local tangent plane coordinates
        const localX = adaptiveCellSize * Math.cos(vertexAngle)
        const localY = adaptiveCellSize * Math.sin(vertexAngle)
        
        // Transform from tangent plane to world coordinates
        // Add the offset to the center position
        const worldX = centerX + localX * tangentEast.x + localY * tangentNorth.x
        const worldY = ringY + localX * tangentEast.y + localY * tangentNorth.y
        const worldZ = centerZ + localX * tangentEast.z + localY * tangentNorth.z
        
        // Project onto sphere surface (normalize to unit sphere)
        // This ensures vertices lie on the sphere surface
        // Use a slightly larger radius to maintain hexagon shape better
        const vertex = normalize({ x: worldX, y: worldY, z: worldZ })
        vertices.push(vertex)
      }
      
      cells.push({
        id: cellId++,
        vertices,
        projected: [],
        center,
        projectedCenter: { x: 0, y: 0 },
        isPentagon: false
      })
    }
  }
  
  return cells
}

// Project 3D point onto 2D screen (orthographic projection)
function project3D(point: { x: number; y: number; z: number }, 
                  planetSize: number, 
                  viewportSize: number): { x: number; y: number } {
  // Simple orthographic projection (x, y are screen coords, z is depth)
  const scale = planetSize / 2
  return {
    x: point.x * scale + viewportSize / 2,
    y: -point.y * scale + viewportSize / 2 // Flip Y axis
  }
}

export function GeodesicGrid({ planetId, planetSize }: GeodesicGridProps) {
  const [hoveredCellId, setHoveredCellId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { openPanel } = usePanel()
  
  // Fetch built facilities and defenses
  const { data: planetData } = useGetPlanetQuery(planetId)
  const { data: facilitiesData } = useGetPlanetFacilitiesQuery(planetId)
  const { data: defencesData } = useGetPlanetDefencesQuery(planetId)
  const { data: buildableItemsData } = useGetBuildableItemsQuery(planetId)
  const { data: meData } = useGetMeQuery()
  
  // Store facilities data in a ref
  const meFacilitiesRef = useRef<Array<{ slug: string; name: string; level: number; is_active: boolean; built_on?: string | null; description?: string }> | null>(null)
  
  useEffect(() => {
    if (meData?.facilities && Array.isArray(meData.facilities) && meData.facilities.length > 0) {
      meFacilitiesRef.current = meData.facilities
    }
  }, [meData?.facilities])
  
  // Create facility definitions map
  const facilityDefinitionsMap = useMemo(() => {
    const map = new Map<string, { name: string; description: string }>()
    
    const meFacilities = meFacilitiesRef.current || meData?.facilities
    if (meFacilities && Array.isArray(meFacilities)) {
      meFacilities.forEach((fac) => {
        if (fac.slug) {
          map.set(fac.slug, {
            name: fac.name || fac.slug,
            description: fac.description || ''
          })
        }
      })
    }
    
    const facilities = Array.isArray(buildableItemsData?.facilities) ? buildableItemsData.facilities : []
    facilities.forEach((fac) => {
      if (fac?.slug && !map.has(fac.slug)) {
        map.set(fac.slug, {
          name: fac.name || fac.slug,
          description: fac.description || ''
        })
      }
    })
    
    return map
  }, [buildableItemsData, meData])
  
  // Generate geodesic grid cells
  const gridCells = useMemo(() => {
    const subdivisions = 4 // Balanced for full coverage with clean look
    const cells = generateGeodesicSphere(subdivisions)
    
    // Process facilities and defenses
    const planetFacilities = planetData?.planet?.facilities
    const facilitiesFromPlanet = Array.isArray(planetFacilities) 
      ? planetFacilities.map((fac) => {
          const slug = fac.slug || fac.facility_slug
          const definition = facilityDefinitionsMap.get(slug) || { 
            name: fac.name || slug || 'Facility', 
            description: fac.description || '' 
          }
          return {
            facility_slug: slug,
            level: fac.level,
            is_active: fac.is_active !== false,
            definition
          } as Facility
        })
      : []
    
    const facilitiesRaw = facilitiesData?.facilities
    const facilitiesFromEndpoint: Facility[] = Array.isArray(facilitiesRaw) 
      ? facilitiesRaw.map((fac: Facility) => {
          const lookupDef = facilityDefinitionsMap.get(fac.facility_slug)
          const existingDef = fac.definition
          const definition = lookupDef || existingDef || {
            name: fac.facility_slug,
            description: (existingDef as { description?: string })?.description || ''
          }
          return { ...fac, definition } as Facility
        })
      : []
    
    const facilities = facilitiesFromEndpoint.length > 0 ? facilitiesFromEndpoint : facilitiesFromPlanet
    
    const defencesRaw = defencesData?.defences
    const defences: Defence[] = Array.isArray(defencesRaw)
      ? defencesRaw
      : typeof defencesRaw === 'object' && defencesRaw !== null
        ? (Object.values(defencesRaw) as Defence[])
        : []
    
    // Distribute items across cells - spread them evenly
    const allItems: Array<{ facility?: Facility; defence?: Defence }> = []
    facilities.forEach(fac => allItems.push({ facility: fac }))
    defences.forEach(def => allItems.push({ defence: def }))
    
    // Distribute items evenly across visible cells (prefer those facing camera)
    const sortedCells = [...cells].sort((a, b) => {
      // Prioritize cells with positive Z (facing camera)
      return b.center.z - a.center.z
    })
    
    allItems.forEach((item, idx) => {
      const targetCell = sortedCells[idx % sortedCells.length]
      if (item.facility) {
        targetCell.facility = item.facility
      } else if (item.defence) {
        targetCell.defence = item.defence
      }
    })
    
    return cells
  }, [planetData, facilitiesData, defencesData, facilityDefinitionsMap])
  
  // Project cells to 2D and filter to only visible cells
  const projectedCells = useMemo(() => {
    const viewportSize = planetSize
    return gridCells
      .map(cell => {
        const projected = cell.vertices.map(v => project3D(v, planetSize, viewportSize))
        const projectedCenter = project3D(cell.center, planetSize, viewportSize)
        
        return {
          ...cell,
          projected,
          projectedCenter
        }
      })
      .filter(cell => {
        // Show cells on the front hemisphere for full coverage
        // Less restrictive filter to ensure planet surface is covered
        return cell.center.z > -0.5 // Show more of the planet surface
      })
  }, [gridCells, planetSize])
  
  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-20 pointer-events-none"
      style={{
        width: planetSize,
        height: planetSize,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <svg
        width={planetSize}
        height={planetSize}
        className="pointer-events-none"
      >
        {/* Define all clip paths for occupied cells */}
        <defs>
          {projectedCells
            .filter(cell => {
              const hasValidPoints = cell.projected.length === 6 && 
                cell.projected.every(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y))
              if (!hasValidPoints) return false
              
              const minX = Math.min(...cell.projected.map(p => p.x))
              const maxX = Math.max(...cell.projected.map(p => p.x))
              const minY = Math.min(...cell.projected.map(p => p.y))
              const maxY = Math.max(...cell.projected.map(p => p.y))
              const width = maxX - minX
              const height = maxY - minY
              
              return width >= 5 && height >= 5 && (cell.facility || cell.defence)
            })
            .map((cell) => {
              const pathData = cell.projected.map((point, idx) => {
                if (idx === 0) {
                  return `M ${point.x} ${point.y}`
                }
                return `L ${point.x} ${point.y}`
              }).join(' ') + ' Z'
              const clipPathId = `hex-clip-${cell.id}`
              return (
                <clipPath key={clipPathId} id={clipPathId}>
                  <path d={pathData} />
                </clipPath>
              )
            })}
        </defs>
        
        {/* Render grid cells */}
        {projectedCells.map((cell) => {
          const isOccupied = cell.facility || cell.defence
          const isHovered = hoveredCellId === cell.id
          
          // Build path string - ensure proper hexagon shape
          const pathData = cell.projected.map((point, idx) => {
            if (idx === 0) {
              return `M ${point.x} ${point.y}`
            }
            return `L ${point.x} ${point.y}`
          }).join(' ') + ' Z'
          
          // Check if hexagon has valid projected points
          const hasValidPoints = cell.projected.length === 6 && 
            cell.projected.every(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y))
          
          if (!hasValidPoints) return null
          
          // Calculate bounding box to ensure hexagon is visible
          const minX = Math.min(...cell.projected.map(p => p.x))
          const maxX = Math.max(...cell.projected.map(p => p.x))
          const minY = Math.min(...cell.projected.map(p => p.y))
          const maxY = Math.max(...cell.projected.map(p => p.y))
          const width = maxX - minX
          const height = maxY - minY
          
          // Skip if hexagon is too small or degenerate
          if (width < 5 || height < 5) return null // Increased minimum size threshold
          
          // Get image for occupied cells
          const itemImage = cell.facility 
            ? getFacilityImage(cell.facility.facility_slug)
            : cell.defence
            ? getDefenseImage(cell.defence.defence_slug)
            : null
          
          // Calculate image size (80% of hexagon size)
          const imageSize = Math.min(width, height) * 0.8
          const imageX = cell.projectedCenter.x - imageSize / 2
          const imageY = cell.projectedCenter.y - imageSize / 2
          
          // Create clip path ID for this cell
          const clipPathId = `hex-clip-${cell.id}`
          
          return (
            <g key={cell.id} className="pointer-events-auto">
              {/* Grid lines - always visible, bright and glowing */}
              <path
                d={pathData}
                fill="none"
                stroke="rgba(173, 216, 230, 0.5)" // Brighter light blue for visibility
                strokeWidth={isOccupied ? 3 : 2} // Thicker lines
                className={cn(
                  "transition-all duration-200 cursor-pointer",
                  isOccupied && "stroke-cyan-400"
                )}
                style={{
                  filter: isOccupied 
                    ? 'drop-shadow(0 0 6px rgba(34, 211, 238, 1))' 
                    : 'drop-shadow(0 0 3px rgba(173, 216, 230, 0.7))',
                }}
                onMouseEnter={() => setHoveredCellId(cell.id)}
                onMouseLeave={() => setHoveredCellId(null)}
                onClick={() => {
                  if (cell.facility) {
                    openPanel(PanelType.BUILD_DETAIL, PanelSize.MEDIUM, {
                      type: 'facility',
                      slug: cell.facility.facility_slug,
                      planetId,
                    })
                  } else if (cell.defence) {
                    openPanel(PanelType.BUILD_DETAIL, PanelSize.MEDIUM, {
                      type: 'defense',
                      slug: cell.defence.defence_slug,
                      planetId,
                    })
                  }
                }}
              />
              
              {/* Occupied cell fill - visible background */}
              {isOccupied && (
                <path
                  d={pathData}
                  fill={cell.facility 
                    ? "rgba(6, 182, 212, 0.25)" 
                    : "rgba(239, 68, 68, 0.25)"} // More visible fill
                  stroke={cell.facility 
                    ? "rgba(6, 182, 212, 0.9)" 
                    : "rgba(239, 68, 68, 0.9)"} // Brighter stroke
                  strokeWidth={2.5}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))',
                  }}
                  onMouseEnter={() => setHoveredCellId(cell.id)}
                  onMouseLeave={() => setHoveredCellId(null)}
                  onClick={() => {
                    if (cell.facility) {
                      openPanel(PanelType.BUILD_DETAIL, PanelSize.MEDIUM, {
                        type: 'facility',
                        slug: cell.facility.facility_slug,
                        planetId,
                      })
                    } else if (cell.defence) {
                      openPanel(PanelType.BUILD_DETAIL, PanelSize.MEDIUM, {
                        type: 'defense',
                        slug: cell.defence.defence_slug,
                        planetId,
                      })
                    }
                  }}
                >
                  <title>{cell.facility?.definition.name || cell.defence?.definition.name || 'Empty'}</title>
                </path>
              )}
              
              {/* Item image inside hexagon */}
              {isOccupied && itemImage && (
                <image
                  href={itemImage}
                  x={imageX}
                  y={imageY}
                  width={imageSize}
                  height={imageSize}
                  clipPath={`url(#${clipPathId})`}
                  className="pointer-events-none"
                  style={{
                    imageRendering: 'auto',
                    opacity: 0.9,
                  }}
                />
              )}
              
              {/* Hover highlight */}
              {isHovered && isOccupied && (
                <path
                  d={pathData}
                  fill="rgba(34, 211, 238, 0.2)"
                  stroke="rgba(34, 211, 238, 1)"
                  strokeWidth={3}
                  className="pointer-events-none"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 1))',
                  }}
                />
              )}
            </g>
          )
        })}
      </svg>
      
      {/* Hover popover */}
      {hoveredCellId !== null && (() => {
        const cell = projectedCells.find(c => c.id === hoveredCellId)
        if (!cell || (!cell.facility && !cell.defence)) return null
        
        return (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: cell.projectedCenter.x + 40,
              top: cell.projectedCenter.y - 20,
            }}
          >
            <div
              className="panel-glass surface-gradient border-border/20 backdrop-blur-md px-4 py-2"
              style={{
                clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0% 100%)',
              }}
            >
              <div className="text-sm">
                <div className="font-semibold text-foreground mb-1">
                  {cell.facility?.definition.name || cell.defence?.definition.name}
                </div>
                {cell.facility && (
                  <div className="text-xs text-muted-foreground">
                    Level {cell.facility.level}
                  </div>
                )}
                {cell.defence && (
                  <div className="text-xs text-muted-foreground">
                    {cell.defence.quantity}x
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

