import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber, formatResource } from '@/lib/formatters'
import { getPlanetImage } from '@/lib/planetImages'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { 
  Settings, Shield, Ship, FlaskConical, Send, 
  ArrowLeft, ArrowRight, Building2 
} from 'lucide-react'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Badge } from '@/components/ui/badge'
import { ConstructionQueue } from '@/components/construction/ConstructionQueue'

interface PlanetConsolePanelProps {
  planetId: number
}

export function PlanetConsolePanel({ planetId }: PlanetConsolePanelProps) {
  const { openPanel } = usePanel()
  const { data: planetData, isLoading, error } = useGetPlanetQuery(planetId, {
    skip: !planetId,
    refetchOnMountOrArgChange: true,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !planetData?.planet) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Failed to load planet data</p>
      </div>
    )
  }

  const planet = planetData.planet

  // Planet action buttons for opening tech trees with planet context
  const planetActions = [
    {
      id: 'facilities',
      icon: Settings,
      label: 'Facilities',
      description: 'Build and manage facilities',
      panelType: PanelType.TECH_TREE_FACILITIES,
      panelSize: PanelSize.XLARGE,
      color: 'text-purple-400',
    },
    {
      id: 'ships',
      icon: Ship,
      label: 'Ships',
      description: 'Build ships',
      panelType: PanelType.TECH_TREE_SHIPS,
      panelSize: PanelSize.XLARGE,
      color: 'text-blue-400',
    },
    {
      id: 'defenses',
      icon: Shield,
      label: 'Defenses',
      description: 'Build defenses',
      panelType: PanelType.TECH_TREE_DEFENSES,
      panelSize: PanelSize.XLARGE,
      color: 'text-red-400',
    },
    {
      id: 'research',
      icon: FlaskConical,
      label: 'Research',
      description: 'Conduct research',
      panelType: PanelType.TECH_TREE_RESEARCH,
      panelSize: PanelSize.XLARGE,
      color: 'text-green-400',
    },
    {
      id: 'fleet',
      icon: Send,
      label: 'Fleet Command',
      description: 'Launch fleets',
      panelType: PanelType.FLEET_COMMAND,
      panelSize: PanelSize.XLARGE,
      color: 'text-cyan-400',
    },
  ]

  const handleActionClick = (action: any) => {
    // Open panel with planet context
    openPanel(action.panelType, action.panelSize, { planetId: planet.id })
  }

  const getPlanetGlowColor = (slug?: string) => {
    switch (slug) {
      case 'arid':
        return 'shadow-orange-500/50'
      case 'oceanic':
        return 'shadow-blue-500/50'
      case 'volcanic':
        return 'shadow-red-500/50'
      case 'ice':
        return 'shadow-cyan-500/50'
      case 'asteroid':
        return 'shadow-gray-500/50'
      default:
        return 'shadow-cyan-500/50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Construction Queue */}
      <div className="space-y-2">
        <h3 className="text-xl font-heading flex items-center gap-2">
          <Building2 className="w-5 h-5 text-cyan-400" />
          Construction Queue
        </h3>
        <ConstructionQueue planetId={planet.id} />
      </div>

      {/* Planet Actions */}
      <div className="space-y-2">
        <h3 className="text-xl font-heading flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Planet Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planetActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                variant="outline"
                className="group flex h-auto flex-col items-start gap-3 rounded-xl border-cyan/20 p-4 transition-all panel-glass hover:border-cyan/50 hover:bg-cyan/5 md:p-6"
                onClick={() => handleActionClick(action)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`w-6 h-6 ${action.color} group-hover:scale-110 transition-transform`} />
                  <div className="flex-1 text-left">
                    <h4 className="text-lg font-semibold mb-1">{action.label}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => openPanel(PanelType.GALAXY_MAP, PanelSize.FULL_HEIGHT)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Map
        </Button>
      </div>
    </div>
  )
}

