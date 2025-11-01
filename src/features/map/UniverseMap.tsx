import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGetMapQuery, useGetUniverseStructureQuery, useGetVisibilityQuery, useGetDiscoverableQuery } from '@/api/endpoints/universeApi'
import { useSearchPlanetsQuery, useFindNearbyPlanetsQuery, useDiscoverGalaxyMutation } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { toast } from 'sonner'
import { NavigationBreadcrumbs } from '@/components/map/NavigationBreadcrumbs'
import { PlanetGrid } from '@/components/map/PlanetGrid'
import { PlanetActionPanel } from '@/components/map/PlanetActionPanel'
import { StellarMap3D } from '@/components/map/StellarMap3D'
import { PlanetView } from '@/components/map/PlanetView'
import { GalaxyView } from '@/components/map/GalaxyView'
import { Planet } from '@/types/api.types'
import { getGalaxyImage } from '@/lib/galaxyImages'
import { getQuadrantImage } from '@/lib/quadrantImages'
import { getPlanetImage } from '@/lib/planetImages'
import { cn } from '@/lib/utils'
import { 
  MapPin, 
  Search, 
  ArrowLeft, 
  Globe, 
  Layers, 
  Star, 
  Circle,
  Eye,
  AlertCircle,
  CheckCircle,
  Compass,
  Telescope,
  Zap,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

type MapLevel = 'quadrant' | 'sector' | 'galaxy' | 'planet'
type ViewMode = 'explore' | 'search' | 'nearby' | 'discover'

interface MapState {
  level: MapLevel
  selectedQuadrant?: number
  selectedSector?: number
  selectedGalaxy?: number
  selectedPlanet?: number
}


interface SearchFilters {
  state?: 'unsettled' | 'colony' | 'homeworld'
  quadrant?: number
  sector?: number
  galaxy?: number
  is_habitable?: boolean
  limit?: number
  offset?: number
}

export function UniverseMap() {
  const [searchParams] = useSearchParams()
  const [mapState, setMapState] = useState<MapState>({ level: 'quadrant' })
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('explore')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    limit: 20,
    offset: 0
  })
  const [discoveryCost, setDiscoveryCost] = useState<{ tellerium: number; krypton: number } | null>(null)
  const [hoveredSectorId, setHoveredSectorId] = useState<number | null>(null)
  const [zoomLevel, setZoomLevel] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Reset drag offset when changing map levels
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 })
  }, [mapState.level])

  const { data: mapData, isLoading, error } = useGetMapQuery({
    quadrant: mapState.selectedQuadrant,
    sector: mapState.selectedSector,
    galaxy: mapState.selectedGalaxy,
  })
  const mapDataAny: any = mapData as any

  const { data: universeStructure, isLoading: isLoadingStructure } = useGetUniverseStructureQuery()

  const { data: searchResults, isLoading: isSearching } = useSearchPlanetsQuery(searchFilters, {
    skip: viewMode !== 'search'
  })

  // Fetch planets for the current galaxy when viewing planet level
  const { data: galaxyPlanetsData, isLoading: isLoadingGalaxyPlanets } = useSearchPlanetsQuery({
    quadrant: mapState.selectedQuadrant,
    sector: mapState.selectedSector,
    galaxy: mapState.selectedGalaxy,
    limit: 100, // Get all planets in the galaxy
  }, {
    skip: mapState.level !== 'planet' || !mapState.selectedQuadrant || !mapState.selectedSector || !mapState.selectedGalaxy
  })

  const { data: nearbyPlanets, isLoading: isLoadingNearby } = useFindNearbyPlanetsQuery(undefined, {
    skip: false // Always fetch nearby planets so they're available when tab is opened
  })

  const { data: visibilityData } = useGetVisibilityQuery()
  const { data: discoverableData } = useGetDiscoverableQuery()

  const [discoverGalaxy, { isLoading: isDiscovering }] = useDiscoverGalaxyMutation()
  
  // Handle URL params for deep linking to specific galaxy
  useEffect(() => {
    const quadrant = searchParams.get('quadrant')
    const sector = searchParams.get('sector')
    const galaxy = searchParams.get('galaxy')
    
    if (quadrant && sector && galaxy) {
      setMapState({
        level: 'planet',
        selectedQuadrant: parseInt(quadrant),
        selectedSector: parseInt(sector),
        selectedGalaxy: parseInt(galaxy),
      })
      // Clear URL params after using them
      window.history.replaceState({}, '', '/map')
    }
  }, [searchParams])

  // Auto-navigate to deepest visible level based on visibility (only once on initial load)
  useEffect(() => {
    // Only auto-navigate once on initial load when we have visibility data
    if (hasAutoNavigated || !visibilityData || isLoading) return
    
    const visibilityLevel = visibilityData.visibility_level
    
    // If only galaxy visibility, navigate directly to the first visible galaxy
    if (visibilityLevel === 'galaxy' && visibilityData.visible_galaxies?.length > 0) {
      const firstGalaxy = visibilityData.visible_galaxies[0]
      setMapState({
        level: 'planet',
        selectedQuadrant: firstGalaxy.quadrant,
        selectedSector: firstGalaxy.sector,
        selectedGalaxy: firstGalaxy.galaxy,
      })
      setHasAutoNavigated(true)
      return
    }
    
    // If sector visibility, navigate to the first visible sector
    if (visibilityLevel === 'sector' && visibilityData.visible_sectors?.length > 0) {
      const firstSector = visibilityData.visible_sectors[0]
      // If only one sector visible, go deeper
      if (visibilityData.visible_sectors.length === 1) {
        // Find first visible galaxy in this sector
        const galaxyInSector = visibilityData.visible_galaxies?.find(
          (g: any) => g.quadrant === firstSector.quadrant && g.sector === firstSector.sector
        )
        if (galaxyInSector) {
          // If only one galaxy in sector, go to planet view
          const galaxiesInSector = visibilityData.visible_galaxies?.filter(
            (g: any) => g.quadrant === firstSector.quadrant && g.sector === firstSector.sector
          ) || []
          
          if (galaxiesInSector.length === 1) {
            setMapState({
              level: 'planet',
              selectedQuadrant: galaxyInSector.quadrant,
              selectedSector: galaxyInSector.sector,
              selectedGalaxy: galaxyInSector.galaxy,
            })
          } else {
            setMapState({
              level: 'galaxy',
              selectedQuadrant: firstSector.quadrant,
              selectedSector: firstSector.sector,
            })
          }
        } else {
          setMapState({
            level: 'galaxy',
            selectedQuadrant: firstSector.quadrant,
            selectedSector: firstSector.sector,
          })
        }
      } else {
        // Multiple sectors - stay at sector view
        setMapState({
          level: 'sector',
          selectedQuadrant: firstSector.quadrant,
        })
      }
      setHasAutoNavigated(true)
      return
    }
    
    // If quadrant visibility, navigate to first visible quadrant
    if (visibilityLevel === 'quadrant' && visibilityData.visible_quadrants?.length > 0) {
      const firstQuadrant = visibilityData.visible_quadrants[0]
      // If only one quadrant visible, go deeper
      if (visibilityData.visible_quadrants.length === 1) {
        // Check if there's only one sector
        const sectorsInQuadrant = visibilityData.visible_sectors?.filter(
          (s: any) => s.quadrant === firstQuadrant.quadrant
        ) || []
        
        if (sectorsInQuadrant.length === 1) {
          const sector = sectorsInQuadrant[0]
          // Check if there's only one galaxy
          const galaxiesInSector = visibilityData.visible_galaxies?.filter(
            (g: any) => g.quadrant === sector.quadrant && g.sector === sector.sector
          ) || []
          
          if (galaxiesInSector.length === 1) {
            const galaxy = galaxiesInSector[0]
            setMapState({
              level: 'planet',
              selectedQuadrant: galaxy.quadrant,
              selectedSector: galaxy.sector,
              selectedGalaxy: galaxy.galaxy,
            })
          } else {
            setMapState({
              level: 'galaxy',
              selectedQuadrant: sector.quadrant,
              selectedSector: sector.sector,
            })
          }
        } else {
          setMapState({
            level: 'sector',
            selectedQuadrant: firstQuadrant.quadrant,
          })
        }
      }
      // Otherwise stay at quadrant level if multiple quadrants visible
      setHasAutoNavigated(true)
    }
  }, [visibilityData, isLoading, hasAutoNavigated])

  // Debug logging
  useEffect(() => {
    console.log('Map API response:', mapData)
    console.log('Map state:', mapState)
    console.log('View mode:', viewMode)
    console.log('Is loading:', isLoading)
    console.log('Error:', error)
    console.log('Universe structure:', universeStructure)
    console.log('Visibility data:', visibilityData)
    console.log('Should show back button:', mapState.level !== 'quadrant' && !(visibilityData && visibilityData.visibility_level === 'galaxy'))
  }, [mapData, mapState, viewMode, isLoading, error, universeStructure, visibilityData])

  // Calculate discovery cost when galaxy is selected
  useEffect(() => {
    if (mapState.selectedQuadrant && mapState.selectedSector && mapState.selectedGalaxy) {
      // Discovery cost: 1000 Krypton per galaxy
      setDiscoveryCost({ tellerium: 0, krypton: 1000 })
    } else {
      setDiscoveryCost(null)
    }
  }, [mapState.selectedQuadrant, mapState.selectedSector, mapState.selectedGalaxy])

  const handleDiscoverGalaxy = async () => {
    if (!mapState.selectedQuadrant || !mapState.selectedSector || !mapState.selectedGalaxy) return

    try {
      const result = await discoverGalaxy({
        quadrant: mapState.selectedQuadrant,
        sector: mapState.selectedSector,
        galaxy: mapState.selectedGalaxy
      }).unwrap()

      toast.success(`Discovered galaxy! Found ${result.data?.planets?.length || 0} planets.`)
      setViewMode('explore')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to discover galaxy')
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Parse coordinate search
      const coordParts = searchQuery.trim().split(':')
      if (coordParts.length === 4) {
        const [quad, sec, gal, planet] = coordParts.map(Number)
        if (!isNaN(quad) && !isNaN(sec) && !isNaN(gal) && !isNaN(planet)) {
          setMapState({
            level: 'planet',
            selectedQuadrant: quad,
            selectedSector: sec,
            selectedGalaxy: gal,
            selectedPlanet: planet
          })
          setViewMode('explore')
          return
        }
      }
    }

    // Otherwise perform filtered search
    setViewMode('search')
  }

  const handleCoordinateJump = (coordinate: string) => {
    const coord = parseCoordinate(coordinate)
    if (coord) {
      setMapState({
        level: 'planet',
        selectedQuadrant: coord.quadrant,
        selectedSector: coord.sector,
        selectedGalaxy: coord.galaxy,
        selectedPlanet: coord.planet
      })
      setViewMode('explore')
    }
  }

  const handlePlanetClick = (planet: Planet) => {
    console.log('Planet clicked:', planet)
    setSelectedPlanet(planet)
  }

  const handlePlanetPanelClose = () => {
    setSelectedPlanet(null)
  }

  const navigateToLevel = (level: MapLevel, data?: any) => {
    setMapState(prev => {
      const newState: MapState = { level }
      
      switch (level) {
        case 'sector':
          newState.selectedQuadrant = data?.id || prev.selectedQuadrant
          break
        case 'galaxy':
          newState.selectedQuadrant = prev.selectedQuadrant
          newState.selectedSector = data?.id || prev.selectedSector
          break
        case 'planet':
          newState.selectedQuadrant = prev.selectedQuadrant
          newState.selectedSector = prev.selectedSector
          newState.selectedGalaxy = data?.id || prev.selectedGalaxy
          break
      }
      
      return newState
    })
  }

  const goBack = () => {
    setMapState(prev => {
      switch (prev.level) {
        case 'sector':
          return { level: 'quadrant' }
        case 'galaxy':
          return { level: 'sector', selectedQuadrant: prev.selectedQuadrant }
        case 'planet':
          return { level: 'galaxy', selectedQuadrant: prev.selectedQuadrant, selectedSector: prev.selectedSector }
        default:
          return prev
      }
    })
  }

  // Drag handlers for panning the map
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setDragOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
    
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }
    
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragStart])
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the background/empty space
    if ((e.target as HTMLElement).closest('.group')) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // Helper to check if a quadrant is visible
  const isQuadrantVisible = (quadrantId: number): boolean => {
    if (!visibilityData) return true // Default to visible if no data
    
    // Check if explicitly in visible_quadrants
    if (visibilityData.visible_quadrants?.some(q => q.quadrant === quadrantId)) {
      return true
    }
    
    // Check if contains visible sectors or galaxies
    const hasVisibleSector = visibilityData.visible_sectors?.some(
      s => s.quadrant === quadrantId
    )
    const hasVisibleGalaxy = visibilityData.visible_galaxies?.some(
      g => g.quadrant === quadrantId
    )
    
    return hasVisibleSector || hasVisibleGalaxy || false
  }

  // Helper to check if a sector is visible
  const isSectorVisible = (quadrantId: number, sectorId: number): boolean => {
    if (!visibilityData) return true // Default to visible if no data
    
    // Check if explicitly in visible_sectors
    if (visibilityData.visible_sectors?.some(
      s => s.quadrant === quadrantId && s.sector === sectorId
    )) {
      return true
    }
    
    // Check if contains visible galaxies
    const hasVisibleGalaxy = visibilityData.visible_galaxies?.some(
      g => g.quadrant === quadrantId && g.sector === sectorId
    )
    
    return hasVisibleGalaxy || false
  }

  // Helper to check if a galaxy is visible
  const isGalaxyVisible = (quadrantId: number, sectorId: number, galaxyId: number): boolean => {
    if (!visibilityData) return true // Default to visible if no data
    
    return visibilityData.visible_galaxies?.some(
      g => g.quadrant === quadrantId && g.sector === sectorId && g.galaxy === galaxyId
    ) || false
  }

  // Helper to check if a galaxy is discoverable
  const isGalaxyDiscoverable = (quadrant: number, sector: number, galaxy: number): boolean => {
    return discoverableData?.discoverable_galaxies?.some(
      (g) => g.quadrant === quadrant && g.sector === sector && g.galaxy === galaxy
    ) || false
  }

  const renderQuadrantView = () => {
    // NEW: Try hierarchical visibility arrays first (from backend)
    const hierarchicalQuadrants = mapData?.quadrants || mapDataAny?.data?.quadrants || []
    const hierarchicalGalaxies = mapData?.galaxies || mapDataAny?.data?.galaxies || []
    
    if (hierarchicalQuadrants.length > 0) {
      // Filter to only visible quadrants
      const visibleQuadrants = hierarchicalQuadrants.filter(
        (q: any) => q.visibility?.is_visible === true
      )
      
      // If visibility level is "galaxy", show galaxies directly from quadrant level
      const shouldShowGalaxiesDirectly = visibilityData?.visibility_level === 'galaxy'
      
      if (shouldShowGalaxiesDirectly && hierarchicalGalaxies.length > 0) {
        // Group visible galaxies by quadrant and show them directly
        const visibleGalaxiesByQuadrant = visibleQuadrants.map((quadrant: any) => {
          const galaxiesInQuadrant = hierarchicalGalaxies.filter(
            (g: any) => g.quadrant === quadrant.quadrant && g.visibility?.is_visible === true
          )
          return { quadrant, galaxies: galaxiesInQuadrant }
        })
        
        return (
          <div className="space-y-4">
            {/* Visibility unlock message */}
            {visibilityData && (
              <Card className="panel-glass border-yellow/20 bg-yellow-950/10">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-400">
                        Research Sensor Technology to unlock sector visibility
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently only showing {visibilityData.visible_galaxies?.length || 0} visible galaxy(ies). Click a galaxy to jump directly to it.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {visibleGalaxiesByQuadrant.map(({ quadrant, galaxies }: any) => (
              <div key={quadrant.quadrant} className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Quadrant {quadrant.quadrant}
                </h3>
                {galaxies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {galaxies.map((galaxy: any) => {
                      const isDiscoverable = isGalaxyDiscoverable(galaxy.quadrant, galaxy.sector, galaxy.galaxy)
                      const visiblePlanetCount = mapData?.planets?.filter((p: any) => {
                        const coord = parseCoordinate(p.coordinate)
                        return coord && 
                          coord.quadrant === galaxy.quadrant &&
                          coord.sector === galaxy.sector &&
                          coord.galaxy === galaxy.galaxy &&
                          p.visibility?.is_visible === true
                      }).length || 0
                      
                      return (
                        <Card 
                          key={`${galaxy.quadrant}:${galaxy.sector}:${galaxy.galaxy}`} 
                          className={cn(
                            "panel-glass cursor-pointer hover:border-purple/40 transition-colors relative",
                            "border-purple/20",
                            isDiscoverable && "ring-2 ring-yellow-400/30"
                          )}
                          onClick={() => {
                            setMapState({
                              level: 'planet',
                              selectedQuadrant: galaxy.quadrant,
                              selectedSector: galaxy.sector,
                              selectedGalaxy: galaxy.galaxy,
                            })
                          }}
                        >
                          {isDiscoverable && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                <Telescope className="w-3 h-3 mr-1" />
                                Discoverable
                              </Badge>
                            </div>
                          )}
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Star className="w-5 h-5 text-purple-400" />
                              Galaxy {galaxy.galaxy}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Sector {galaxy.sector}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Visible Planets:</span>
                                <span className="font-mono">{visiblePlanetCount}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <Card className="panel-glass border-muted/20">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">No visible galaxies in this quadrant</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )
      }
      
      // Normal quadrant view (when sectors are visible)
      return (
        <div className="space-y-4">
          {/* Visibility unlock message */}
          {visibilityData && visibilityData.visibility_level === 'galaxy' && (
            <Card className="panel-glass border-yellow/20 bg-yellow-950/10">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-400">
                      Research Sensor Technology to unlock sector visibility
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Currently only showing {visibilityData.visible_galaxies?.length || 0} visible galaxy(ies)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleQuadrants.map((quadrant: any) => {
              const isVisible = quadrant.visibility?.is_visible === true
              return (
                <Card 
                  key={quadrant.quadrant} 
                  className={cn(
                    "panel-glass cursor-pointer hover:border-cyan/40 transition-colors",
                    isVisible ? "border-cyan/20" : "border-yellow/20 opacity-50"
                  )}
                  onClick={() => navigateToLevel('sector', { id: quadrant.quadrant })}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      Quadrant {quadrant.quadrant}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Sectors:</span>
                        <span className="font-mono">
                          {mapData?.sectors?.filter((s: any) => s.quadrant === quadrant.quadrant && s.visibility?.is_visible === true).length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Galaxies:</span>
                        <span className="font-mono">
                          {mapData?.galaxies?.filter((g: any) => g.quadrant === quadrant.quadrant && g.visibility?.is_visible === true).length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )
    }
    
    // Fallback: Try nested structure (legacy)
    const quadrants = mapDataAny?.data?.quadrants_nested || []
    
    // If no quadrants in mapData and we have universeStructure, build quadrants from it
    if ((!quadrants || quadrants.length === 0) && universeStructure?.structure) {
      const structureQuadrants = universeStructure.structure.map((q: any) => ({
        id: q.quadrant,
        sectors: q.sectors.map((s: any) => ({
          id: s.sector,
          galaxies: s.galaxies.map((g: any) => ({
            id: g.galaxy,
            planets: [] // Structure doesn't include planets
          }))
        }))
      }))
      
      if (structureQuadrants.length > 0) {
        // Filter quadrants by visibility
        const visibleQuadrants = structureQuadrants.filter((q: any) => isQuadrantVisible(q.id))
        
        return (
          <div className="space-y-4">
            {/* Visibility unlock message */}
            {visibilityData && visibilityData.visibility_level === 'galaxy' && (
              <Card className="panel-glass border-yellow/20 bg-yellow-950/10">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-400">
                        Research Sensor Technology to unlock sector visibility
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently only showing {visibilityData.visible_galaxies?.length || 0} visible galaxy(ies)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleQuadrants.map((quadrant: any) => {
                const isVisible = isQuadrantVisible(quadrant.id)
                return (
                  <Card 
                    key={quadrant.id} 
                    className={cn(
                      "panel-glass cursor-pointer hover:border-cyan/40 transition-colors",
                      isVisible ? "border-cyan/20" : "border-yellow/20 opacity-50"
                    )}
                    onClick={() => navigateToLevel('sector', quadrant)}
                  >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Quadrant {quadrant.id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sectors:</span>
                      <span className="font-mono">{quadrant.sectors?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Galaxies:</span>
                      <span className="font-mono">
                        {quadrant.sectors?.reduce((total: number, sector: any) => 
                          total + (sector.galaxies?.length || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
                )
              })}
            </div>
          </div>
        )
      }
    }
    
    // If we have quadrants with planets from mapData
    if (quadrants && quadrants.length > 0) {
      // Filter quadrants by visibility
      const visibleQuadrants = quadrants.filter((q: any) => isQuadrantVisible(q.id))
      
      return (
        <div className="space-y-4">
          {/* Visibility unlock message */}
          {visibilityData && visibilityData.visibility_level === 'galaxy' && (
            <Card className="panel-glass border-yellow/20 bg-yellow-950/10">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-400">
                      Research Sensor Technology to unlock sector visibility
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Currently only showing {visibilityData.visible_galaxies?.length || 0} visible galaxy(ies)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleQuadrants.map((quadrant: any) => {
              const isVisible = isQuadrantVisible(quadrant.id)
              return (
                <Card 
                  key={quadrant.id} 
                  className={cn(
                    "panel-glass cursor-pointer hover:border-cyan/40 transition-colors",
                    isVisible ? "border-cyan/20" : "border-yellow/20 opacity-50"
                  )}
                  onClick={() => navigateToLevel('sector', quadrant)}
                >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Quadrant {quadrant.id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sectors:</span>
                    <span className="font-mono">{quadrant.sectors?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Planets:</span>
                    <span className="font-mono">
                      {quadrant.sectors?.reduce((total: number, sector: any) => 
                        total + (sector.galaxies?.reduce((galTotal: number, galaxy: any) => 
                          galTotal + (galaxy.planets?.length || 0), 0) || 0), 0) || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
                )
              })}
            </div>
          </div>
        )
      }
    
    // Fallback: show planets directly if available
    const planets: any[] = mapDataAny?.planets || mapDataAny?.data?.planets || []
    
    if (planets.length > 0) {
      return (
        <Card className="panel-glass border-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Universe Overview
            </CardTitle>
            <CardDescription>
              Direct planet view - {planets.length} planets discovered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planets.slice(0, 12).map((planet: any) => {
                const coordString = formatCoordinate(planet.coordinate)
                const isColonized = planet.owner_empire_id
                
                return (
                  <Card 
                    key={coordString} 
                    className={`panel-glass cursor-pointer transition-colors ${
                      isColonized 
                        ? 'border-green/20 hover:border-green/40' 
                        : 'border-muted/20 hover:border-muted/40'
                    }`}
                    onClick={() => handlePlanetClick(planet as Planet)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Circle className={`w-4 h-4 ${isColonized ? 'text-green-400' : 'text-muted-foreground'}`} />
                        <span className="font-semibold">
                          {planet.name || `Planet ${formatCoordinate(planet.coordinate).split(':')[3]}`}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {coordString}
                      </div>
                      <Badge 
                        variant={isColonized ? 'default' : 'outline'}
                        className={isColonized ? 'bg-green-500' : ''}
                      >
                        {planet.state}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {planets.length > 12 && (
              <div className="text-center mt-4 text-sm text-muted-foreground">
                And {planets.length - 12} more planets... Use Search to find specific ones.
              </div>
            )}
          </CardContent>
        </Card>
      )
    }
    
    // Final fallback: show loading or empty state
    if (isLoadingStructure) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )
    }
    
    return (
      <Card className="panel-glass border-cyan/20">
        <CardContent className="pt-6 text-center">
          <Globe className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Universe Data</h3>
          <p className="text-muted-foreground">
            Unable to load universe data. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderSectorView = () => {
    // NEW: Try hierarchical visibility arrays first (from backend)
    const hierarchicalSectors = mapData?.sectors || mapDataAny?.data?.sectors || []
    
    if (hierarchicalSectors.length > 0 && mapState.selectedQuadrant) {
      // Filter to sectors in the selected quadrant and only visible ones
      const visibleSectors = hierarchicalSectors.filter(
        (s: any) => s.quadrant === mapState.selectedQuadrant && s.visibility?.is_visible === true
      )
      
      return (
        <div className="space-y-4">
          {/* Visibility unlock message */}
          {visibilityData && visibilityData.visibility_level === 'galaxy' && mapState.selectedQuadrant && (
            <Card className="panel-glass border-yellow/20 bg-yellow-950/10">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-400">
                      Research Sensor Technology to unlock sector visibility
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Currently only showing {visibilityData.visible_galaxies?.length || 0} visible galaxy(ies)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {visibleSectors.map((sector: any) => {
              const isVisible = sector.visibility?.is_visible === true
              return (
                <Card 
                  key={`${sector.quadrant}:${sector.sector}`} 
                  className={cn(
                    "panel-glass cursor-pointer hover:border-blue/40 transition-colors",
                    isVisible ? "border-blue/20" : "border-yellow/20 opacity-50"
                  )}
                  onClick={() => navigateToLevel('galaxy', { id: sector.sector })}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layers className="w-5 h-5 text-blue-400" />
                      Sector {sector.sector}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Galaxies:</span>
                        <span className="font-mono">
                          {mapData?.galaxies?.filter(
                            (g: any) => g.quadrant === sector.quadrant && g.sector === sector.sector
                          ).length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Planets:</span>
                        <span className="font-mono">
                          {mapData?.planets?.filter((p: any) => {
                            const coord = parseCoordinate(p.coordinate)
                            return coord && coord.quadrant === sector.quadrant && coord.sector === sector.sector
                          }).length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )
    }
    
    // Fallback: Try nested structure (legacy)
    const quadrants = mapDataAny?.data?.quadrants_nested || []
    const quadrant = quadrants.find((q: any) => q.id === mapState.selectedQuadrant) || quadrants[0]
    let sectors = quadrant?.sectors || []
    
    // If no sectors in mapData, try to get from universeStructure
    if ((!sectors || sectors.length === 0) && universeStructure?.structure && mapState.selectedQuadrant) {
      const structureQuadrant = universeStructure.structure.find((q: any) => q.quadrant === mapState.selectedQuadrant)
      if (structureQuadrant) {
        sectors = structureQuadrant.sectors.map((s: any) => ({
          id: s.sector,
          galaxies: s.galaxies.map((g: any) => ({
            id: g.galaxy,
            planets: [] // Structure doesn't include planets
          }))
        }))
      }
    }
    
    if (!sectors || sectors.length === 0) {
      return (
        <Card className="panel-glass border-blue/20">
          <CardContent className="pt-6 text-center">
            <Layers className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sectors Found</h3>
            <p className="text-muted-foreground">
              Unable to load sector data for quadrant {mapState.selectedQuadrant}.
            </p>
            {isLoadingStructure && (
              <p className="text-sm text-muted-foreground mt-2">Loading structure data...</p>
            )}
          </CardContent>
        </Card>
      )
    }

    // Filter sectors by visibility
    const visibleSectors = sectors.filter((s: any) => 
      mapState.selectedQuadrant 
        ? isSectorVisible(mapState.selectedQuadrant, s.id)
        : true
    )

    return (
      <div className="space-y-4">
        {/* Visibility unlock message */}
        {visibilityData && visibilityData.visibility_level === 'galaxy' && mapState.selectedQuadrant && (
          <Card className="panel-glass border-yellow/20 bg-yellow-950/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400">
                    Research Sensor Technology to unlock sector visibility
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently only showing {visibilityData.visible_galaxies?.length || 0} visible galaxy(ies)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {visibleSectors.map((sector: any) => {
            const isVisible = mapState.selectedQuadrant 
              ? isSectorVisible(mapState.selectedQuadrant, sector.id)
              : true
            return (
              <Card 
                key={sector.id} 
                className={cn(
                  "panel-glass cursor-pointer hover:border-blue/40 transition-colors",
                  isVisible ? "border-blue/20" : "border-yellow/20 opacity-50"
                )}
                onClick={() => navigateToLevel('galaxy', sector)}
              >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5 text-blue-400" />
                Sector {sector.id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Galaxies:</span>
                  <span className="font-mono">{sector.galaxies?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Planets:</span>
                  <span className="font-mono">
                    {sector.galaxies?.reduce((total: number, galaxy: any) => 
                      total + (galaxy.planets?.length || 0), 0) || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
            )
          })}
        </div>
      </div>
    )
  }

  const renderGalaxyView = () => {
    // NEW: Try hierarchical visibility arrays first (from backend)
    const hierarchicalGalaxies = mapData?.galaxies || mapDataAny?.data?.galaxies || []
    
    if (hierarchicalGalaxies.length > 0 && mapState.selectedQuadrant && mapState.selectedSector) {
      // Filter to galaxies in the selected quadrant/sector and only visible ones
      const visibleGalaxies = hierarchicalGalaxies.filter(
        (g: any) => 
          g.quadrant === mapState.selectedQuadrant && 
          g.sector === mapState.selectedSector &&
          g.visibility?.is_visible === true
      )
      
      return (
        <div className="space-y-4">
          {/* Visibility unlock message */}
          {visibilityData && !visibilityData.unlocked_by?.sensor_technology && (
            <Card className="panel-glass border-yellow/20 bg-yellow-950/10">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-400">
                      Research Sensor Technology to unlock entire sector visibility
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Currently only showing planets in visible galaxies
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Filter galaxies by visibility */}
          {(() => {
            if (visibleGalaxies.length === 0) {
              return (
                <Card className="panel-glass border-purple/20">
                  <CardContent className="pt-6 text-center">
                    <Star className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Visible Galaxies</h3>
                    <p className="text-muted-foreground">
                      You don't have visibility to any galaxies in this sector yet.
                    </p>
                    {visibilityData && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Research Sensor Technology to unlock sector visibility
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleGalaxies.map((galaxy: any) => {
                  // Count visible planets for this galaxy
                  const visiblePlanetCount = mapData?.planets?.filter((p: any) => {
                    const coord = parseCoordinate(p.coordinate)
                    return coord && 
                      coord.quadrant === galaxy.quadrant &&
                      coord.sector === galaxy.sector &&
                      coord.galaxy === galaxy.galaxy &&
                      p.visibility?.is_visible === true
                  }).length || 0
                  
                  // Check if galaxy is discoverable
                  const isDiscoverable = isGalaxyDiscoverable(galaxy.quadrant, galaxy.sector, galaxy.galaxy)
                  const isVisible = galaxy.visibility?.is_visible === true
                  
                  return (
                    <Card 
                      key={`${galaxy.quadrant}:${galaxy.sector}:${galaxy.galaxy}`} 
                      className={cn(
                        "panel-glass cursor-pointer hover:border-purple/40 transition-colors relative",
                        isVisible ? "border-purple/20" : "border-yellow/20 opacity-50",
                        isDiscoverable && "ring-2 ring-yellow-400/30"
                      )}
                      onClick={() => navigateToLevel('planet', { id: galaxy.galaxy })}
                    >
                      {isDiscoverable && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Telescope className="w-3 h-3 mr-1" />
                            Discoverable
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Star className={cn("w-5 h-5", isVisible ? "text-purple-400" : "text-yellow-400")} />
                          Galaxy {galaxy.galaxy}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Visible Planets:</span>
                            <span className="font-mono">{visiblePlanetCount}</span>
                          </div>
                          {!isVisible && (
                            <Badge variant="outline" className="w-full justify-center mt-2 text-xs">
                              Hidden
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )
    }
    
    // Fallback: Try nested structure (legacy)
    const quadrants = mapDataAny?.data?.quadrants_nested || []
    const quadrant = quadrants.find((q: any) => q.id === mapState.selectedQuadrant) || quadrants[0]
    const sectors = quadrant?.sectors || []
    const sector = sectors.find((s: any) => s.id === mapState.selectedSector) || sectors[0]
    let galaxies = sector?.galaxies || []
    
    // If no galaxies in mapData, try to get from universeStructure
    if ((!galaxies || galaxies.length === 0) && universeStructure?.structure && mapState.selectedQuadrant && mapState.selectedSector) {
      const structureQuadrant = universeStructure.structure.find((q: any) => q.quadrant === mapState.selectedQuadrant)
      if (structureQuadrant) {
        const structureSector = structureQuadrant.sectors.find((s: any) => s.sector === mapState.selectedSector)
        if (structureSector) {
          galaxies = structureSector.galaxies.map((g: any) => ({
            id: g.galaxy,
            planets: [], // Structure doesn't include planets
            planet_count: g.planet_count || 0 // Use planet_count from structure
          }))
        }
      }
    }
    
    if (!galaxies || galaxies.length === 0) {
      return (
        <Card className="panel-glass border-purple/20">
          <CardContent className="pt-6 text-center">
            <Star className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Galaxies Found</h3>
            <p className="text-muted-foreground">
              Unable to load galaxy data for quadrant {mapState.selectedQuadrant}, sector {mapState.selectedSector}.
            </p>
            {isLoadingStructure && (
              <p className="text-sm text-muted-foreground mt-2">Loading structure data...</p>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {/* Visibility unlock message */}
        {visibilityData && !visibilityData.unlocked_by?.sensor_technology && (
          <Card className="panel-glass border-yellow/20 bg-yellow-950/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400">
                    Research Sensor Technology to unlock entire sector visibility
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently only showing planets in visible galaxies
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Filter galaxies by visibility */}
        {(() => {
          const visibleGalaxies = galaxies.filter((g: any) => 
            mapState.selectedQuadrant && mapState.selectedSector
              ? isGalaxyVisible(mapState.selectedQuadrant, mapState.selectedSector, g.id)
              : true
          )
          
          if (visibleGalaxies.length === 0 && galaxies.length > 0) {
            return (
          <Card className="panel-glass border-purple/20">
            <CardContent className="pt-6 text-center">
              <Star className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Visible Galaxies</h3>
              <p className="text-muted-foreground">
                You don't have visibility to any galaxies in this sector yet.
              </p>
              {visibilityData && (
                <p className="text-sm text-yellow-400 mt-2">
                  Research Sensor Technology to unlock sector visibility
                </p>
              )}
            </CardContent>
          </Card>
            )
          }
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleGalaxies.map((galaxy: any) => {
            // Calculate planet count - prefer planets array length, fallback to planet_count from structure
            const planetCount = galaxy.planets?.length || galaxy.planet_count || 0
            const colonizedCount = galaxy.planets?.filter((p: any) => p.owner_empire_id).length || 0
            const visiblePlanetCount = galaxy.planets?.filter((p: any) => p.visibility?.is_visible !== false).length || planetCount
            
            // Check if galaxy is discoverable
            const isDiscoverable = mapState.selectedQuadrant && mapState.selectedSector
              ? isGalaxyDiscoverable(mapState.selectedQuadrant, mapState.selectedSector, galaxy.id)
              : false
            
            // Check if galaxy is visible (has visibility data)
            const isVisible = mapState.selectedQuadrant && mapState.selectedSector
              ? isGalaxyVisible(mapState.selectedQuadrant, mapState.selectedSector, galaxy.id)
              : galaxy.visibility?.is_visible !== false
            
            return (
              <Card 
                key={galaxy.id} 
                className={cn(
                  "panel-glass cursor-pointer hover:border-purple/40 transition-colors relative",
                  !isVisible ? "border-yellow/20 opacity-50" : "border-purple/20",
                  isDiscoverable && "ring-2 ring-yellow-400/30"
                )}
                onClick={() => navigateToLevel('planet', galaxy)}
              >
                {isDiscoverable && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Telescope className="w-3 h-3 mr-1" />
                      Discoverable
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className={cn("w-5 h-5", isVisible ? "text-purple-400" : "text-yellow-400")} />
                    Galaxy {galaxy.id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Visible Planets:</span>
                      <span className="font-mono">{visiblePlanetCount}</span>
                    </div>
                    {planetCount > visiblePlanetCount && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Total:</span>
                        <span className="font-mono">{planetCount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Colonized:</span>
                      <span className="font-mono">{colonizedCount}</span>
                    </div>
                    {!isVisible && (
                      <Badge variant="outline" className="w-full justify-center mt-2 text-xs">
                        Hidden
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
              )
            })}
            </div>
          )
        })()}
      </div>
    )
  }

  const renderPlanetView = () => {
    // NEW: Try flat planets array first (from hierarchical response)
    let planets: Planet[] = mapData?.planets || mapDataAny?.data?.planets || []
    
    // Filter planets by coordinate and visibility
    if (mapState.selectedQuadrant && mapState.selectedSector && mapState.selectedGalaxy) {
      planets = planets.filter((p: any) => {
        const coord = parseCoordinate(p.coordinate)
        return coord && 
          coord.quadrant === mapState.selectedQuadrant &&
          coord.sector === mapState.selectedSector &&
          coord.galaxy === mapState.selectedGalaxy &&
          p.visibility?.is_visible === true // Filter by visibility
      })
    } else {
      // Filter only by visibility if no specific galaxy selected
      planets = planets.filter((p: any) => p.visibility?.is_visible === true)
    }
    
    // If still no planets, try galaxyPlanetsData from searchPlanets query
    if (planets.length === 0 && galaxyPlanetsData?.planets) {
      planets = galaxyPlanetsData.planets.filter((p: any) => p.visibility?.is_visible !== false)
    }
    
    // Fallback: Try nested structure (legacy)
    if (planets.length === 0) {
      const quadrants = mapDataAny?.data?.quadrants_nested || []
      const quadrant = quadrants.find((q: any) => q.id === mapState.selectedQuadrant) || quadrants[0]
      const sectors = quadrant?.sectors || []
      const sector = sectors.find((s: any) => s.id === mapState.selectedSector) || sectors[0]
      const galaxies = sector?.galaxies || []
      const galaxy = galaxies.find((g: any) => g.id === mapState.selectedGalaxy) || galaxies[0]
      planets = galaxy?.planets?.filter((p: any) => p.visibility?.is_visible !== false) || []
    }
    
    const visiblePlanets = planets
    
    if (!visiblePlanets || visiblePlanets.length === 0) {
      return (
        <Card className="panel-glass border-green/20">
          <CardContent className="pt-6 text-center">
            <Circle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Planets Found</h3>
            <p className="text-muted-foreground">
              {isLoadingGalaxyPlanets 
                ? 'Loading planets...' 
                : mapState.selectedGalaxy 
                  ? `This galaxy has no planets yet.` 
                  : 'Unable to load planet data for this galaxy.'}
            </p>
            {mapState.selectedGalaxy && !isLoadingGalaxyPlanets && (
              <Button
                onClick={handleDiscoverGalaxy}
                disabled={isDiscovering}
                className="mt-4"
              >
                <Telescope className="w-4 h-4 mr-2" />
                {isDiscovering ? 'Discovering...' : 'Discover Galaxy'}
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    const isDiscoverable = mapState.selectedQuadrant && mapState.selectedSector && mapState.selectedGalaxy
      ? isGalaxyDiscoverable(mapState.selectedQuadrant, mapState.selectedSector, mapState.selectedGalaxy)
      : false

    return (
      <div className="space-y-4">
        <Card className="panel-glass border-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" />
              Galaxy {mapState.selectedGalaxy} - {visiblePlanets.length} Visible Planets
              {planets.length > visiblePlanets.length && (
                <Badge variant="outline" className="ml-2">
                  {planets.length - visiblePlanets.length} hidden
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Click on a planet to view details and perform actions
              {isDiscoverable && (
                <span className="block mt-2 text-yellow-400">
                  <Telescope className="w-4 h-4 inline mr-1" />
                  This galaxy can be discovered with a signal scan
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
        <PlanetView
          planets={visiblePlanets}
          onPlanetClick={handlePlanetClick}
        />
      </div>
    )
  }

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )
    }

    const searchResultsAny: any = searchResults as any
    let planets = searchResults?.planets || searchResultsAny?.data?.planets || []
    
    // Filter planets by visibility in search results too
    planets = planets.filter((p: any) => p.visibility?.is_visible !== false)
    
    if (!planets || planets.length === 0) {
      return (
        <Card className="panel-glass border-purple/20">
          <CardContent className="pt-6 text-center">
            <Search className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Search Results</h3>
            <p className="text-muted-foreground">
              No planets found matching your search criteria.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Found {searchResults?.total || planets.length} planets
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={searchFilters.offset === 0}
              onClick={() => setSearchFilters(prev => ({ ...prev, offset: Math.max(0, (prev.offset || 0) - (prev.limit || 20)) }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(searchFilters.offset || 0) + (searchFilters.limit || 20) >= (searchResultsAny?.total ?? planets.length)}
              onClick={() => setSearchFilters(prev => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 20) }))}
            >
              Next
            </Button>
          </div>
        </div>
        <PlanetView
          planets={planets as Planet[]}
          onPlanetClick={handlePlanetClick}
        />
      </div>
    )
  }

  const renderNearbyPlanets = () => {
    if (isLoadingNearby) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )
    }

    const nearbyAny: any = nearbyPlanets as any
    let planets = nearbyPlanets?.planets || nearbyAny?.data?.planets || []
    
    // Filter planets by visibility in nearby planets too
    planets = planets.filter((p: any) => p.visibility?.is_visible !== false)
    
    if (!planets || planets.length === 0) {
      return (
        <Card className="panel-glass border-cyan/20">
          <CardContent className="pt-6 text-center">
            <Compass className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Nearby Planets</h3>
            <p className="text-muted-foreground">
              No colonizable planets found within 2 galaxies of your territory.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Found {planets.length} nearby colonizable planets
          </p>
        </div>
        <PlanetView
          planets={planets as Planet[]}
          onPlanetClick={handlePlanetClick}
        />
      </div>
    )
  }

  const renderDiscoveryView = () => {
    if (!mapState.selectedQuadrant || !mapState.selectedSector || !mapState.selectedGalaxy) {
      return (
        <Card className="panel-glass border-yellow/20">
          <CardContent className="pt-6 text-center">
            <Telescope className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Galaxy to Discover</h3>
            <p className="text-muted-foreground">
              Navigate to a galaxy to discover its planets
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <Card className="panel-glass border-yellow/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Telescope className="w-5 h-5 text-yellow-400" />
              Discover Galaxy {mapState.selectedQuadrant}:{mapState.selectedSector}:{mapState.selectedGalaxy}
            </CardTitle>
            <CardDescription>
              Use advanced scanning technology to reveal all planets in this galaxy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {discoveryCost && (
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-semibold mb-2">Discovery Cost</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tellerium:</span>
                    <span className="font-mono text-cyan-400">{formatResource(discoveryCost.tellerium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Krypton:</span>
                    <span className="font-mono text-blue-400">{formatResource(discoveryCost.krypton)}</span>
                  </div>
                </div>
              </div>
            )}
            <Button 
              onClick={handleDiscoverGalaxy}
              disabled={isDiscovering}
              className="w-full"
            >
              {isDiscovering ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Telescope className="w-4 h-4 mr-2" />
                  Discover Galaxy
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'search':
        return renderSearchResults()
      case 'nearby':
        return renderNearbyPlanets()
      case 'discover':
        return renderDiscoveryView()
      case 'explore':
      default:
        switch (mapState.level) {
          case 'quadrant':
            return renderQuadrantView()
          case 'sector':
            return renderSectorView()
          case 'galaxy':
            return renderGalaxyView()
          case 'planet':
            return renderPlanetView()
          default:
            return null
        }
    }
  }

  // Early return for immersive quadrant view
  if (viewMode === 'explore' && mapState.level === 'quadrant' && !isLoading) {
    const quadrants = mapData?.quadrants || mapDataAny?.data?.quadrants || []
    
    let quadrantsToDisplay: any[] = []
    if (quadrants && quadrants.length > 0) {
      quadrantsToDisplay = quadrants
    } else if (universeStructure?.structure) {
      quadrantsToDisplay = universeStructure.structure.map((q: any) => ({
        id: q.quadrant,
        sectors: q.sectors.map((s: any) => ({
          id: s.sector,
          galaxies: s.galaxies.map((g: any) => ({
            id: g.galaxy,
            planets: []
          }))
        }))
      }))
    }
    
    if (quadrantsToDisplay.length > 0) {
      return (
        <>
          <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
            {/* Header */}
            <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-start">
              <div className="panel-glass surface-gradient border-border/20 px-6 py-4 backdrop-blur-md rounded-lg">
                <h1 className="text-5xl font-heading glow-cyan mb-2">Universe Map</h1>
                <p className="text-lg text-muted-foreground">Select a quadrant to explore</p>
              </div>
            </div>

            {/* Quadrants in 2x2 grid */}
            <div className="absolute inset-0 flex items-center justify-center pt-24">
              <div className="grid grid-cols-2 gap-8">
                {quadrantsToDisplay.map((quadrant: any) => {
                  const totalGalaxies = quadrant.sectors?.reduce((total: number, sector: any) => 
                    total + (sector.galaxies?.length || 0), 0) || 0
                  
                  return (
                    <div
                      key={quadrant.id}
                      className="group cursor-pointer relative"
                      onClick={() => navigateToLevel('sector', quadrant)}
                    >
                      <img
                        src={getQuadrantImage(quadrant.id)}
                        alt={`Quadrant ${quadrant.id}`}
                        className={cn(
                          "w-96 h-96 object-contain filter drop-shadow-2xl transition-all duration-300",
                          "group-hover:scale-110 group-hover:brightness-125"
                        )}
                        style={{ imageRendering: 'auto' }}
                      />
                      {/* Info Popover - Styled like parallelogram box */}
                      <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="parallelogram-box bg-background/95 backdrop-blur-lg">
                          <div className="max-w-[200px] ml-auto mr-[30px]">
                            <h3 className="text-xl font-heading glow-cyan mb-2">Quadrant {quadrant.id}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground font-mono">
                              <div className="flex justify-between">
                                <span>Sectors:</span>
                                <span className="text-cyan-400">{quadrant.sectors?.length || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Galaxies:</span>
                                <span className="text-cyan-400">{totalGalaxies}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <PlanetActionPanel
            planet={selectedPlanet}
            isOpen={!!selectedPlanet}
            onClose={handlePlanetPanelClose}
            onRefresh={() => {}}
          />
        </>
      )
    }
  }

  // Early return for immersive sector view
  if (viewMode === 'explore' && mapState.level === 'sector' && !isLoading) {
    const quadrants = mapData?.quadrants || mapDataAny?.data?.quadrants || []
    const quadrant = quadrants.find((q: any) => q.id === mapState.selectedQuadrant) || quadrants[0]
    let sectors = quadrant?.sectors || []
    
    if ((!sectors || sectors.length === 0) && universeStructure?.structure && mapState.selectedQuadrant) {
      const structureQuadrant = universeStructure.structure.find((q: any) => q.quadrant === mapState.selectedQuadrant)
      if (structureQuadrant) {
        sectors = structureQuadrant.sectors.map((s: any) => ({
          id: s.sector,
          galaxies: s.galaxies.map((g: any) => ({
            id: g.galaxy,
            planets: []
          }))
        }))
      }
    }
    
    if (sectors && sectors.length > 0) {
      return (
        <>
          <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
            {/* Header */}
            <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-start">
              <div className="panel-glass surface-gradient border-border/20 px-6 py-4 backdrop-blur-md rounded-lg">
                <h1 className="text-5xl font-heading glow-cyan mb-2">Quadrant {mapState.selectedQuadrant}</h1>
                <p className="text-lg text-muted-foreground">Select a sector to explore</p>
              </div>
              {!(visibilityData && visibilityData.visibility_level === 'galaxy') && (
                <Button variant="outline" onClick={goBack} size="lg">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              )}
            </div>

            {/* Sector view with orbital rings */}
            <div className="absolute inset-0 flex items-center justify-center pt-24">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* SVG for orbital rings and pie chart segments */}
                <svg className="absolute w-[250%] h-[250%]" style={{ left: '-75%', top: '-75%', overflow: 'visible' }}>
                  <circle
                    cx="50%"
                    cy="50%"
                    r="400"
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.2)"
                    strokeWidth="2"
                    strokeDasharray="8,8"
                  />
                  
                  {/* Pie chart sectors for hover effect */}
                  {sectors.map((sector: any, index: number) => {
                    const anglePerSector = 360 / sectors.length
                    const startAngle = index * anglePerSector
                    const endAngle = (index + 1) * anglePerSector
                    
                    const radius = 400
                    const x1 = 50 + radius * Math.cos((startAngle - 90) * Math.PI / 180)
                    const y1 = 50 + radius * Math.sin((startAngle - 90) * Math.PI / 180)
                    const x2 = 50 + radius * Math.cos((endAngle - 90) * Math.PI / 180)
                    const y2 = 50 + radius * Math.sin((endAngle - 90) * Math.PI / 180)
                    const largeArc = anglePerSector > 180 ? 1 : 0
                    const pathData = `M 50%,50% L ${x1}%,${y1}% A ${radius},${radius} 0 ${largeArc},1 ${x2}%,${y2}% Z`
                    
                    return (
                      <path
                        key={`sector-${sector.id}`}
                        d={pathData}
                        fill={hoveredSectorId === sector.id ? "rgba(6, 182, 212, 0.2)" : "rgba(6, 182, 212, 0)"}
                        stroke={hoveredSectorId === sector.id ? "rgba(6, 182, 212, 0.5)" : "none"}
                        strokeWidth="2"
                        className="transition-all duration-200 pointer-events-none"
                      />
                    )
                  })}
                </svg>
                
                {/* Sectors positioned on ring */}
                <div className="absolute inset-0">
                  {sectors.map((sector: any, index: number) => {
                    const totalGalaxies = sector.galaxies?.length || 0
                    const totalPlanets = sector.galaxies?.reduce((total: number, galaxy: any) => 
                      total + (galaxy.planets?.length || 0), 0) || 0
                    
                    const angle = (index * 360) / sectors.length
                    const radius = 400 / 25
                    const centerX = 50
                    const centerY = 50
                    const x = centerX + (radius * Math.cos((angle - 90) * Math.PI / 180))
                    const y = centerY + (radius * Math.sin((angle - 90) * Math.PI / 180))
                    
                    return (
                      <div
                        key={sector.id}
                        className="group cursor-pointer absolute"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onMouseEnter={() => setHoveredSectorId(sector.id)}
                        onMouseLeave={() => setHoveredSectorId(null)}
                        onClick={() => navigateToLevel('galaxy', sector)}
                      >
                        <div className="text-center">
                          <div className="parallelogram-box bg-background/95 backdrop-blur-sm border border-cyan-500/30 p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none mb-2">
                            <div className="text-xs font-semibold text-foreground mb-1">Sector {sector.id}</div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>{totalGalaxies} Galaxies</div>
                              <div>{totalPlanets} Planets</div>
                            </div>
                          </div>
                          <h3 className="text-xl font-heading glow-cyan">Sector {sector.id}</h3>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <PlanetActionPanel
            planet={selectedPlanet}
            isOpen={!!selectedPlanet}
            onClose={handlePlanetPanelClose}
            onRefresh={() => {}}
          />
        </>
      )
    }
  }

  // Early return for immersive galaxy view
  if (viewMode === 'explore' && mapState.level === 'galaxy' && !isLoading) {
    const quadrants = mapData?.quadrants || mapDataAny?.data?.quadrants || []
    const quadrant = quadrants.find((q: any) => q.id === mapState.selectedQuadrant) || quadrants[0]
    const sectors = quadrant?.sectors || []
    const sector = sectors.find((s: any) => s.id === mapState.selectedSector) || sectors[0]
    let galaxies = sector?.galaxies || []
    
    if ((!galaxies || galaxies.length === 0) && universeStructure?.structure && mapState.selectedQuadrant && mapState.selectedSector) {
      const structureQuadrant = universeStructure.structure.find((q: any) => q.quadrant === mapState.selectedQuadrant)
      if (structureQuadrant) {
        const structureSector = structureQuadrant.sectors.find((s: any) => s.sector === mapState.selectedSector)
        if (structureSector) {
          galaxies = structureSector.galaxies.map((g: any, index: number) => ({
            id: g.galaxy,
            planets: [],
            planet_count: g.planet_count || 0,
            type: (index % 4) + 1
          }))
        }
      }
    }
    
    if (galaxies && galaxies.length > 0) {
      return (
        <>
          <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
            {/* Header */}
            <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-start">
              <div className="panel-glass surface-gradient border-border/20 px-6 py-4 backdrop-blur-md rounded-lg">
                <h1 className="text-5xl font-heading glow-cyan mb-2">
                  Quadrant {mapState.selectedQuadrant}: Sector {mapState.selectedSector}
                </h1>
                <p className="text-lg text-muted-foreground">Select a galaxy to explore</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1">
                  <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} className="h-8 w-8">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-mono px-2 min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
                  <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))} className="h-8 w-8">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={goBack} size="lg">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              </div>
            </div>

            {/* Galaxy view with spiral positioning */}
            <div className="absolute inset-0 flex items-center justify-center pt-24">
              <div className="relative w-full h-full" style={{ transform: `scale(${zoomLevel})`, transformOrigin: '50% 50%' }}>
                {/* Travel route lines */}
                <svg className="absolute w-full h-full pointer-events-none">
                  {galaxies.map((galaxy: any, index: number) => {
                    const goldenAngle = 137.508 * (index * 0.8)
                    const radius = 15 + (index * 8)
                    const angle = goldenAngle * (Math.PI / 180)
                    const offsetX = radius * Math.cos(angle)
                    const offsetY = radius * Math.sin(angle)
                    const x1 = 50 + offsetX
                    const y1 = 50 + offsetY
                    
                    return galaxies.slice(index + 1, index + Math.min(4, galaxies.length - index + 1)).map((targetGalaxy: any, targetOffset: number) => {
                      const targetIndex = index + targetOffset + 1
                      const targetGoldenAngle = 137.508 * (targetIndex * 0.8)
                      const targetRadius = 15 + (targetIndex * 8)
                      const targetAngle = targetGoldenAngle * (Math.PI / 180)
                      const targetOffsetX = targetRadius * Math.cos(targetAngle)
                      const targetOffsetY = targetRadius * Math.sin(targetAngle)
                      const x2 = 50 + targetOffsetX
                      const y2 = 50 + targetOffsetY
                      
                      return (
                        <line
                          key={`route-${galaxy.id}-${targetGalaxy.id}`}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke="rgba(6, 182, 212, 0.15)"
                          strokeWidth="1.5"
                          strokeDasharray="4,6"
                        />
                      )
                    })
                  }).flat()}
                </svg>
                
                {galaxies.map((galaxy: any, index: number) => {
                  const planetCount = galaxy.planets?.length || galaxy.planet_count || 0
                  const colonizedCount = galaxy.planets?.filter((p: any) => p.owner_empire_id).length || 0
                  
                  const goldenAngle = 137.508 * (index * 0.8)
                  const radius = 15 + (index * 8)
                  const angle = goldenAngle * (Math.PI / 180)
                  const centerX = 50
                  const centerY = 50
                  const offsetX = radius * Math.cos(angle)
                  const offsetY = radius * Math.sin(angle)
                  const x = centerX + offsetX
                  const y = centerY + offsetY
                  
                  return (
                    <div
                      key={galaxy.id}
                      className="group cursor-pointer absolute"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={() => navigateToLevel('planet', galaxy)}
                    >
                      <img
                        src={getGalaxyImage(galaxy.type)}
                        alt={`Galaxy ${galaxy.id}`}
                        className={cn(
                          "w-64 h-64 object-contain filter drop-shadow-2xl transition-all duration-300",
                          "group-hover:scale-125 group-hover:brightness-125"
                        )}
                        style={{ imageRendering: 'auto' }}
                      />
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -mt-4 mb-4">
                        <div className="parallelogram-box bg-background/95 backdrop-blur-sm border border-purple-500/30 p-4 shadow-xl">
                          <div className="text-xs font-semibold text-foreground mb-1">Galaxy {galaxy.id}</div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>{planetCount} Planets</div>
                            {colonizedCount > 0 && <div>{colonizedCount} Colonized</div>}
                          </div>
                        </div>
                      </div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full text-center mt-2">
                        <h3 className="text-xl font-heading glow-purple">Galaxy {galaxy.id}</h3>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <PlanetActionPanel
            planet={selectedPlanet}
            isOpen={!!selectedPlanet}
            onClose={handlePlanetPanelClose}
            onRefresh={() => {}}
          />
        </>
      )
    }
  }

  // Early return for immersive planet view
  if (viewMode === 'explore' && mapState.level === 'planet' && !isLoading) {
    const quadrants = mapData?.quadrants || mapDataAny?.data?.quadrants || []
    const quadrant = quadrants.find((q: any) => q.id === mapState.selectedQuadrant) || quadrants[0]
    const sectors = quadrant?.sectors || []
    const sector = sectors.find((s: any) => s.id === mapState.selectedSector) || sectors[0]
    const galaxies = sector?.galaxies || []
    const galaxy = galaxies.find((g: any) => g.id === mapState.selectedGalaxy) || galaxies[0]
    let planets: Planet[] = galaxy?.planets || []
    
    if (planets.length === 0 && mapDataAny?.planets) {
      planets = mapDataAny.planets.filter((p: any) => {
        const coord = parseCoordinate(p.coordinate)
        return coord && 
          coord.quadrant === mapState.selectedQuadrant &&
          coord.sector === mapState.selectedSector &&
          coord.galaxy === mapState.selectedGalaxy
      })
    }
    
    if (planets.length === 0 && galaxyPlanetsData?.planets) {
      planets = galaxyPlanetsData.planets
    }
    
    // Generate random asteroid clusters for this galaxy
    const generateAsteroids = (count: number) => {
      const asteroids: Array<{ clusterX: number; clusterY: number; asteroids: Array<{ x: number; y: number; size: number; rotation: number }> }> = []
      for (let i = 0; i < count; i++) {
        const clusterX = Math.random() * 200 - 100
        const clusterY = Math.random() * 200 - 100
        const clusterSize = 3 + Math.floor(Math.random() * 3)
        const asteroidInCluster = []
        for (let j = 0; j < clusterSize; j++) {
          asteroidInCluster.push({
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5,
            size: 8 + Math.random() * 4,
            rotation: Math.random() * 360
          })
        }
        asteroids.push({ clusterX, clusterY, asteroids: asteroidInCluster })
      }
      return asteroids
    }
    const asteroids = generateAsteroids(12)
    
    if (planets && planets.length > 0) {
      return (
        <>
          <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
            {/* Header */}
            <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-start">
              <div className="panel-glass surface-gradient border-border/20 px-6 py-4 backdrop-blur-md rounded-lg">
                <h1 className="text-5xl font-heading glow-cyan mb-2">
                  Galaxy {mapState.selectedGalaxy} - {planets.length} Planets
                </h1>
                <p className="text-lg text-muted-foreground">Select a planet to view details</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1">
                  <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} className="h-8 w-8">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-mono px-2 min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
                  <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))} className="h-8 w-8">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={goBack} size="lg">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              </div>
            </div>

            {/* Planets with orbital rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="absolute w-[250%] h-[250%]" 
                style={{ 
                  left: '-75%',
                  top: '-75%',
                  overflow: 'visible',
                  animation: 'planet-orbit 300s linear infinite',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: '50% 50%',
                }}
              >
                {planets.map((_, index) => {
                  const radius = 300 + (index * 150)
                  return (
                    <circle
                      key={`orbit-${index}`}
                      cx="50%"
                      cy="50%"
                      r={radius}
                      fill="none"
                      stroke="rgba(6, 182, 212, 0.2)"
                      strokeWidth="2"
                      strokeDasharray="8,8"
                    />
                  )
                })}
              </svg>

              <div className="absolute inset-0" style={{ transform: `scale(${zoomLevel})`, transformOrigin: '50% 50%' }}>
                {planets.map((planet, index) => {
                  const radius = 300 + (index * 150)
                  const angle = (index * 137.5) * (Math.PI / 180)
                  const centerX = 50
                  const centerY = 50
                  const x = centerX + (radius * Math.cos(angle)) / 25
                  const y = centerY + (radius * Math.sin(angle)) / 25
                  
                  return (
                    <div
                      key={planet.id || formatCoordinate(planet.coordinate) || index}
                      className="absolute group cursor-pointer"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={() => handlePlanetClick(planet)}
                    >
                      <div className="relative">
                        <img
                          src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
                          alt={planet?.type?.name || 'Planet'}
                          className={cn(
                            "w-56 h-56 object-contain filter drop-shadow-2xl transition-all duration-300",
                            "group-hover:scale-125",
                            "group-hover:brightness-125"
                          )}
                          style={{ imageRendering: 'auto' }}
                        />
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full text-center mt-2">
                          <h3 className="text-base font-heading glow-cyan truncate">{planet.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {formatCoordinate(planet.coordinate)}
                          </p>
                        </div>
                      </div>
                      <div className="absolute -top-40 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-72">
                        <div className="parallelogram-box bg-background/95 backdrop-blur-sm border border-cyan-500/30 p-4 shadow-xl">
                          <div className="space-y-1 max-w-[180px] mr-[30px] ml-auto">
                            <div className="text-xs font-semibold text-foreground mb-1">
                              {planet.name}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">T:</span>
                              <span className="text-xs font-mono text-tellerium">{formatResource(planet.tellerium_balance)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">K:</span>
                              <span className="text-xs font-mono text-krypton">{formatResource(planet.krypton_balance)}</span>
                            </div>
                            <div className="pt-1 border-t border-border/50">
                              <span className="text-xs text-muted-foreground capitalize">{planet.type?.name || planet.type?.slug}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Asteroid clusters - rendered outside scaled container to maintain size */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {asteroids.map((cluster, clusterIdx) => (
                  <div
                    key={`asteroid-cluster-${clusterIdx}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${cluster.clusterX}%), calc(-50% + ${cluster.clusterY}%))`,
                    }}
                  >
                    {cluster.asteroids.map((asteroid, asteroidIdx) => (
                      <img
                        key={`asteroid-${clusterIdx}-${asteroidIdx}`}
                        src="/assets/images/planets/asteroid.png"
                        alt="Asteroid"
                        className="absolute opacity-80"
                        style={{
                          width: `${asteroid.size * 2}px`,
                          height: `${asteroid.size * 2}px`,
                          left: `${asteroid.x * 2}px`,
                          top: `${asteroid.y * 2}px`,
                          transform: `rotate(${asteroid.rotation}deg)`,
                        }}
                        onError={(e) => {
                          console.error('Asteroid image failed to load')
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <PlanetActionPanel
            planet={selectedPlanet}
            isOpen={!!selectedPlanet}
            onClose={handlePlanetPanelClose}
            onRefresh={() => {}}
          />
        </>
      )
    }
  }

  // Only show loading skeleton if we have no data at all and are still loading
  if (isLoading && !mapData && !universeStructure && !error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !mapData && !universeStructure) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Failed to load universe map</p>
            <p className="text-sm text-muted-foreground">{String(error)}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading glow-cyan">Universe Map</h1>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search coordinates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={handleSearch} variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          {/* Hide back button if user only has galaxy-level visibility (their own system) */}
          {mapState.level !== 'quadrant' && 
           visibilityData?.visibility_level !== 'galaxy' && (
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Breadcrumbs */}
      <NavigationBreadcrumbs
        quadrant={mapState.selectedQuadrant}
        sector={mapState.selectedSector}
        galaxy={mapState.selectedGalaxy}
        onNavigate={navigateToLevel}
        onCoordinateJump={handleCoordinateJump}
      />

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explore" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Explore
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="nearby" className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            Nearby
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Telescope className="w-4 h-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {/* Search Filters */}
          <Card className="panel-glass border-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-400" />
                Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Select
                    value={searchFilters.state || 'all'}
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, state: value === 'all' ? undefined : value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any state</SelectItem>
                      <SelectItem value="unsettled">Unsettled</SelectItem>
                      <SelectItem value="colony">Colony</SelectItem>
                      <SelectItem value="homeworld">Homeworld</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quadrant</label>
                  <Select
                    value={searchFilters.quadrant?.toString() || 'all'}
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, quadrant: value === 'all' ? undefined : parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any quadrant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any quadrant</SelectItem>
                      {[1, 2, 3, 4].map(q => (
                        <SelectItem key={q} value={q.toString()}>Quadrant {q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Habitable Only</label>
                  <Select
                    value={searchFilters.is_habitable?.toString() || 'all'}
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, is_habitable: value === 'all' ? undefined : value === 'true' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any planet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any planet</SelectItem>
                      <SelectItem value="true">Habitable only</SelectItem>
                      <SelectItem value="false">Non-habitable only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nearby" className="space-y-4">
          {renderNearbyPlanets()}
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card className="panel-glass border-yellow/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Telescope className="w-5 h-5 text-yellow-400" />
                Galaxy Discovery
              </CardTitle>
              <CardDescription>
                Use advanced scanning to reveal all planets in a galaxy
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="explore" className="space-y-6">
          {renderCurrentView()}
        </TabsContent>
      </Tabs>

      {/* Map Legend */}
      <Card className="panel-glass border-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-muted-foreground" />
            Map Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span>Colonized Planet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted-foreground rounded-full" />
              <span>Uncolonized Planet</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Homeworld</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span>Colony</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Planet Action Panel */}
      <PlanetActionPanel
        planet={selectedPlanet}
        isOpen={!!selectedPlanet}
        onClose={handlePlanetPanelClose}
        onRefresh={() => {
          // Refetch handled by RTK Query cache invalidation
        }}
      />
    </div>
  )
}
