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

const GEODESIC_FREQUENCY = 3

type Vertex3 = { x: number; y: number; z: number }

function dot(a: Vertex3, b: Vertex3) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function cross(a: Vertex3, b: Vertex3): Vertex3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function subtract(a: Vertex3, b: Vertex3): Vertex3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function createIcosahedron(): { vertices: Vertex3[]; faces: number[][] } {
  const t = (1 + Math.sqrt(5)) / 2

  const rawVertices: Vertex3[] = [
    { x: -1, y: t, z: 0 },
    { x: 1, y: t, z: 0 },
    { x: -1, y: -t, z: 0 },
    { x: 1, y: -t, z: 0 },
    { x: 0, y: -1, z: t },
    { x: 0, y: 1, z: t },
    { x: 0, y: -1, z: -t },
    { x: 0, y: 1, z: -t },
    { x: t, y: 0, z: -1 },
    { x: t, y: 0, z: 1 },
    { x: -t, y: 0, z: -1 },
    { x: -t, y: 0, z: 1 },
  ]

  const vertices = rawVertices.map(normalize)

  const faces: number[][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ]

  return { vertices, faces }
}

function generateGeodesicSphere(frequency = GEODESIC_FREQUENCY) {
  const { vertices: baseVertices, faces: baseFaces } = createIcosahedron()

  const vertexMap = new Map<string, number>()
  const vertices: Vertex3[] = []
  const faces: number[][] = []

  function addVertex(point: Vertex3): number {
    const normalizedPoint = normalize(point)
    const key = `${normalizedPoint.x.toFixed(6)}|${normalizedPoint.y.toFixed(6)}|${normalizedPoint.z.toFixed(6)}`
    const existing = vertexMap.get(key)
    if (existing !== undefined) return existing
    const idx = vertices.length
    vertices.push(normalizedPoint)
    vertexMap.set(key, idx)
    return idx
  }

  baseFaces.forEach((face) => {
    const [aIdx, bIdx, cIdx] = face
    const a = baseVertices[aIdx]
    const b = baseVertices[bIdx]
    const c = baseVertices[cIdx]

    const indexRows: number[][] = []

    for (let i = 0; i <= frequency; i++) {
      const row: number[] = []
      for (let j = 0; j <= frequency - i; j++) {
        const k = frequency - i - j
        const point = {
          x: (a.x * i + b.x * j + c.x * k) / frequency,
          y: (a.y * i + b.y * j + c.y * k) / frequency,
          z: (a.z * i + b.z * j + c.z * k) / frequency,
        }
        row.push(addVertex(point))
      }
      indexRows.push(row)
    }

    for (let i = 0; i < frequency; i++) {
      for (let j = 0; j < frequency - i; j++) {
        const v1 = indexRows[i][j]
        const v2 = indexRows[i + 1][j]
        const v3 = indexRows[i][j + 1]
        faces.push([v1, v2, v3])

        if (j < frequency - i - 1) {
          const v4 = indexRows[i + 1][j + 1]
          faces.push([v2, v4, v3])
        }
      }
    }
  })

  const faceCenters = faces.map((face) => {
    const [i0, i1, i2] = face
    const v0 = vertices[i0]
    const v1 = vertices[i1]
    const v2 = vertices[i2]
    return normalize({
      x: (v0.x + v1.x + v2.x) / 3,
      y: (v0.y + v1.y + v2.y) / 3,
      z: (v0.z + v1.z + v2.z) / 3,
    })
  })

  const vertexFaces: number[][] = Array.from({ length: vertices.length }, () => [])
  faces.forEach((face, faceIndex) => {
    face.forEach((vertexIndex) => {
      vertexFaces[vertexIndex].push(faceIndex)
    })
  })

  function sortFaceCentersAroundVertex(center: Vertex3, faceIndices: number[]) {
    if (faceIndices.length === 0) return [] as Vertex3[]

    const normal = normalize(center)
    const reference = Math.abs(normal.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
    let tangent = cross(reference, normal)
    const tangentLength = Math.sqrt(dot(tangent, tangent))
    if (tangentLength < 1e-6) {
      tangent = cross({ x: 0, y: 0, z: 1 }, normal)
    }
    tangent = normalize(tangent)
    const bitangent = cross(normal, tangent)

    return faceIndices
      .map((faceIndex) => faceCenters[faceIndex])
      .map((point) => {
        const diff = subtract(point, {
          x: normal.x * dot(point, normal),
          y: normal.y * dot(point, normal),
          z: normal.z * dot(point, normal),
        })
        const u = dot(diff, tangent)
        const v = dot(diff, bitangent)
        const angle = Math.atan2(v, u)
        return { point, angle }
      })
      .sort((a, b) => a.angle - b.angle)
      .map(({ point }) => point)
  }

  let cellId = 0
  const cells: GridCell[] = []

  vertexFaces.forEach((facesForVertex, vertexIndex) => {
    if (facesForVertex.length < 5) {
      return
    }

    const center = vertices[vertexIndex]
    const polygonVertices = sortFaceCentersAroundVertex(center, facesForVertex)
    const uniqueVertices = polygonVertices.filter((vertex, index, array) => {
      const key = `${vertex.x.toFixed(6)}|${vertex.y.toFixed(6)}|${vertex.z.toFixed(6)}`
      return (
        index ===
        array.findIndex((v) => `${v.x.toFixed(6)}|${v.y.toFixed(6)}|${v.z.toFixed(6)}` === key)
      )
    })

    if (uniqueVertices.length < 5) {
      return
    }

    cells.push({
      id: cellId++,
      vertices: uniqueVertices,
      projected: [],
      center,
      projectedCenter: { x: 0, y: 0 },
      isPentagon: uniqueVertices.length === 5,
    })
  })

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
  
  // Project cells to 2D and sort by distance from center for wave effect
  const projectedCells = useMemo(() => {
    const viewportSize = planetSize
    const centerX = planetSize / 2
    const centerY = planetSize / 2
    
    return gridCells
      .map(cell => {
        const projected = cell.vertices.map(v => project3D(v, planetSize, viewportSize))
        const projectedCenter = project3D(cell.center, planetSize, viewportSize)
        
        // Calculate distance from center for wave animation
        const dx = projectedCenter.x - centerX
        const dy = projectedCenter.y - centerY
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)
        
        return {
          ...cell,
          projected,
          projectedCenter,
          distanceFromCenter
        }
      })
      .filter(cell => {
        // Show front hemisphere
        return cell.center.z > -0.3
      })
      .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter) // Sort by distance for wave effect
  }, [gridCells, planetSize])
  
  return (
    <div 
      className="absolute inset-0 z-20"
      style={{
        width: planetSize,
        height: planetSize,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)', // Centered
        pointerEvents: 'auto',
        opacity: 0,
        animation: 'hexGridAppear 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards',
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
                  "transition-all duration-200 cursor-pointer hex-grid-line",
                  isOccupied && "stroke-cyan-400"
                )}
                style={{
                  filter: isOccupied 
                    ? 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.8))' 
                    : 'none',
                  animationDelay: `${0.8 + (cell.distanceFromCenter / 50) * 0.1}s`,
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
