import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetPlanetDefencesQuery } from '@/api/endpoints/defencesApi'
import { useGetBuildableItemsQuery, useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Facility, Defence } from '@/types/api.types'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'

interface HexagonalGridProps {
  planetId: number
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
}

interface HexagonPosition {
  id: number
  x: number
  y: number
  facility?: Facility | null
  defence?: Defence | null
}

export function HexagonalGrid({ planetId, size = 'xxlarge' }: HexagonalGridProps) {
  const [hoveredHexId, setHoveredHexId] = useState<number | null>(null)
  const { openPanel } = usePanel()

  // Fetch built facilities and defenses
  const { data: planetData } = useGetPlanetQuery(planetId) // Get planet data which includes facilities
  const { data: facilitiesData } = useGetPlanetFacilitiesQuery(planetId)
  const { data: defencesData } = useGetPlanetDefencesQuery(planetId)
  const { data: buildableItemsData } = useGetBuildableItemsQuery(planetId)
  
  console.log('🔍 Raw planetData:', planetData)
  console.log('🔍 Raw facilitiesData:', facilitiesData)
  console.log('🔍 Raw defencesData:', defencesData)

  // Calculate planet era from buildable items
  const planetEra = useMemo(() => {
    if (!buildableItemsData) return 1
    
    // Safely spread only arrays
    const facilities = Array.isArray(buildableItemsData.facilities) ? buildableItemsData.facilities : []
    const research = Array.isArray(buildableItemsData.research) ? buildableItemsData.research : []
    const ships = Array.isArray(buildableItemsData.ships) ? buildableItemsData.ships : []
    const defences = Array.isArray(buildableItemsData.defences) ? buildableItemsData.defences : []
    
    const allItems = [
      ...facilities,
      ...research,
      ...ships,
      ...defences,
    ]
    
    const eras = allItems
      .map(item => item.era)
      .filter((era): era is number => era !== undefined)
    
    return eras.length > 0 ? Math.max(...eras) : 1
  }, [buildableItemsData])

  // Calculate hexagon count for round shape over planet
  const hexagonCount = useMemo(() => {
    // Use a fixed number of rings to create a nice round shape
    // Ring 0: 1 hexagon (center)
    // Ring 1: 6 hexagons
    // Ring 2: 12 hexagons
    // Ring 3: 18 hexagons
    // Total: 37 hexagons for 3 rings
    const rings = 3
    let count = 1 // Center
    for (let i = 1; i <= rings; i++) {
      count += 6 * i
    }
    return count // 37 hexagons for 3 rings
  }, [])

  // Size mapping
  const sizeMapping = useMemo(() => {
    const baseSize = size === 'xxlarge' ? 730 : 
                     size === 'xlarge' ? 384 :
                     size === 'large' ? 256 :
                     size === 'medium' ? 192 : 128
    
    return {
      containerSize: baseSize,
      hexRadius: baseSize * 0.10, // Hexagon radius as percentage of container (reduced by 20px equivalent)
    }
  }, [size])

  // Generate hexagon positions in honeycomb pattern
  const hexagonPositions = useMemo<HexagonPosition[]>(() => {
    const positions: HexagonPosition[] = []
    const hexRadius = sizeMapping.hexRadius
    const hexWidth = Math.sqrt(3) * hexRadius
    const hexHeight = hexRadius * 1.5 // Vertical spacing between hexagons
    
    // Center hexagon
    positions.push({
      id: 0,
      x: sizeMapping.containerSize / 2,
      y: sizeMapping.containerSize / 2,
    })
    
    let hexId = 1
    // Generate rings around center - fixed 3 rings for round shape
    const rings = 3
    for (let ring = 1; ring <= rings; ring++) {
      const ringRadius = hexWidth * ring * 1.0 // Standard honeycomb spacing
      const hexCountInRing = 6 * ring
      
      for (let i = 0; i < hexCountInRing && hexId < hexagonCount; i++) {
        const angle = (Math.PI * 2 * i) / hexCountInRing
        positions.push({
          id: hexId,
          x: sizeMapping.containerSize / 2 + Math.cos(angle) * ringRadius,
          y: sizeMapping.containerSize / 2 + Math.sin(angle) * ringRadius,
        })
        hexId++
      }
    }
    
    // Distribute facilities and defenses across hexagons
    // Try planet data first (includes facilities inline), fallback to dedicated endpoint
    const planetFacilities = planetData?.planet?.facilities
    const facilitiesFromPlanet = Array.isArray(planetFacilities) 
      ? planetFacilities.map((fac: any) => ({
          facility_slug: fac.slug || fac.facility_slug,
          level: fac.level,
          is_active: fac.is_active !== false,
          definition: { 
            name: fac.name || fac.slug || fac.facility_slug || 'Facility', 
            description: fac.description || '' 
          }
        } as Facility))
      : typeof planetFacilities === 'object' && planetFacilities !== null
        ? Object.entries(planetFacilities).map(([slug, level]) => ({
            facility_slug: slug,
            level: level as number,
            is_active: true,
            definition: { name: slug, description: '' }
          } as Facility))
        : []
    
    const facilitiesRaw = facilitiesData?.facilities
    const facilitiesFromEndpoint: Facility[] = Array.isArray(facilitiesRaw) 
      ? facilitiesRaw 
      : typeof facilitiesRaw === 'object' && facilitiesRaw !== null
        ? (Object.values(facilitiesRaw) as Facility[])
        : []
    
    // Use planet data if endpoint is empty
    const facilities = facilitiesFromEndpoint.length > 0 ? facilitiesFromEndpoint : facilitiesFromPlanet
    
    const defencesRaw = defencesData?.defences
    const defences: Defence[] = Array.isArray(defencesRaw)
      ? defencesRaw
      : typeof defencesRaw === 'object' && defencesRaw !== null
        ? (Object.values(defencesRaw) as Defence[])
        : []
    
    console.log('🔍 Grid debug - Planet facilities:', facilitiesFromPlanet.length, facilitiesFromPlanet)
    console.log('🔍 Grid debug - Endpoint facilities:', facilitiesFromEndpoint.length, facilitiesFromEndpoint)
    console.log('🔍 Grid debug - Final facilities:', facilities.length, facilities)
    console.log('🔍 Grid debug - Defences:', defences.length, defences)
    
    // Fill hexagons with built items - mix facilities and defences together
    const allItems: Array<{ facility?: Facility; defence?: Defence }> = []
    
    // Add all facilities
    facilities.forEach(fac => {
      allItems.push({ facility: fac })
    })
    
    // Add all defences
    defences.forEach(def => {
      allItems.push({ defence: def })
    })
    
    // Distribute items across hexagons starting from index 0
    allItems.forEach((item, idx) => {
      if (idx < positions.length) {
        if (item.facility) {
          positions[idx].facility = item.facility
        } else if (item.defence) {
          positions[idx].defence = item.defence
        }
      }
    })
    
    return positions
  }, [planetEra, hexagonCount, sizeMapping, facilitiesData, defencesData])

  const hexPath = useMemo(() => {
    const radius = sizeMapping.hexRadius
    const vertices = 6
    const path = []
    
    for (let i = 0; i < vertices; i++) {
      const angle = (Math.PI / 3) * i
      const x = radius * Math.cos(angle - Math.PI / 6)
      const y = radius * Math.sin(angle - Math.PI / 6)
      path.push(`${i === 0 ? 'M' : 'L'} ${x},${y}`)
    }
    
    return path.join(' ') + ' Z'
  }, [sizeMapping.hexRadius])

  return (
    <div 
      className="absolute z-20"
      style={{ 
        width: sizeMapping.containerSize, 
        height: sizeMapping.containerSize,
        left: 0,
        top: '280px', // Move grid down to align with planet
      }}
    >
      <svg
        width={sizeMapping.containerSize}
        height={sizeMapping.containerSize}
      >
        {/* Render hexagons */}
        {hexagonPositions.map((hex) => {
          const isOccupied = hex.facility || hex.defence
          const isHovered = hoveredHexId === hex.id
          
          return (
            <g key={hex.id}>
              {/* Empty hexagon - highly blurred */}
              {!isOccupied && (
                <path
                  d={hexPath}
                  transform={`translate(${hex.x}, ${hex.y})`}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={2}
                  fill="rgba(0, 0, 0, 0.1)"
                  style={{
                    filter: 'blur(4px)',
                  }}
                />
              )}
              
              {/* Occupied hexagon - glass effect */}
              {isOccupied && (
                <path
                  d={hexPath}
                  transform={`translate(${hex.x}, ${hex.y})`}
                  className={cn(
                    "cursor-pointer pointer-events-auto"
                  )}
                  strokeWidth={3}
                  fill={hex.facility ? "rgba(6, 182, 212, 0.3)" : "rgba(239, 68, 68, 0.3)"}
                  stroke={hex.facility ? "rgba(6, 182, 212, 0.8)" : "rgba(239, 68, 68, 0.8)"}
                  onMouseEnter={() => setHoveredHexId(hex.id)}
                  onMouseLeave={() => setHoveredHexId(null)}
                  onClick={() => {
                    if (hex.facility) {
                      openPanel(PanelType.BUILD_DETAIL, PanelSize.MEDIUM, {
                        type: 'facility',
                        slug: hex.facility.facility_slug,
                        planetId,
                      })
                    } else if (hex.defence) {
                      openPanel(PanelType.BUILD_DETAIL, PanelSize.MEDIUM, {
                        type: 'defense',
                        slug: hex.defence.defence_slug,
                        planetId,
                      })
                    }
                  }}
                >
                  <title>{hex.facility?.definition.name || hex.defence?.definition.name || 'Empty'}</title>
                </path>
              )}
            </g>
          )
        })}
      </svg>
      
      {/* Hover popover */}
      {hoveredHexId !== null && (() => {
        const hex = hexagonPositions[hoveredHexId]
        if (!hex.facility && !hex.defence) return null
        
        return (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: hex.x + 40,
              top: hex.y - 20,
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
                  {hex.facility?.definition.name || hex.defence?.definition.name}
                </div>
                {hex.facility && (
                  <div className="text-xs text-muted-foreground">
                    Level {hex.facility.level}
                  </div>
                )}
                {hex.defence && (
                  <div className="text-xs text-muted-foreground">
                    {hex.defence.quantity}x
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

