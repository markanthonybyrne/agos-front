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
  planetSize: number
}

interface GridCell {
  id: number
  vertices: Array<{ x: number; y: number; z: number }>
  projected: Array<{ x: number; y: number }>
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

// Simple geodesic sphere using spherical coordinates
function generateGeodesicSphere() {
  const cells: GridCell[] = []
  let cellId = 0
  
  // Icosahedron vertices (12 points where pentagons will be)
  const t = (1.0 + Math.sqrt(5.0)) / 2.0
  const pentagonCenters = [
    normalize({ x: -1, y: t, z: 0 }),
    normalize({ x: 1, y: t, z: 0 }),
    normalize({ x: -1, y: -t, z: 0 }),
    normalize({ x: 1, y: -t, z: 0 }),
    normalize({ x: 0, y: -1, z: t }),
    normalize({ x: 0, y: 1, z: t }),
    normalize({ x: 0, y: -1, z: -t }),
    normalize({ x: 0, y: 1, z: -t }),
    normalize({ x: t, y: 0, z: -1 }),
    normalize({ x: t, y: 0, z: 1 }),
    normalize({ x: -t, y: 0, z: -1 }),
    normalize({ x: -t, y: 0, z: 1 }),
  ]
  
  // Check if a point is near a pentagon center
  function isNearPentagon(point: { x: number; y: number; z: number }, threshold = 0.3): boolean {
    return pentagonCenters.some(pent => {
      const dx = point.x - pent.x
      const dy = point.y - pent.y
      const dz = point.z - pent.z
      return Math.sqrt(dx*dx + dy*dy + dz*dz) < threshold
    })
  }
  
  // Generate cells using rings
  const rings = 8 // Number of latitude rings
  const radius = 1.0
  
  for (let ring = 0; ring < rings; ring++) {
    const theta = (Math.PI * ring) / (rings - 1) // 0 to PI
    const ringRadius = Math.sin(theta)
    const y = Math.cos(theta)
    
    if (ringRadius < 0.15) continue // Skip very small rings near poles
    
    // Calculate number of cells around this ring
    const cellSize = 0.18 // Size of each cell
    const circumference = 2 * Math.PI * ringRadius
    const cellCount = Math.max(6, Math.floor(circumference / (cellSize * Math.sqrt(3))))
    
    for (let i = 0; i < cellCount; i++) {
      const phi = (2 * Math.PI * i) / cellCount
      
      // Calculate cell center
      const centerX = ringRadius * Math.cos(phi)
      const centerZ = ringRadius * Math.sin(phi)
      const center = normalize({ x: centerX, y, z: centerZ })
      
      // Check if this should be a pentagon
      const isPentagon = isNearPentagon(center)
      const sides = isPentagon ? 5 : 6
      
      // Generate vertices around center in local tangent plane
      const vertices: Array<{ x: number; y: number; z: number }> = []
      
      // Tangent vectors for this point
      const tangentEast = normalize({ 
        x: -Math.sin(phi), 
        y: 0, 
        z: Math.cos(phi) 
      })
      
      const tangentNorth = normalize({
        x: -Math.cos(theta) * Math.cos(phi),
        y: Math.sin(theta),
        z: -Math.cos(theta) * Math.sin(phi)
      })
      
      // Generate vertices
      for (let v = 0; v < sides; v++) {
        const angle = (2 * Math.PI * v) / sides
        // Rotate for flat-top hexagons
        const rotatedAngle = angle + Math.PI / 6
        
        const localX = cellSize * Math.cos(rotatedAngle)
        const localY = cellSize * Math.sin(rotatedAngle)
        
        // Transform to world coordinates
        const worldX = centerX + localX * tangentEast.x + localY * tangentNorth.x
        const worldY = y + localX * tangentEast.y + localY * tangentNorth.y
        const worldZ = centerZ + localX * tangentEast.z + localY * tangentNorth.z
        
        // Project onto sphere
        const vertex = normalize({ x: worldX, y: worldY, z: worldZ })
        vertices.push(vertex)
      }
      
      cells.push({
        id: cellId++,
        vertices,
        projected: [],
        center,
        projectedCenter: { x: 0, y: 0 },
        isPentagon,
      })
    }
  }
  
  return cells
}

// Project 3D point to 2D
function project3D(point: { x: number; y: number; z: number }, 
                  planetSize: number, 
                  viewportSize: number): { x: number; y: number } {
  const scale = planetSize / 2
  return {
    x: point.x * scale + viewportSize / 2,
    y: -point.y * scale + viewportSize / 2
  }
}

export function GeodesicGrid({ planetId, planetSize }: GeodesicGridProps) {
  const [hoveredCellId, setHoveredCellId] = useState<number | null>(null)
  const { openPanel } = usePanel()
  
  // Fetch data
  const { data: planetData } = useGetPlanetQuery(planetId)
  const { data: facilitiesData } = useGetPlanetFacilitiesQuery(planetId)
  const { data: defencesData } = useGetPlanetDefencesQuery(planetId)
  const { data: buildableItemsData } = useGetBuildableItemsQuery(planetId)
  const { data: meData } = useGetMeQuery()
  
  // Store facilities data
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
  
  // Generate geodesic grid
  const gridCells = useMemo(() => {
    const cells = generateGeodesicSphere()
    
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
    
    // Distribute items across cells
    const allItems: Array<{ facility?: Facility; defence?: Defence }> = []
    facilities.forEach(fac => allItems.push({ facility: fac }))
    defences.forEach(def => allItems.push({ defence: def }))
    
    // Sort cells by Z (facing camera)
    const sortedCells = [...cells].sort((a, b) => b.center.z - a.center.z)
    
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
  
  // Project cells to 2D
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
        // Show front hemisphere
        return cell.center.z > -0.3
      })
  }, [gridCells, planetSize])
  
  return (
    <div 
      className="absolute inset-0 z-20 pointer-events-none"
      style={{
        width: planetSize,
        height: planetSize,
        left: '50%',
        top: '50%',
        transform: 'translate(calc(-50% + 60px), -50%)', // Move to the right
      }}
    >
      <svg
        width={planetSize}
        height={planetSize}
        className="pointer-events-none"
      >
        {/* Define clip paths for occupied cells */}
        <defs>
          {projectedCells
            .filter(cell => {
              const hasValidPoints = cell.projected.length > 0 && 
                cell.projected.every(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y))
              if (!hasValidPoints) return false
              
              if (cell.facility || cell.defence) {
                const minX = Math.min(...cell.projected.map(p => p.x))
                const maxX = Math.max(...cell.projected.map(p => p.x))
                const minY = Math.min(...cell.projected.map(p => p.y))
                const maxY = Math.max(...cell.projected.map(p => p.y))
                const width = maxX - minX
                const height = maxY - minY
                return width >= 5 && height >= 5
              }
              return false
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
        
        {/* Render grid cells - simple clean lines */}
        {projectedCells.map((cell) => {
          const isOccupied = cell.facility || cell.defence
          const isHovered = hoveredCellId === cell.id
          
          // Build path string
          const pathData = cell.projected.map((point, idx) => {
            if (idx === 0) {
              return `M ${point.x} ${point.y}`
            }
            return `L ${point.x} ${point.y}`
          }).join(' ') + ' Z'
          
          // Check if polygon has valid points
          const hasValidPoints = cell.projected.length > 0 && 
            cell.projected.every(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y))
          
          if (!hasValidPoints) return null
          
          // Calculate bounding box
          const minX = Math.min(...cell.projected.map(p => p.x))
          const maxX = Math.max(...cell.projected.map(p => p.x))
          const minY = Math.min(...cell.projected.map(p => p.y))
          const maxY = Math.max(...cell.projected.map(p => p.y))
          const width = maxX - minX
          const height = maxY - minY
          
          // Skip if too small
          if (width < 3 || height < 3) return null
          
          // Get image for occupied cells
          const itemImage = cell.facility 
            ? getFacilityImage(cell.facility.facility_slug)
            : cell.defence
            ? getDefenseImage(cell.defence.defence_slug)
            : null
          
          const imageSize = Math.min(width, height) * 0.8
          const imageX = cell.projectedCenter.x - imageSize / 2
          const imageY = cell.projectedCenter.y - imageSize / 2
          
          const clipPathId = `hex-clip-${cell.id}`
          
          return (
            <g key={cell.id} className="pointer-events-auto">
              {/* Clean grid lines - simple white/light lines like the reference image */}
              <path
                d={pathData}
                fill="none"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth={1.5}
                className={cn(
                  "transition-all duration-200 cursor-pointer",
                  isOccupied && "stroke-cyan-400"
                )}
                style={{
                  filter: isOccupied 
                    ? 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.8))' 
                    : 'none',
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
              
              {/* Occupied cell fill */}
              {isOccupied && (
                <path
                  d={pathData}
                  fill={cell.facility 
                    ? "rgba(6, 182, 212, 0.15)" 
                    : "rgba(239, 68, 68, 0.15)"}
                  stroke={cell.facility 
                    ? "rgba(6, 182, 212, 0.9)" 
                    : "rgba(239, 68, 68, 0.9)"}
                  strokeWidth={2}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.6))',
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
                  <title>{cell.facility?.definition?.name || cell.defence?.definition?.name || 'Empty'}</title>
                </path>
              )}
              
              {/* Item image */}
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
                  fill="rgba(34, 211, 238, 0.15)"
                  stroke="rgba(34, 211, 238, 1)"
                  strokeWidth={2.5}
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
                  {cell.facility?.definition?.name || cell.defence?.definition?.name || 'Unknown'}
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
