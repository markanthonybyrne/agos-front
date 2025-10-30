import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BuildableItems as BuildableItemsType, BuildableItem } from '@/types/api.types'
import { formatResource, formatNumber } from '@/lib/formatters'
import { usePrerequisites } from '@/hooks/usePrerequisites'
import { 
  Settings, 
  Shield, 
  Ship, 
  FlaskConical, 
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Lock,
  AlertCircle
} from 'lucide-react'

interface BuildableItemsProps {
  planetId: number
  buildableItems: BuildableItemsType
  onBuildItem: (type: string, slug: string) => void
  className?: string
}

export function BuildableItems({ 
  planetId, 
  buildableItems, 
  onBuildItem,
  className = ''
}: BuildableItemsProps) {
  const [activeTab, setActiveTab] = useState('facilities')

  // Handle case where buildableItems is not loaded yet
  if (!buildableItems) {
    return (
      <Card className={`panel-glass border-cyan/20 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Buildable Items
          </CardTitle>
          <CardDescription>
            Loading buildable items...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Debug logging
  console.log('BuildableItems in component:', buildableItems)
  console.log('Facilities type:', typeof buildableItems?.facilities, Array.isArray(buildableItems?.facilities))

  // Helper function to safely get arrays
  const safeArray = (arr: any): any[] => {
    return Array.isArray(arr) ? arr : []
  }

  // Get all buildable items for prerequisites checking
  const allItems = [
    ...safeArray(buildableItems?.facilities),
    ...safeArray(buildableItems?.defences),
    ...safeArray(buildableItems?.ships),
    ...safeArray(buildableItems?.research),
  ]

  const {
    canBuildItem,
    getMissingPrerequisites,
    getCompletedPrerequisites,
    getCompletionPercentage,
  } = usePrerequisites(planetId, allItems)

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'facilities':
        return Settings
      case 'defences':
        return Shield
      case 'ships':
        return Ship
      case 'research':
        return FlaskConical
      default:
        return Plus
    }
  }

  const getItemColor = (type: string) => {
    switch (type) {
      case 'facilities':
        return 'text-purple-400'
      case 'defences':
        return 'text-red-400'
      case 'ships':
        return 'text-blue-400'
      case 'research':
        return 'text-green-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const renderItem = (item: BuildableItem, type: string) => {
    const Icon = getItemIcon(type)
    const canBuild = canBuildItem(item.slug)
    const missingPrerequisites = getMissingPrerequisites(item.slug)
    const completedPrerequisites = getCompletedPrerequisites(item.slug)
    const completionPercentage = getCompletionPercentage(item.slug)
    const costTellerium = 'tellerium_cost' in item ? (item as any).tellerium_cost : item.base_tellerium_cost
    const costKrypton = 'krypton_cost' in item ? (item as any).krypton_cost : item.base_krypton_cost

    return (
      <div
        key={item.slug}
        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
          canBuild 
            ? 'bg-muted/10 border-border/50 hover:bg-muted/20' 
            : 'bg-muted/5 border-border/30 opacity-75'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Icon className={`w-5 h-5 ${getItemColor(type)}`} />
            {!canBuild && (
              <Lock className="w-3 h-3 text-red-400 absolute -top-1 -right-1" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium ${!canBuild ? 'text-muted-foreground' : ''}`}>
                {item.name}
              </h4>
              {canBuild ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {item.description}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400">
                  {formatResource(costTellerium)} T
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400">
                  {formatResource(costKrypton)} K
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {formatNumber((item as any).build_time_ticks ?? item.build_time ?? 0)} {((item as any).build_time_ticks || item.build_time) ? 'ticks' : ''}
                </span>
              </div>
            </div>
            
            {/* Prerequisites Display */}
            {(completedPrerequisites.length > 0 || missingPrerequisites.length > 0) && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-muted-foreground">Prerequisites:</p>
                  <div className="flex-1 bg-muted/20 rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(completionPercentage)}%
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {completedPrerequisites.map((prereq, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs text-green-400 border-green-400/50"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {prereq.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {missingPrerequisites.map((prereq, index) => (
                    <Badge
                      key={index}
                      variant="destructive"
                      className="text-xs"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      {prereq.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={() => onBuildItem(type, item.slug)}
                disabled={!canBuild}
                className="ml-4"
              >
                {canBuild ? (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Build
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-1" />
                    Locked
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {!canBuild && missingPrerequisites.length > 0 && (
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Missing Prerequisites:</p>
                  <ul className="text-xs space-y-1">
                    {missingPrerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-400" />
                        {prereq.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  const tabs = [
    {
      id: 'facilities',
      label: 'Facilities',
      icon: Settings,
      items: safeArray(buildableItems?.facilities),
    },
    {
      id: 'defences',
      label: 'Defences',
      icon: Shield,
      items: safeArray(buildableItems?.defences),
    },
    {
      id: 'ships',
      label: 'Ships',
      icon: Ship,
      items: safeArray(buildableItems?.ships),
    },
    {
      id: 'research',
      label: 'Research',
      icon: FlaskConical,
      items: safeArray(buildableItems?.research),
    },
  ]

  return (
    <Card className={`panel-glass border-cyan/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-cyan-400" />
          Buildable Items
        </CardTitle>
        <CardDescription>
          Items you can build on this planet based on current prerequisites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <div className="space-y-3">
                {tab.items.length > 0 ? (
                  tab.items.map((item) => renderItem(item, tab.id))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <tab.icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No {tab.label.toLowerCase()} available</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
