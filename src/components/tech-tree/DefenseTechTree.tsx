import { useMemo } from 'react'
import { useGetDefenceDefinitionsQuery, useGetPlanetDefencesQuery } from '@/api/endpoints/defencesApi'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
import { HexagonalTechTree, TechTreeItem } from './HexagonalTechTree'
import { HexagonStatus } from './HexagonNode'
import { getDefenseImage } from '@/lib/defenseImages'
import { Skeleton } from '@/components/ui/skeleton'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType } from '@/app/slices/panelSlice'
import { toast } from 'sonner'

interface DefenseTechTreeProps {
  planetId: number
  className?: string
}

export function DefenseTechTree({ planetId, className }: DefenseTechTreeProps) {
  const { openPanel } = usePanel()
  const { data: definitions, isLoading: isLoadingDefinitions } = useGetDefenceDefinitionsQuery()
  const { data: planetDefences } = useGetPlanetDefencesQuery(planetId)
  const { data: buildableItems } = useGetBuildableItemsQuery(planetId)
  
  const defencesList = useMemo(() => {
    if (!planetDefences || !planetDefences.defences) return []
    
    const pd: any = planetDefences
    return pd.defences || pd.data?.defences || []
  }, [planetDefences])

  const techTreeItems: TechTreeItem[] = useMemo(() => {
    if (!definitions?.defences || !buildableItems?.defences) return []

    // Get buildable defence slugs
    const buildableSlugs = new Set(
      Array.isArray(buildableItems.defences)
        ? buildableItems.defences.map((d: any) => d.slug)
        : Object.values(buildableItems.defences || {}).map((d: any) => d.slug)
    )

    // Get built defence quantities
    const builtDefences = new Map<string, number>()
    defencesList.forEach((def: any) => {
      const slug = def.defence_slug || def.slug
      if (slug) {
        builtDefences.set(slug, def.quantity || 0)
      }
    })

    return definitions.defences.map((defence) => {
      const slug = defence.slug
      const isBuilt = builtDefences.has(slug) && (builtDefences.get(slug) || 0) > 0
      const isBuildable = buildableSlugs.has(slug)
      
      let status: HexagonStatus
      if (isBuilt) {
        status = HexagonStatus.COMPLETED
      } else if (isBuildable) {
        status = HexagonStatus.AVAILABLE
      } else {
        status = HexagonStatus.PREREQUISITE_NOT_MET
      }

      // No prerequisites for defences in the API
      const prerequisites: string[] = []

      return {
        id: defence.id.toString(),
        slug: defence.slug,
        name: defence.name,
        imageUrl: getDefenseImage(defence.slug),
        status,
        prerequisites,
        description: defence.description,
        costTellerium: defence.tellerium_cost,
        costKrypton: defence.krypton_cost,
        buildTime: defence.build_time_ticks,
      }
    })
  }, [definitions, buildableItems, defencesList])

  const handleItemClick = (item: TechTreeItem) => {
    // Prevent building if prerequisites not met
    if (item.status === HexagonStatus.PREREQUISITE_NOT_MET) {
      toast.error('Prerequisites not met for this item')
      return
    }
    
    // Open a build detail panel
    openPanel(PanelType.BUILD_DETAIL, 'MEDIUM' as any, {
      type: 'defense',
      slug: item.slug,
      planetId,
    })
  }

  if (isLoadingDefinitions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (techTreeItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No defenses available</p>
      </div>
    )
  }

  return (
    <HexagonalTechTree
      items={techTreeItems}
      onItemClick={handleItemClick}
      className={className}
      hexagonSize={120}
    />
  )
}

