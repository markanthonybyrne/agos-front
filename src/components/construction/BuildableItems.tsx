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
import { VisualItemGrid } from '@/components/planet/VisualItemGrid'
import { Badge } from '@/components/ui/badge'
import { getFacilityImage } from '@/lib/facilityImages'
import { getDefenseImage } from '@/lib/defenseImages'
import { getShipImage } from '@/lib/shipImages'

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

  const getItemImage = (item: BuildableItem, type: string): string | undefined => {
    switch (type) {
      case 'facilities':
        return getFacilityImage(item.slug)
      case 'defences':
        return getDefenseImage(item.slug)
      case 'ships':
        return getShipImage(item.slug)
      default:
        return undefined
    }
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
          {tabs.map((tab) => {
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-4">
                {tab.items.length > 0 ? (
                  <VisualItemGrid
                    items={tab.items
                      .filter((item) => item != null && typeof item === 'object' && item.slug) // Filter out null/undefined/invalid items
                      .map((item) => {
                        // Safely check for cost properties
                        const costT = item != null && typeof item === 'object' && 'tellerium_cost' in item
                          ? (item as any).tellerium_cost
                          : (item?.base_tellerium_cost ?? 0)
                        const costK = item != null && typeof item === 'object' && 'krypton_cost' in item
                          ? (item as any).krypton_cost
                          : (item?.base_krypton_cost ?? 0)
                        
                        return {
                          id: item?.slug || 'unknown',
                          name: item?.name || 'Unknown',
                          image: getItemImage(item, tab.id),
                          imageAlt: item?.name || 'Unknown',
                          description: `${formatResource(costT)} T, ${formatResource(costK)} K`,
                          badge: (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ready
                            </Badge>
                          ),
                          onClick: () => item?.slug && onBuildItem(tab.id, item.slug),
                        }
                      })
                    }
                    columns={4}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <tab.icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No {tab.label.toLowerCase()} available</p>
                    <p className="text-sm mt-2">Complete prerequisites to unlock more items</p>
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
