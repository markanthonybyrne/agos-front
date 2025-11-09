import { useMemo } from 'react'
import { useGetVisibilityQuery } from '@/api/endpoints/universeApi'
import { Planet } from '@/types/api.types'
import { SystemData, getPlanetRegionAndSystem, calculateRegionBounds } from '@/lib/galaxyUtils'
import { getPlanetXY } from '@/lib/coordinates'
import { getVisibleRegionGeometries, getVisibleSystemGeometries } from '@/lib/visibilityUtils'
import { getRegionAdjacencyBuffer, getSystemRadiusDefault } from '@/lib/geometryDefaults'

interface FogOfWarLayerProps {
  gridWidth: number
  gridHeight: number
  viewportBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  scale: number
  planets?: Planet[] // Planets with fog_of_war data
  systems?: SystemData[] // Systems data - used as fallback for reveals
  homeSystem?: SystemData | null // Home system - always visible, no fog
}

/**
 * FogOfWarLayer - Renders dark cloudy overlay for undiscovered areas
 * Implements three-tier reveal system: region-level, system-level, and planet-level
 */
export function FogOfWarLayer({
  gridWidth,
  gridHeight,
  viewportBounds,
  scale,
  planets = [],
  systems = [],
  homeSystem
}: FogOfWarLayerProps) {
  const { data: visibilityData } = useGetVisibilityQuery()

  // Normalize visibility level for comparison (handle case variations, whitespace, etc.)
  const visibilityLevel = useMemo(() => {
    if (!visibilityData?.visibility_level) return null
    return String(visibilityData.visibility_level).toLowerCase().trim()
  }, [visibilityData?.visibility_level])

  // Check if user has full visibility - check this FIRST before calculating areas
  const hasFullVisibility = useMemo(() => {
    // Check if visibility level indicates full visibility (case-insensitive)
    // Handle variations: 'full', 'Full', 'FULL', etc.
    if (visibilityLevel === 'full' || visibilityLevel === 'complete' || visibilityLevel === 'all') {
      return true
    }
    
    // If no visibility data, assume no full visibility
    if (!visibilityData) {
      return false
    }
    
    // If visibility level is explicitly 'full', trust it
    if (visibilityData.visibility_level && String(visibilityData.visibility_level).toLowerCase() === 'full') {
      return true
    }
    
    // Check if there are NO visible_systems or visible_regions arrays
    // AND the visibility level suggests full access
    // This handles cases where admin might have full visibility but API doesn't list all systems
    const hasVisibleSystems = visibilityData.visible_systems && Array.isArray(visibilityData.visible_systems) && visibilityData.visible_systems.length > 0
    const hasVisibleRegions = visibilityData.visible_regions && Array.isArray(visibilityData.visible_regions) && visibilityData.visible_regions.length > 0
    
    // If admin/user should have full visibility, but API returns empty arrays, 
    // we might need to check other indicators (like is_admin flag, etc.)
    // For now, rely on visibility_level being explicitly 'full'
    
    return false
  }, [visibilityData, visibilityLevel])

  const regionAdjacencyBuffer = getRegionAdjacencyBuffer() ?? 0
  const systemRadiusFallback = getSystemRadiusDefault() ?? 120

  // Group planets by visibility tier for three-tier reveal system
  const revealAreas = useMemo(() => {
    // If full visibility, return empty array (no fog will be rendered anyway)
    if (hasFullVisibility) {
      return { regionLevel: [], systemLevel: [], planetLevel: [] }
    }

    const regionGeometryMap = getVisibleRegionGeometries(visibilityData)
    const systemGeometryMap = getVisibleSystemGeometries(visibilityData)

    // Filter planets that have fog_of_war data and are in viewport
    // Backend already filters hidden planets, so we only get visible/fogged planets
    const planetsWithFog = planets.filter(p => {
      // Must have fog_of_war data
      if (!p.fog_of_war) return false
      
      const xy = getPlanetXY(p)
      if (!xy) return false
      
      // Viewport culling - only process planets in or near viewport
      const padding = 200 // Extra padding for smooth panning
      return (
        xy.x >= viewportBounds.minX - padding &&
        xy.x <= viewportBounds.maxX + padding &&
        xy.y >= viewportBounds.minY - padding &&
        xy.y <= viewportBounds.maxY + padding
      )
    })

    // If we have no planets with fog_of_war data, use systems as fallback
    // This ensures visible systems get reveals even if planets don't have fog_of_war data
    // Also use systems if we have very few planets with fog data (might be incomplete)
    const useSystemFallback = (planetsWithFog.length === 0 || planetsWithFog.length < systems.length / 2) && systems.length > 0

    const regionRevealMap = new Map<number, { centerX: number; centerY: number; width: number; height: number; region: number }>()
    const systemRevealMap = new Map<string, { centerX: number; centerY: number; width: number; height: number; key: string }>()

    const viewportPadding = Math.max(regionAdjacencyBuffer * 2, 200)
    const isInViewport = (x: number, y: number) => (
      x >= viewportBounds.minX - viewportPadding &&
      x <= viewportBounds.maxX + viewportPadding &&
      y >= viewportBounds.minY - viewportPadding &&
      y <= viewportBounds.maxY + viewportPadding
    )

    // 1. REGION-LEVEL REVEALS (Largest)
    regionGeometryMap.forEach((geometry, region) => {
      if (!isInViewport(geometry.center.x, geometry.center.y)) {
        return
      }
      const widthBase = geometry.bounds ? geometry.bounds.max_x - geometry.bounds.min_x : geometry.radius * 2
      const heightBase = geometry.bounds ? geometry.bounds.max_y - geometry.bounds.min_y : geometry.radius * 2
      const width = Math.max(widthBase, geometry.radius * 2, 80) + regionAdjacencyBuffer * 2
      const height = Math.max(heightBase, geometry.radius * 2, 80) + regionAdjacencyBuffer * 2
      regionRevealMap.set(region, {
        region,
        centerX: geometry.center.x,
        centerY: geometry.center.y,
        width,
        height
      })
    })

    if (systems.length > 0) {
      const systemsByRegion = new Map<number, SystemData[]>()
      systems.forEach(system => {
        if (!isInViewport(system.center.x, system.center.y)) {
          return
        }
        if (!systemsByRegion.has(system.region)) {
          systemsByRegion.set(system.region, [])
        }
        systemsByRegion.get(system.region)!.push(system)
      })

      systemsByRegion.forEach((regionSystems, region) => {
        if (regionRevealMap.has(region)) return
        const bounds = calculateRegionBounds(regionSystems)
        if (!bounds) return
        regionRevealMap.set(region, {
          region,
          centerX: bounds.centerX,
          centerY: bounds.centerY,
          width: (bounds.maxX - bounds.minX) + regionAdjacencyBuffer * 2,
          height: (bounds.maxY - bounds.minY) + regionAdjacencyBuffer * 2
        })
      })
    }

    if (!useSystemFallback) {
      const regionVisiblePlanets = planetsWithFog.filter(
        p => p.fog_of_war?.region_visible === true
      )

      const planetsByRegion = new Map<number, Planet[]>()
      regionVisiblePlanets.forEach(planet => {
        const { region } = getPlanetRegionAndSystem(planet)
        if (region !== null) {
          if (!planetsByRegion.has(region)) {
            planetsByRegion.set(region, [])
          }
          planetsByRegion.get(region)!.push(planet)
        }
      })

      planetsByRegion.forEach((regionPlanets, region) => {
        if (regionRevealMap.has(region)) return
        const positions = regionPlanets
          .map(p => getPlanetXY(p))
          .filter((xy): xy is { x: number; y: number } => xy !== null)

        if (positions.length === 0) return

        const xs = positions.map(p => p.x)
        const ys = positions.map(p => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const padding = Math.max(100, regionAdjacencyBuffer)
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        const width = (maxX - minX) + padding * 2
        const height = (maxY - minY) + padding * 2

        regionRevealMap.set(region, {
          region,
          centerX,
          centerY,
          width,
          height
        })
      })
    }

    // 2. SYSTEM-LEVEL REVEALS (Medium)
    systemGeometryMap.forEach((geometry, key) => {
      const [regionStr, systemStr] = key.split(':')
      const region = Number(regionStr)
      const systemNumber = Number(systemStr)
      if (Number.isNaN(region) || Number.isNaN(systemNumber)) return
      if (!isInViewport(geometry.center.x, geometry.center.y)) {
        return
      }
      const radius = geometry.radius ?? systemRadiusFallback
      const widthBase = geometry.bounds ? geometry.bounds.max_x - geometry.bounds.min_x : radius * 2
      const heightBase = geometry.bounds ? geometry.bounds.max_y - geometry.bounds.min_y : radius * 2
      const padding = Math.max(60, radius * 0.35) + regionAdjacencyBuffer / 2
      systemRevealMap.set(key, {
        key,
        centerX: geometry.center.x,
        centerY: geometry.center.y,
        width: Math.max(widthBase, radius * 2, 40) + padding * 2,
        height: Math.max(heightBase, radius * 2, 40) + padding * 2
      })
    })

    systems.forEach(system => {
      const key = `${system.region}:${system.system}`
      if (systemRevealMap.has(key)) return
      if (!isInViewport(system.center.x, system.center.y)) {
        return
      }
      const geometry = system.geometry
      const radius = geometry?.radius ?? system.radius ?? systemRadiusFallback
      const widthBase = geometry?.bounds
        ? geometry.bounds.max_x - geometry.bounds.min_x
        : system.bounds.maxX - system.bounds.minX
      const heightBase = geometry?.bounds
        ? geometry.bounds.max_y - geometry.bounds.min_y
        : system.bounds.maxY - system.bounds.minY
      const padding = Math.max(60, radius * 0.35) + regionAdjacencyBuffer / 2
      systemRevealMap.set(key, {
        key,
        centerX: geometry?.center.x ?? system.center.x,
        centerY: geometry?.center.y ?? system.center.y,
        width: Math.max(widthBase, radius * 2, 40) + padding * 2,
        height: Math.max(heightBase, radius * 2, 40) + padding * 2
      })
    })

    if (!useSystemFallback) {
      const systemVisiblePlanets = planetsWithFog.filter(
        p => p.fog_of_war?.system_visible === true &&
             p.fog_of_war?.region_visible === false
      )

      const planetsBySystem = new Map<string, Planet[]>()
      systemVisiblePlanets.forEach(planet => {
        const { region, system } = getPlanetRegionAndSystem(planet)
        if (region !== null && system !== null) {
          const key = `${region}:${system}`
          if (!planetsBySystem.has(key)) {
            planetsBySystem.set(key, [])
          }
          planetsBySystem.get(key)!.push(planet)
        }
      })

      planetsBySystem.forEach((systemPlanets, key) => {
        if (systemRevealMap.has(key)) return
        const positions = systemPlanets
          .map(p => getPlanetXY(p))
          .filter((xy): xy is { x: number; y: number } => xy !== null)

        if (positions.length === 0) return

        const xs = positions.map(p => p.x)
        const ys = positions.map(p => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const padding = Math.max(60, regionAdjacencyBuffer / 2)
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        const width = Math.max(maxX - minX, 40) + padding * 2
        const height = Math.max(maxY - minY, 40) + padding * 2

        systemRevealMap.set(key, {
          key,
          centerX,
          centerY,
          width,
          height
        })
      })
    }

    // 3. PLANET-LEVEL REVEALS (Smallest)
    // Filter planets where planet_discovered = true AND system_visible = false AND region_visible = false
    const planetDiscoveredOnly = planetsWithFog.filter(
      p => p.fog_of_war?.planet_discovered === true &&
           p.fog_of_war?.system_visible === false &&
           p.fog_of_war?.region_visible === false
    )

    // Create small circular reveals around each planet
    const planetReveals = planetDiscoveredOnly
      .map(p => {
        const xy = getPlanetXY(p)
        if (!xy) return null
        return {
          x: xy.x,
          y: xy.y,
          radius: 40 // Small radius for individual planet discovery
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    return {
      regionLevel: Array.from(regionRevealMap.values()),
      systemLevel: Array.from(systemRevealMap.values()),
      planetLevel: planetReveals
    }
  }, [planets, systems, viewportBounds, hasFullVisibility, visibilityData, regionAdjacencyBuffer, systemRadiusFallback])

  // Generate unique IDs for gradients and mask to avoid conflicts (must execute every render to maintain hook order)
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), [])
  const maskId = `fogMask-${uniqueId}`

  // Calculate fog bounds - cover entire viewport with generous padding
  // This ensures the fog always covers the full screen, even when panning/zooming
  // Use viewport bounds instead of grid bounds to ensure full coverage
  const fogBounds = useMemo(() => {
    // Use viewport bounds and extend well beyond to cover any pan/zoom
    // This ensures the fog covers the entire visible area plus padding
    const padding = Math.max(
      viewportBounds.maxX - viewportBounds.minX,
      viewportBounds.maxY - viewportBounds.minY
    ) * 2 // Large padding based on viewport size
    
    return {
      x: viewportBounds.minX - padding,
      y: viewportBounds.minY - padding,
      width: (viewportBounds.maxX - viewportBounds.minX) + padding * 2,
      height: (viewportBounds.maxY - viewportBounds.minY) + padding * 2,
    }
  }, [viewportBounds])

  // If user has full visibility, don't render fog at all
  if (hasFullVisibility) {
    return null
  }

  // Check if we have any reveal areas
  const hasReveals = revealAreas.regionLevel.length > 0 || 
                     revealAreas.systemLevel.length > 0 || 
                     revealAreas.planetLevel.length > 0 ||
                     homeSystem !== null

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[FogOfWarLayer] Reveal areas:', {
      regionLevel: revealAreas.regionLevel.length,
      systemLevel: revealAreas.systemLevel.length,
      planetLevel: revealAreas.planetLevel.length,
      hasHomeSystem: homeSystem !== null,
      planetsWithFog: planets.filter(p => p.fog_of_war).length,
      totalPlanets: planets.length,
      systems: systems.length
    })
  }

  // If no reveals, render full fog (excluding home system if present)
  if (!hasReveals) {
    // No reveals - render full fog at 90% opacity
    return (
      <rect
        x={fogBounds.x}
        y={fogBounds.y}
        width={fogBounds.width}
        height={fogBounds.height}
        fill="#000000"
        opacity={0.90}
        style={{ pointerEvents: 'none' }}
      />
    )
  }

  return (
    <>
      <defs>
        {/* Gradients for smooth reveal edges */}
        {/* In SVG masks: white = visible, black = hidden */}
        {/* For fog: white = fog shows, black = fog hidden (reveal) */}
        {/* So reveal areas need BLACK gradients to hide the fog */}
        {/* Region-level gradients */}
        {revealAreas.regionLevel.map((reveal, idx) => {
          const gradientId = `regionGradient-${uniqueId}-${reveal.region}-${idx}`
          return (
            <radialGradient 
              key={gradientId} 
              id={gradientId} 
              cx="50%" 
              cy="50%" 
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor="black" stopOpacity="1" />
              <stop offset="60%" stopColor="black" stopOpacity="0.95" />
              <stop offset="85%" stopColor="black" stopOpacity="0.8" />
              <stop offset="100%" stopColor="black" stopOpacity="0" />
            </radialGradient>
          )
        })}
        
        {/* System-level gradients */}
        {revealAreas.systemLevel.map((reveal, idx) => {
          const gradientId = `systemGradient-${uniqueId}-${reveal.key}-${idx}`
          return (
            <radialGradient 
              key={gradientId} 
              id={gradientId} 
              cx="50%" 
              cy="50%" 
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor="black" stopOpacity="0.9" />
              <stop offset="70%" stopColor="black" stopOpacity="0.8" />
              <stop offset="100%" stopColor="black" stopOpacity="0" />
            </radialGradient>
          )
        })}
        
        {/* Planet-level gradients */}
        {revealAreas.planetLevel.map((reveal, idx) => {
          const gradientId = `planetGradient-${uniqueId}-${idx}`
          return (
            <radialGradient 
              key={gradientId} 
              id={gradientId} 
              cx="50%" 
              cy="50%" 
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor="black" stopOpacity="0.8" />
              <stop offset="60%" stopColor="black" stopOpacity="0.6" />
              <stop offset="100%" stopColor="black" stopOpacity="0" />
            </radialGradient>
          )
        })}
        
        {/* Home system gradient */}
        {homeSystem && (
          <radialGradient 
            id={`homeSystemGradient-${uniqueId}`} 
            cx="50%" 
            cy="50%" 
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="black" stopOpacity="1" />
            <stop offset="70%" stopColor="black" stopOpacity="0.9" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </radialGradient>
        )}
        
        {/* Create mask for reveal areas */}
        <mask id={maskId}>
          {/* White everywhere = fog shows (default state) */}
          <rect 
            x={fogBounds.x} 
            y={fogBounds.y} 
            width={fogBounds.width} 
            height={fogBounds.height} 
            fill="white" 
          />
          
          {/* Black areas = fog hidden (revealed areas) */}
          {/* In mask: white = fog shows, black = fog hidden (reveal) */}
          {/* Render in order: region → system → planet (largest to smallest) */}
          
          {/* 1. REGION-LEVEL REVEALS - Large elliptical areas with gradients */}
          {revealAreas.regionLevel.map((reveal, idx) => {
            const gradientId = `regionGradient-${uniqueId}-${reveal.region}-${idx}`
            return (
              <ellipse
                key={`region-reveal-${reveal.region}-${idx}`}
                cx={reveal.centerX}
                cy={reveal.centerY}
                rx={reveal.width / 2}
                ry={reveal.height / 2}
                fill={`url(#${gradientId})`}
              />
            )
          })}
          
          {/* 2. SYSTEM-LEVEL REVEALS - Medium elliptical areas with gradients */}
          {revealAreas.systemLevel.map((reveal, idx) => {
            const gradientId = `systemGradient-${uniqueId}-${reveal.key}-${idx}`
            return (
              <ellipse
                key={`system-reveal-${reveal.key}-${idx}`}
                cx={reveal.centerX}
                cy={reveal.centerY}
                rx={reveal.width / 2}
                ry={reveal.height / 2}
                fill={`url(#${gradientId})`}
              />
            )
          })}
          
          {/* 3. PLANET-LEVEL REVEALS - Small circular areas with gradients */}
          {revealAreas.planetLevel.map((reveal, idx) => {
            const gradientId = `planetGradient-${uniqueId}-${idx}`
            return (
              <circle
                key={`planet-reveal-${idx}`}
                cx={reveal.x}
                cy={reveal.y}
                r={reveal.radius}
                fill={`url(#${gradientId})`}
              />
            )
          })}
          
          {/* Home system reveal (always visible) with gradient */}
          {homeSystem && (() => {
            const gradientId = `homeSystemGradient-${uniqueId}`
            const geometry = homeSystem.geometry
            const bounds = homeSystem.bounds
            const centerX = geometry?.center.x ?? (bounds.minX + bounds.maxX) / 2
            const centerY = geometry?.center.y ?? (bounds.minY + bounds.maxY) / 2
            const radius = geometry?.radius ?? homeSystem.radius ?? systemRadiusFallback
            const boundsWidth = geometry?.bounds
              ? geometry.bounds.max_x - geometry.bounds.min_x
              : bounds.maxX - bounds.minX
            const boundsHeight = geometry?.bounds
              ? geometry.bounds.max_y - geometry.bounds.min_y
              : bounds.maxY - bounds.minY
            const padding = Math.max(50, radius * 0.4)
            const width = Math.max(boundsWidth, radius * 2) + padding * 2
            const height = Math.max(boundsHeight, radius * 2) + padding * 2
            
            return (
              <ellipse
                key="home-system-reveal"
                cx={centerX}
                cy={centerY}
                rx={width / 2}
                ry={height / 2}
                fill={`url(#${gradientId})`}
              />
            )
          })()}
        </mask>
      </defs>
      
      {/* Render fog covering entire grid - 90% black opacity */}
      {/* Everything except revealed areas will be covered by this fog */}
      <rect
        x={fogBounds.x}
        y={fogBounds.y}
        width={fogBounds.width}
        height={fogBounds.height}
        fill="#000000"
        opacity={0.90}
        mask={`url(#${maskId})`}
        style={{ pointerEvents: 'none' }}
      />
    </>
  )
}
