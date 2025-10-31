import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BuildableItems as BuildableItemsType, BuildableItem } from '@/types/api.types'
import { formatResource, formatNumber } from '@/lib/formatters'
import { 
  Settings, 
  Shield, 
  Ship, 
  FlaskConical, 
  Plus,
  CheckCircle,
  Clock,
  Zap
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

  // Helper function to safely get arrays
  // Handles both arrays and objects with numeric keys (array-like objects)
  const safeArray = (arr: any): any[] => {
    if (Array.isArray(arr)) {
      return arr
    }
    if (arr && typeof arr === 'object') {
      // Convert object to array by taking its values
      const values = Object.values(arr)
      // Filter out any undefined/null values and ensure we have valid items
      return values.filter(item => item != null && typeof item === 'object')
    }
    return []
  }

  // Debug logging
  console.log('BuildableItems in component:', buildableItems)
  console.log('Facilities type:', typeof buildableItems?.facilities, Array.isArray(buildableItems?.facilities))
  
  // Test safeArray with logging
  const facilitiesArray = safeArray(buildableItems?.facilities)
  const shipsArray = safeArray(buildableItems?.ships)
  console.log('Extracted facilities array:', facilitiesArray.length, facilitiesArray)
  console.log('Extracted ships array:', shipsArray.length, shipsArray)

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
    const costTellerium = 'tellerium_cost' in item ? (item as any).tellerium_cost : item.base_tellerium_cost
    const costKrypton = 'krypton_cost' in item ? (item as any).krypton_cost : item.base_krypton_cost

    return (
      <div
        key={item.slug}
        className="flex items-center justify-between p-4 rounded-lg border transition-colors bg-muted/10 border-border/50 hover:bg-muted/20"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Icon className={`w-5 h-5 ${getItemColor(type)}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">
                {item.name}
              </h4>
              <CheckCircle className="w-4 h-4 text-green-400" />
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
          </div>
        </div>
        
        <Button
          size="sm"
          onClick={() => onBuildItem(type, item.slug)}
          className="ml-4"
        >
          <Plus className="w-4 h-4 mr-1" />
          Build
        </Button>
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
