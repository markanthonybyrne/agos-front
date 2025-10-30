import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MapPin, Zap, Shield, Ship, Settings, FlaskConical, ArrowRight } from 'lucide-react'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber, formatResource } from '@/lib/formatters'
import { getPlanetImage } from '@/lib/planetImages'
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

type TabType = 'overview' | 'facilities' | 'resources' | 'fleets' | 'defenses' | 'ships' | 'research' | 'buildable'

const tabs = [
  { id: 'overview' as TabType, label: 'Overview', icon: MapPin },
  { id: 'buildable' as TabType, label: 'Buildable', icon: Settings },
  { id: 'facilities' as TabType, label: 'Facilities', icon: Settings },
  { id: 'ships' as TabType, label: 'Ships', icon: Ship },
  { id: 'defenses' as TabType, label: 'Defenses', icon: Shield },
  { id: 'research' as TabType, label: 'Research', icon: FlaskConical },
  { id: 'resources' as TabType, label: 'Resources', icon: Zap },
  { id: 'fleets' as TabType, label: 'Fleets', icon: ArrowRight },
]

export function PlanetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const { data: planetData, isLoading, error, refetch: refetchPlanet } = useGetPlanetQuery(Number(id), {
    skip: !id,
    refetchOnMountOrArgChange: false, // Prevent unnecessary refetches
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

  const renderTabContent = () => {
    if (!planet) return null
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab planet={planet} />
      case 'buildable':
        return buildableItems ? (
          <BuildableItems 
            planetId={planet.id} 
            buildableItems={buildableItems}
            onBuildItem={(type, slug) => {
              // Navigate to the appropriate tab based on type
              switch (type) {
                case 'facilities':
                  setActiveTab('facilities')
                  break
                case 'defences':
                  setActiveTab('defenses')
                  break
                case 'ships':
                  setActiveTab('ships')
                  break
                case 'research':
                  setActiveTab('research')
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
      case 'facilities':
        return <FacilitiesTab planet={planet} />
      case 'ships':
        return <ShipsTab planet={planet} />
      case 'defenses':
        return <DefensesTab planet={planet} />
      case 'research':
        return <ResearchTab planet={planet} />
      case 'resources':
        return <ResourcesTab planet={planet} />
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
        <div className="flex items-center gap-3">
          {planet?.type?.slug && (
            <img
              src={getPlanetImage(planet.type.slug)}
              alt={planet?.type?.name || planet.type.slug}
              className="w-10 h-10 rounded object-cover"
            />
          )}
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
                <p className="text-sm text-muted-foreground">Tellerium</p>
                <p className="text-2xl font-mono glow-cyan">
                  {formatResource(planet.tellerium_balance)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Krypton</p>
                <p className="text-2xl font-mono glow-blue">
                  {formatResource(planet.krypton_balance)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-blue-400" />
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
              <Settings className="w-8 h-8 text-green-400" />
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
              <Shield className="w-8 h-8 text-purple-400" />
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

            {/* Tabs */}
            <div className="space-y-6">
              <div className="flex space-x-1 bg-muted/20 p-1 rounded-lg">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </Button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {renderTabContent()}
              </div>
            </div>
    </div>
  )
}
