import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber, formatResource } from '@/lib/formatters'
import { getPlanetImage } from '@/lib/planetImages'
import { getTelleriumImage, getKryptonImage, getMineImage, getProbeImage } from '@/lib/resourceImages'
import { OverviewTab } from './tabs/OverviewTab'
import { FacilitiesTab } from './tabs/FacilitiesTab'
import { ResourcesTab } from './tabs/ResourcesTab'
import { FleetsTab } from './tabs/FleetsTab'
import { DefensesTab } from './tabs/DefensesTab'
import { ShipsTab } from './tabs/ShipsTab'
import { ResearchTab } from './tabs/ResearchTab'
import { ConstructionQueue } from '@/components/construction/ConstructionQueue'
import { BuildableItems } from '@/components/construction/BuildableItems'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
import { ModeSwitcher, ModeType } from '@/components/navigation/ModeSwitcher'
import { PlanetBackground } from '@/components/planet/PlanetBackground'

export function PlanetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeMode, setActiveMode] = useState<ModeType>('colony')

  const { data: planetData, isLoading, error, refetch: refetchPlanet } = useGetPlanetQuery(Number(id), {
    skip: !id,
    refetchOnMountOrArgChange: true, // Refetch when component mounts or id changes
  })
  const planet = planetData?.planet
  const { data: buildableItemsData } = useGetBuildableItemsQuery(Number(id), {
    skip: !id,
  })
  const buildableItems = buildableItemsData
  
  // Debug logging
  if (buildableItemsData) {
    console.log('BuildableItems data:', buildableItemsData)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (error || !planet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive mb-4">Planet Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The planet you're looking for doesn't exist or you don't have access to it.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => refetchPlanet()}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => navigate('/planets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Planets
          </Button>
        </div>
      </div>
    )
  }

  const renderModeContent = () => {
    if (!planet) return null
    
    switch (activeMode) {
      case 'system':
        return <OverviewTab planet={planet} />
      case 'colony':
        return buildableItems ? (
          <BuildableItems 
            planetId={planet.id} 
            buildableItems={buildableItems}
            onBuildItem={(type, slug) => {
              // Navigate to the appropriate mode based on type
              switch (type) {
                case 'facilities':
                  setActiveMode('infrastructure')
                  break
                case 'defences':
                  setActiveMode('infrastructure')
                  break
                case 'ships':
                  setActiveMode('production')
                  break
                case 'research':
                  setActiveMode('research')
                  break
                default:
                  break
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading buildable items...</div>
          </div>
        )
      case 'infrastructure':
        return <FacilitiesTab planet={planet} />
      case 'production':
        return <ShipsTab planet={planet} />
      case 'research':
        return <ResearchTab planet={planet} />
      case 'fleets':
        return <FleetsTab planet={planet} />
      default:
        return <OverviewTab planet={planet} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/planets')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <img
            src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
            alt={planet?.type?.name || planet.type?.slug || 'Planet'}
            className="w-20 h-20 object-contain flex-shrink-0"
            style={{ imageRendering: 'auto', display: 'block' }}
            onError={(e) => {
              console.error('Planet image failed to load:', planet?.type?.slug)
            }}
          />
        <div>
          <h1 className="text-3xl font-heading glow-cyan">{planet.name}</h1>
          <p className="text-muted-foreground">
            {formatCoordinate(planet.coordinate)} • {planet.state}
              {planet?.type?.name && (
                <>
                  {' '}• <span className="capitalize">{planet.type.name}</span>
                </>
              )}
          </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="panel-glass border-cyan/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tellerium">Tellerium</p>
                <p className="text-2xl font-mono text-tellerium glow-cyan">
                  {formatResource(planet.tellerium_balance)}
                </p>
              </div>
              <img
                src={getTelleriumImage()}
                alt="Tellerium"
                className="w-10 h-10 object-contain flex-shrink-0"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-krypton">Krypton</p>
                <p className="text-2xl font-mono text-krypton glow-blue">
                  {formatResource(planet.krypton_balance)}
                </p>
              </div>
              <img
                src={getKryptonImage()}
                alt="Krypton"
                className="w-10 h-10 object-contain flex-shrink-0"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-green/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mines</p>
                <p className="text-2xl font-mono glow-green">
                  {formatNumber(planet.mines)}
                </p>
              </div>
              <img
                src={getMineImage()}
                alt="Mine"
                className="w-10 h-10 object-contain flex-shrink-0"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-purple/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Probes</p>
                <p className="text-2xl font-mono glow-purple">
                  {formatNumber(planet.probes)}
                </p>
              </div>
              <img
                src={getProbeImage()}
                alt="Probe"
                className="w-10 h-10 object-contain flex-shrink-0"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Construction Queue */}
      <ConstructionQueue 
        planetId={planet.id} 
        onConstructionComplete={() => {
          // Refresh planet data when construction completes
          window.location.reload()
        }}
      />

      {/* Mode Switcher */}
      <ModeSwitcher 
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

      {/* Mode Content with Planet Background */}
      <PlanetBackground 
        planetSlug={planet?.type?.slug}
        className="p-6"
      >
        <div className="min-h-[600px]">
          {renderModeContent()}
        </div>
      </PlanetBackground>
    </div>
  )
}
