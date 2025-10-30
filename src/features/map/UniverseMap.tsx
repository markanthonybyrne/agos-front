import { useState, useEffect } from 'react'
import { useGetMapQuery, useGetUniverseStructureQuery } from '@/api/endpoints/universeApi'
import { useSearchPlanetsQuery, useFindNearbyPlanetsQuery, useDiscoverGalaxyMutation } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCoordinate } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { toast } from 'sonner'
// Removed legacy maps in favor of WebGL UniverseStarMap
import { UniverseStarMap } from '@/components/map/UniverseStarMap'
import { useUniverseMapData } from '@/components/map/hooks/useUniverseMapData'
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
  RefreshCw
} from 'lucide-react'

type MapLevel = 'quadrant' | 'sector' | 'galaxy' | 'planet'
type ViewMode = 'explore' | 'search' | 'nearby' | 'discover' | 'visual'

interface MapState {
  level: MapLevel
  selectedQuadrant?: number
  selectedSector?: number
  selectedGalaxy?: number
  selectedPlanet?: number
}

interface PlanetInfo {
  coordinate: string
  name: string
  owner_empire_id?: number
  state: string
  distance?: number
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
  const [mapState, setMapState] = useState<MapState>({ level: 'quadrant' })
  const [viewMode, setViewMode] = useState<ViewMode>('explore')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetInfo | null>(null)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    limit: 20,
    offset: 0
  })
  const [discoveryCost, setDiscoveryCost] = useState<{ tellerium: number; krypton: number } | null>(null)

  const { data: mapData, isLoading, error } = useGetMapQuery({
    quadrant: mapState.selectedQuadrant,
    sector: mapState.selectedSector,
    galaxy: mapState.selectedGalaxy,
  })
  const mapDataAny: any = mapData as any
  
  // Debug logging
  console.log('Map API response:', mapData)
  console.log('Map state:', mapState)
  console.log('View mode:', viewMode)

  const { data: universeStructure, isLoading: isLoadingStructure } = useGetUniverseStructureQuery()

  const { data: searchResults, isLoading: isSearching } = useSearchPlanetsQuery(searchFilters, {
    skip: viewMode !== 'search'
  })

  const { data: nearbyPlanets, isLoading: isLoadingNearby } = useFindNearbyPlanetsQuery(undefined, {
    skip: viewMode !== 'nearby'
  })

  const [discoverGalaxy, { isLoading: isDiscovering }] = useDiscoverGalaxyMutation()

  // WebGL star map data (planets + fleets)
  const { planets: starPlanets, fleets: starFleets } = useUniverseMapData()

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

  const getBreadcrumb = () => {
    const parts = ['Universe']
    if (mapState.selectedQuadrant) parts.push(`Q${mapState.selectedQuadrant}`)
    if (mapState.selectedSector) parts.push(`S${mapState.selectedSector}`)
    if (mapState.selectedGalaxy) parts.push(`G${mapState.selectedGalaxy}`)
    return parts.join(' → ')
  }

  const renderQuadrantView = () => {
    // Handle the actual API response structure
    const quadrants = mapData?.quadrants || mapDataAny?.data?.quadrants || []
    
    // If no quadrants data, show planets directly since we have 1930 planets
    if (!quadrants || quadrants.length === 0) {
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
                      onMouseEnter={() => setHoveredPlanet(planet)}
                      onMouseLeave={() => setHoveredPlanet(null)}
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

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quadrants.map((quadrant: any) => (
          <Card 
            key={quadrant.id} 
            className="panel-glass border-cyan/20 cursor-pointer hover:border-cyan/40 transition-colors"
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
        ))}
      </div>
    )
  }

  const renderSectorView = () => {
    const quadrants = mapData?.quadrants || mapDataAny?.data?.quadrants || []
    const sectors = quadrants[0]?.sectors || []
    if (!sectors || sectors.length === 0) {
      return (
        <Card className="panel-glass border-blue/20">
          <CardContent className="pt-6 text-center">
            <Layers className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sectors Found</h3>
            <p className="text-muted-foreground">
              Unable to load sector data for this quadrant.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {sectors.map((sector: any) => (
          <Card 
            key={sector.id} 
            className="panel-glass border-blue/20 cursor-pointer hover:border-blue/40 transition-colors"
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
        ))}
      </div>
    )
  }

  const renderGalaxyView = () => {
    const quadrants = mapData?.quadrants || mapDataAny?.data?.quadrants || []
    const sectors = quadrants[0]?.sectors || []
    const galaxies = sectors[0]?.galaxies || []
    if (!galaxies || galaxies.length === 0) {
      return (
        <Card className="panel-glass border-purple/20">
          <CardContent className="pt-6 text-center">
            <Star className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Galaxies Found</h3>
            <p className="text-muted-foreground">
              Unable to load galaxy data for this sector.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {galaxies.map((galaxy: any) => (
          <Card 
            key={galaxy.id} 
            className="panel-glass border-purple/20 cursor-pointer hover:border-purple/40 transition-colors"
            onClick={() => navigateToLevel('planet', galaxy)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="w-5 h-5 text-purple-400" />
                Galaxy {galaxy.id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Planets:</span>
                  <span className="font-mono">{galaxy.planets?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Colonized:</span>
                  <span className="font-mono">
                    {galaxy.planets?.filter((p: any) => p.owner_empire_id).length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

        const renderPlanetView = () => {
          const planets: any[] = mapDataAny?.planets || mapDataAny?.data?.planets || []
          if (!planets || planets.length === 0) {
            return (
              <Card className="panel-glass border-green/20">
                <CardContent className="pt-6 text-center">
                  <Circle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Planets Found</h3>
                  <p className="text-muted-foreground">
                    Unable to load planet data for this galaxy.
                  </p>
                </CardContent>
              </Card>
            )
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planets.map((planet: any) => {
          const coordString = formatCoordinate(planet.coordinate)
          const coordParts = coordString.split(':')
          return (
            <Card 
              key={coordString} 
              className={`panel-glass cursor-pointer transition-colors ${
                planet.owner_empire_id 
                  ? 'border-green/20 hover:border-green/40' 
                  : 'border-muted/20 hover:border-muted/40'
              }`}
              onMouseEnter={() => setHoveredPlanet(planet)}
              onMouseLeave={() => setHoveredPlanet(null)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Circle className={`w-5 h-5 ${
                    planet.owner_empire_id ? 'text-green-400' : 'text-muted-foreground'
                  }`} />
                  {planet.name || `Planet ${coordParts[3]}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Coordinate:</span>
                    <span className="font-mono">{coordString}</span>
                  </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge 
                    variant={planet.owner_empire_id ? 'default' : 'outline'}
                    className={planet.owner_empire_id ? 'bg-green-500' : ''}
                  >
                    {planet.state}
                  </Badge>
                </div>
                {planet.owner_empire_id && (
                  <div className="flex justify-between">
                    <span>Owner:</span>
                    <span className="font-mono">Empire #{planet.owner_empire_id}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )
        })}
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
    const planets = searchResults?.planets || searchResultsAny?.data?.planets || []
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planets.map((planet: any) => (
            <Card 
              key={planet.coordinate} 
              className={`panel-glass cursor-pointer transition-colors ${
                planet.owner_empire_id 
                  ? 'border-green/20 hover:border-green/40' 
                  : 'border-muted/20 hover:border-muted/40'
              }`}
              onMouseEnter={() => setHoveredPlanet(planet)}
              onMouseLeave={() => setHoveredPlanet(null)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Circle className={`w-5 h-5 ${
                    planet.owner_empire_id ? 'text-green-400' : 'text-muted-foreground'
                  }`} />
                  {planet.name || `Planet ${formatCoordinate(planet.coordinate).split(':')[3]}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Coordinate:</span>
                    <span className="font-mono">{formatCoordinate(planet.coordinate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge 
                      variant={planet.owner_empire_id ? 'default' : 'outline'}
                      className={planet.owner_empire_id ? 'bg-green-500' : ''}
                    >
                      {planet.state}
                    </Badge>
                  </div>
                  {planet.owner_empire_id && (
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span className="font-mono">Empire #{planet.owner_empire_id}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
    const planets = nearbyPlanets?.planets || nearbyAny?.data?.planets || []
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planets.map((planet: any) => (
            <Card 
              key={planet.coordinate} 
              className="panel-glass cursor-pointer transition-colors border-cyan/20 hover:border-cyan/40"
              onMouseEnter={() => setHoveredPlanet(planet)}
              onMouseLeave={() => setHoveredPlanet(null)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  {planet.name || `Planet ${formatCoordinate(planet.coordinate).split(':')[3]}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Coordinate:</span>
                    <span className="font-mono">{formatCoordinate(planet.coordinate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="outline">
                      {planet.state}
                    </Badge>
                  </div>
                  {planet.distance && (
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-mono">{planet.distance} galaxies</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

  // Legacy visual map removed

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'visual':
        return null
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

  if (isLoading) {
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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Failed to load universe map</p>
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
          <p className="text-muted-foreground">{getBreadcrumb()}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search coordinates or filters..."
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
          {mapState.level !== 'quadrant' && (
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Stellar Map
          </TabsTrigger>
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

        <TabsContent value="visual" className="space-y-6">
          {/* New WebGL Universe Star Map */}
          <Card className="panel-glass border-cyan/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-cyan-400" />
                Universe Star Map (WebGL)
              </CardTitle>
              <CardDescription>Pan and zoom to explore. Live data layers will be added.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <UniverseStarMap className="w-full h-[600px]" planets={starPlanets} fleets={starFleets} />
            </CardContent>
          </Card>
        </TabsContent>

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
                    value={searchFilters.state || ''}
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, state: value as any || undefined }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any state</SelectItem>
                      <SelectItem value="unsettled">Unsettled</SelectItem>
                      <SelectItem value="colony">Colony</SelectItem>
                      <SelectItem value="homeworld">Homeworld</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quadrant</label>
                  <Select
                    value={searchFilters.quadrant?.toString() || ''}
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, quadrant: value ? parseInt(value) : undefined }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any quadrant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any quadrant</SelectItem>
                      {[1, 2, 3, 4].map(q => (
                        <SelectItem key={q} value={q.toString()}>Quadrant {q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Habitable Only</label>
                  <Select
                    value={searchFilters.is_habitable?.toString() || ''}
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, is_habitable: value === 'true' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any planet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any planet</SelectItem>
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
          <Card className="panel-glass border-cyan/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                Nearby Colonizable Planets
              </CardTitle>
              <CardDescription>
                Planets within 2 galaxies of your territory that can be colonized
              </CardDescription>
            </CardHeader>
          </Card>
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
          {renderQuadrantView()}
        </TabsContent>
      </Tabs>

      {/* Planet Tooltip */}
      {hoveredPlanet && (
        <Card className="fixed bottom-4 right-4 z-50 panel-glass border-cyan/20 max-w-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Circle className="w-5 h-5 text-cyan-400" />
              {hoveredPlanet.name || `Planet ${formatCoordinate(hoveredPlanet.coordinate).split(':')[3]}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Coordinate:</span>
                <span className="font-mono">{formatCoordinate(hoveredPlanet.coordinate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge 
                  variant={hoveredPlanet.owner_empire_id ? 'default' : 'outline'}
                  className={hoveredPlanet.owner_empire_id ? 'bg-green-500' : ''}
                >
                  {hoveredPlanet.state}
                </Badge>
              </div>
              {hoveredPlanet.owner_empire_id && (
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="font-mono">Empire #{hoveredPlanet.owner_empire_id}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  )
}
