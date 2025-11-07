import { useMemo } from 'react'
import { useGetVisibilityQuery } from '@/api/endpoints/universeApi'
import { Planet } from '@/types/api.types'
import { SystemData } from '@/lib/galaxyUtils'
import { getPlanetXY } from '@/lib/coordinates'
import { getPlanetRegionAndSystem } from '@/lib/galaxyUtils'

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

  // Group planets by visibility tier for three-tier reveal system
  const revealAreas = useMemo(() => {
    // If full visibility, return empty array (no fog will be rendered anyway)
    if (hasFullVisibility) {
      return { regionLevel: [], systemLevel: [], planetLevel: [] }
    }

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

    // 1. REGION-LEVEL REVEALS (Largest)
    let regionReveals: Array<{ centerX: number; centerY: number; width: number; height: number; region: number }> = []
    
    if (!useSystemFallback) {
      // Filter planets where region_visible = true
      const regionVisiblePlanets = planetsWithFog.filter(
        p => p.fog_of_war?.region_visible === true
      )
      
      // Group by region
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

      // Calculate bounding boxes for each region
      regionReveals = Array.from(planetsByRegion.entries()).map(([region, regionPlanets]) => {
        const positions = regionPlanets
          .map(p => getPlanetXY(p))
          .filter((xy): xy is { x: number; y: number } => xy !== null)
        
        if (positions.length === 0) return null

        const xs = positions.map(p => p.x)
        const ys = positions.map(p => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        // Large padding for region-level reveals
        const padding = 100
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        const width = maxX - minX + padding * 2
        const height = maxY - minY + padding * 2

        return {
          centerX,
          centerY,
          width,
          height,
          region
        }
      }).filter((r): r is NonNullable<typeof r> => r !== null)
    }

    // 2. SYSTEM-LEVEL REVEALS (Medium)
    // First, try to get reveals from planets with fog_of_war data
    const systemRevealsFromPlanets: Array<{ centerX: number; centerY: number; width: number; height: number; key: string }> = []
    
    if (!useSystemFallback) {
      // Filter planets where system_visible = true AND region_visible = false
      const systemVisiblePlanets = planetsWithFog.filter(
        p => p.fog_of_war?.system_visible === true && 
             p.fog_of_war?.region_visible === false
      )

      // Group by region:system key
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

      // Calculate bounding boxes for each system
      planetsBySystem.forEach((systemPlanets, key) => {
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

        // Medium padding for system-level reveals
        const padding = 60
        // Calculate center from planet positions (more accurate than bounds)
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        // Ensure minimum size for reveals
        const width = Math.max(maxX - minX, 40) + padding * 2
        const height = Math.max(maxY - minY, 40) + padding * 2

        systemRevealsFromPlanets.push({
          centerX,
          centerY,
          width,
          height,
          key
        })
      })
    }

    // Also add reveals from systems directly (ensures all visible systems get reveals)
    // This is important when planets don't have fog_of_war data
    const systemRevealsFromSystems: Array<{ centerX: number; centerY: number; width: number; height: number; key: string }> = []
    const systemsWithReveals = new Set(systemRevealsFromPlanets.map(r => r.key))
    
    systems.forEach(system => {
      // Skip if we already have a reveal for this system from planets
      const key = `${system.region}:${system.system}`
      if (systemsWithReveals.has(key)) return
      
      // Check if system is in viewport
      const { center, bounds } = system
      const padding = 200
      const inViewport = (
        center.x >= viewportBounds.minX - padding &&
        center.x <= viewportBounds.maxX + padding &&
        center.y >= viewportBounds.minY - padding &&
        center.y <= viewportBounds.maxY + padding
      )
      
      if (!inViewport) return
      
      // Use system center directly (this is the actual system position)
      // Calculate reveal size from bounds with padding
      const revealPadding = 60
      const centerX = center.x  // Use actual system center
      const centerY = center.y  // Use actual system center
      const width = Math.max(bounds.maxX - bounds.minX, 40) + revealPadding * 2  // Ensure minimum size
      const height = Math.max(bounds.maxY - bounds.minY, 40) + revealPadding * 2  // Ensure minimum size

      systemRevealsFromSystems.push({
        centerX,
        centerY,
        width,
        height,
        key
      })
    })

    // Combine reveals from planets and systems
    const systemReveals = [...systemRevealsFromPlanets, ...systemRevealsFromSystems]

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
      regionLevel: regionReveals,
      systemLevel: systemReveals,
      planetLevel: planetReveals
    }
  }, [planets, systems, viewportBounds, hasFullVisibility])

  // Calculate fog bounds - cover entire viewport with generous padding
  // This ensures the fog always covers the full screen, even when panning/zooming
  const fogBounds = useMemo(() => {
    // Cover the entire grid plus large padding to ensure full viewport coverage
    // This prevents the fog from appearing as a smaller rectangle
    const padding = Math.max(gridWidth, gridHeight) * 2 // Very large padding to cover any viewport
    return {
      x: -padding,
      y: -padding,
      width: gridWidth + padding * 2,
      height: gridHeight + padding * 2,
    }
  }, [gridWidth, gridHeight])

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

  // Generate unique IDs for gradients and mask to avoid conflicts
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), [])
  const maskId = `fogMask-${uniqueId}`

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
            const bounds = homeSystem.bounds
            const centerX = (bounds.minX + bounds.maxX) / 2
            const centerY = (bounds.minY + bounds.maxY) / 2
            const width = bounds.maxX - bounds.minX + 50
            const height = bounds.maxY - bounds.minY + 50
            const gradientId = `homeSystemGradient-${uniqueId}`
            
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
