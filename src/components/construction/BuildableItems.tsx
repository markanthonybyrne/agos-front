import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BuildableItems as BuildableItemsType, BuildableItem } from '@/types/api.types'
import { formatResource } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { formatPrerequisiteSlug, getDefenceRequirements } from '@/lib/prerequisites'
import { 
  Settings, 
  Shield, 
  Ship, 
  FlaskConical, 
  Plus,
  CheckCircle,
  Clock,
  Lock,
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
  layout?: 'grid' | 'list'
}

export function BuildableItems({ 
  planetId, 
  buildableItems, 
  onBuildItem,
  className = '',
  layout = 'grid'
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
      items: safeArray(buildableItems?.defences).filter((defence: any) => defence?.can_build !== false),
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

  const renderList = (items: BuildableItem[], type: string) => (
    <div className="space-y-2">
      {items.map((item) => {
        const costT = (item as any).tellerium_cost ?? item.base_tellerium_cost ?? 0
        const costK = (item as any).krypton_cost ?? item.base_krypton_cost ?? 0
        const image = getItemImage(item, type)
        const isDefenceTab = type === 'defences'
        const canBuild = !isDefenceTab || (item as any)?.can_build !== false
        const missingPrereqs: string[] = isDefenceTab
          ? Array.isArray((item as any)?.missing_prerequisites)
            ? ((item as any)?.missing_prerequisites as string[])
            : []
          : []
        const requirementConfig = isDefenceTab ? getDefenceRequirements(item.slug) : { facilities: [], research: [] }
        const defenceRequirementBadges = isDefenceTab
          ? (() => {
              const badges: { slug: string; type: 'facility' | 'research' | 'unknown'; met: boolean }[] = []
              const seen = new Set<string>()
              requirementConfig.facilities.forEach((facilitySlug) => {
                badges.push({ slug: facilitySlug, type: 'facility', met: !missingPrereqs.includes(facilitySlug) })
                seen.add(facilitySlug)
              })
              requirementConfig.research.forEach((researchSlug) => {
                badges.push({ slug: researchSlug, type: 'research', met: !missingPrereqs.includes(researchSlug) })
                seen.add(researchSlug)
              })
              missingPrereqs.forEach((missingSlug) => {
                if (seen.has(missingSlug)) return
                badges.push({ slug: missingSlug, type: 'unknown', met: false })
              })
              return badges
            })()
          : []
        const statusBadgeClass = canBuild
          ? 'border-emerald-500/40 text-emerald-200'
          : 'border-red-500/40 text-red-200'
        const buttonLabel = canBuild ? 'Queue' : 'Locked'
        const StatusIcon = canBuild ? CheckCircle : Lock

        return (
          <div
            key={item.slug}
            className="glass-section border-cyan-500/40 p-3 flex items-center gap-3 transition hover:border-cyan-300/50"
          >
            {image && (
              <img
                src={image}
                alt={item.name}
                className="h-12 w-12 rounded-md object-contain"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate font-semibold text-sm text-cyan-100">{item.name}</div>
                <Badge
                  variant="outline"
                  className={cn('text-[11px] flex items-center gap-1', statusBadgeClass)}
                  title={canBuild ? 'Ready to queue' : 'Missing prerequisites'}
                >
                  <StatusIcon className="w-3 h-3" />
                  {canBuild ? 'Ready' : 'Locked'}
                </Badge>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {formatResource(costT)} T · {formatResource(costK)} K
              </div>
              {isDefenceTab && defenceRequirementBadges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {defenceRequirementBadges.map((badge) => {
                    const met = badge.met
                    const badgeClass = met
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-red-500/40 bg-red-500/10 text-red-200'
                    const prefix = badge.type === 'facility' ? 'Facility' : badge.type === 'research' ? 'Research' : 'Requirement'
                    return (
                      <Badge
                        key={`${badge.type}-${badge.slug}`}
                        variant="outline"
                        className={cn('text-[10px] uppercase tracking-[0.2em]', badgeClass)}
                        title={`${prefix}: ${formatPrerequisiteSlug(badge.slug)}`}
                      >
                        {prefix}: {formatPrerequisiteSlug(badge.slug)}
                      </Badge>
                    )
                  })}
                </div>
              )}

              {!isDefenceTab && Array.isArray((item as any)?.prerequisite_research) && (item as any).prerequisite_research.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {((item as any).prerequisite_research as string[]).map((slug) => (
                    <Badge
                      key={slug}
                      variant="outline"
                      className="text-[10px] uppercase tracking-[0.2em] border-blue-400/40 bg-blue-500/10 text-blue-200"
                      title={`Research prerequisite: ${formatPrerequisiteSlug(slug)}`}
                    >
                      Research: {formatPrerequisiteSlug(slug)}
                    </Badge>
                  ))}
                </div>
              )}
              {isDefenceTab && missingPrereqs.length > 0 && (
                <p className="mt-2 text-[11px] text-red-200">
                  Missing: {missingPrereqs.map((slug) => formatPrerequisiteSlug(slug)).join(', ')}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => onBuildItem(type, item.slug)}
              disabled={!canBuild}
              className={!canBuild ? 'cursor-not-allowed opacity-60' : undefined}
            >
              {buttonLabel}
            </Button>
          </div>
        )
      })}
    </div>
  )

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
                {tab.items.length > 0 ? (
                layout === 'list'
                  ? renderList(
                      tab.items.filter((item) => item && typeof item === 'object' && item.slug) as BuildableItem[],
                      tab.id,
                    )
                  : (
                  <VisualItemGrid
                    items={tab.items
                          .filter((item) => item != null && typeof item === 'object' && item.slug)
                      .map((item) => {
                            const costT =
                              item != null && typeof item === 'object' && 'tellerium_cost' in item
                          ? (item as any).tellerium_cost
                                : item?.base_tellerium_cost ?? 0
                            const costK =
                              item != null && typeof item === 'object' && 'krypton_cost' in item
                          ? (item as any).krypton_cost
                                : item?.base_krypton_cost ?? 0
                            const isDefenceTab = tab.id === 'defences'
                            const canBuild = !isDefenceTab || (item as any)?.can_build !== false
                            const missingPrereqs: string[] = isDefenceTab
                              ? Array.isArray((item as any)?.missing_prerequisites)
                                ? ((item as any)?.missing_prerequisites as string[])
                                : []
                              : []
                            const requirementConfig = isDefenceTab ? getDefenceRequirements(item?.slug || '') : { facilities: [], research: [] }
                            const badgeClass = canBuild
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                            const badgeLabel = canBuild ? 'Ready' : 'Locked'
                            const extraDescription = isDefenceTab && missingPrereqs.length > 0
                              ? ` — Missing: ${missingPrereqs.map((slug) => formatPrerequisiteSlug(slug)).join(', ')}`
                              : ''
                            const StatusIcon = canBuild ? CheckCircle : Lock

                            const handleClick = () => {
                              if (!item?.slug || !canBuild) return
                              onBuildItem(tab.id, item.slug)
                            }
                        
                        return {
                          id: item?.slug || 'unknown',
                          name: item?.name || 'Unknown',
                          image: getItemImage(item, tab.id),
                          imageAlt: item?.name || 'Unknown',
                              description: `${formatResource(costT)} T, ${formatResource(costK)} K${extraDescription}`,
                          badge: (
                                <Badge
                                  variant="outline"
                                  className={cn('flex items-center gap-1', badgeClass)}
                                  title={canBuild ? 'Ready to queue' : 'Missing prerequisites'}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {badgeLabel}
                            </Badge>
                          ),
                              onClick: handleClick,
                              disabled: !canBuild,
                        }
                      })
                    }
                    columns={4}
                  />
                    )
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <tab.icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No {tab.label.toLowerCase()} available</p>
                    <p className="text-sm mt-2">Complete prerequisites to unlock more items</p>
                  </div>
                )}
              </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
