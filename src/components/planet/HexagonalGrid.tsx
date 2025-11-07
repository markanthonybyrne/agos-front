import { useMemo, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetPlanetDefencesQuery } from '@/api/endpoints/defencesApi'
import { useGetBuildableItemsQuery, useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'
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
  const { data: meData } = useGetMeQuery() // Get facilities from auth/me for nice names
  
  console.log('🔍 Raw planetData:', planetData)
  console.log('🔍 Raw facilitiesData:', facilitiesData)
  console.log('🔍 Raw defencesData:', defencesData)
  console.log('🔍 meData:', meData)
  console.log('🔍 meData facilities:', meData?.facilities)

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

  // Store facilities data in a ref to persist even if meData becomes undefined
  const meFacilitiesRef = useRef<Array<{ slug: string; name: string; level: number; is_active: boolean; built_on?: string | null; description?: string }> | null>(null)
  
  // Update ref when meData has facilities (persist data even if meData becomes undefined)
  useEffect(() => {
    if (meData?.facilities && Array.isArray(meData.facilities) && meData.facilities.length > 0) {
      console.log('💾 Storing', meData.facilities.length, 'facilities in ref for persistence')
      meFacilitiesRef.current = meData.facilities
    }
  }, [meData?.facilities])

  // Create a lookup map for facility definitions from buildable items and auth/me
  const facilityDefinitionsMap = useMemo(() => {
    const map = new Map<string, { name: string; description: string }>()
    
    console.log('🔍 Building facilityDefinitionsMap')
    console.log('  - meData?.facilities:', meData?.facilities)
    console.log('  - meFacilitiesRef.current:', meFacilitiesRef.current)
    
    // Use ref value (persisted) or current meData value
    const meFacilities = meFacilitiesRef.current || meData?.facilities
    if (meFacilities && Array.isArray(meFacilities)) {
      console.log('✅ Found', meFacilities.length, 'facilities from auth/me')
      meFacilities.forEach((fac) => {
        const slug = fac.slug
        if (slug) {
          map.set(slug, {
            name: fac.name || slug,
            description: fac.description || ''
          })
          console.log(`  - Added: ${slug} -> "${fac.name || slug}"`)
        }
      })
    } else {
      console.log('⚠️ No facilities found. meFacilities:', meFacilities)
    }
    
    // Then, add from buildable items as fallback (might have more complete data)
    const facilities = Array.isArray(buildableItemsData?.facilities) ? buildableItemsData.facilities : []
    facilities.forEach((fac) => {
      if (fac?.slug) {
        // Only add if not already in map (auth/me takes precedence for names)
        if (!map.has(fac.slug)) {
          map.set(fac.slug, {
            name: fac.name || fac.slug,
            description: fac.description || ''
          })
        } else {
          // Update description if buildable items has a better one
          const existing = map.get(fac.slug)!
          map.set(fac.slug, {
            name: existing.name, // Keep the nice name from auth/me
            description: fac.description || existing.description
          })
        }
      }
    })
    
    console.log('🔍 Facility definitions map (total entries):', map.size)
    console.log('🔍 Facility definitions map entries:', Array.from(map.entries()))
    console.log('🔍 Auth/me facilities count:', meFacilities?.length || 0)
    console.log('🔍 Buildable facilities count:', facilities.length)
    return map
  }, [buildableItemsData, meData])

  // Generate hexagon positions in honeycomb pattern
  const hexagonPositions = useMemo<HexagonPosition[]>(() => {
    const positions: HexagonPosition[] = []
    const hexRadius = sizeMapping.hexRadius
    const hexWidth = Math.sqrt(3) * hexRadius
    
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
      : typeof planetFacilities === 'object' && planetFacilities !== null
        ? Object.entries(planetFacilities).map(([slug, level]) => {
            const definition = facilityDefinitionsMap.get(slug) || { 
              name: slug, 
              description: '' 
            }
            return {
              facility_slug: slug,
              level: level as number,
              is_active: true,
              definition
            } as Facility
          })
        : []
    
    const facilitiesRaw = facilitiesData?.facilities
    const facilitiesFromEndpoint: Facility[] = Array.isArray(facilitiesRaw) 
      ? facilitiesRaw.map((fac: Facility) => {
          // Always use lookup map first (has correct names from auth/me and buildable items)
          const lookupDef = facilityDefinitionsMap.get(fac.facility_slug)
          const existingDef = fac.definition
          
          // Priority: lookup map > existing definition > slug fallback
          const definition = lookupDef || existingDef || {
            name: fac.facility_slug,
            description: (existingDef as { description?: string })?.description || ''
          }
          
          if (!lookupDef) {
            console.log('⚠️ No lookup found for facility slug:', fac.facility_slug, 'Available slugs:', Array.from(facilityDefinitionsMap.keys()))
          } else {
            console.log('✅ Using nice name from lookup for:', fac.facility_slug, '->', definition.name)
          }
          
          return {
            ...fac,
            definition
          } as Facility
        })
      : typeof facilitiesRaw === 'object' && facilitiesRaw !== null
        ? (Object.values(facilitiesRaw) as Facility[]).map((fac: Facility) => {
            const lookupDef = facilityDefinitionsMap.get(fac.facility_slug)
            const existingDef = fac.definition
            const definition = lookupDef || existingDef || {
              name: fac.facility_slug,
              description: (existingDef as { description?: string })?.description || ''
            }
            return {
              ...fac,
              definition
            } as Facility
          })
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
    console.log('🔍 Grid debug - Facility names check:')
    facilities.forEach((fac) => {
      console.log(`  - ${fac.facility_slug}: definition.name = "${fac.definition?.name}"`)
    })
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
  }, [hexagonCount, sizeMapping, facilitiesData, defencesData, planetData, facilityDefinitionsMap])

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
      className="relative"
      style={{ 
        width: sizeMapping.containerSize, 
        height: sizeMapping.containerSize,
        pointerEvents: 'auto'
      }}
    >
      <svg
        width={sizeMapping.containerSize}
        height={sizeMapping.containerSize}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Render hexagons */}
        {hexagonPositions.map((hex) => {
          const isOccupied = hex.facility || hex.defence
          
          return (
            <g key={hex.id}>
              {/* Empty hexagon - visible but subtle */}
              {!isOccupied && (
                <path
                  d={hexPath}
                  transform={`translate(${hex.x}, ${hex.y})`}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth={1.5}
                  fill="rgba(0, 0, 0, 0.05)"
                  style={{
                    filter: 'blur(2px)',
                    pointerEvents: 'none'
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

