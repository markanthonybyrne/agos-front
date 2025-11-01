import { useMemo } from 'react'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
import { HexagonalTechTree, TechTreeItem } from './HexagonalTechTree'
import { HexagonStatus } from './HexagonNode'
import { getShipImage } from '@/lib/shipImages'
import { Skeleton } from '@/components/ui/skeleton'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType } from '@/app/slices/panelSlice'
import { toast } from 'sonner'

interface ShipTechTreeProps {
  planetId: number
  className?: string
}

export function ShipTechTree({ planetId, className }: ShipTechTreeProps) {
  const { openPanel } = usePanel()
  const { data: definitions, isLoading: isLoadingDefinitions } = useGetShipDefinitionsQuery()
  const { data: buildableItems } = useGetBuildableItemsQuery(planetId)

  const techTreeItems: TechTreeItem[] = useMemo(() => {
    if (!definitions?.ships || !buildableItems?.ships) return []

    // Get buildable ship slugs
    const buildableSlugs = new Set(
      Array.isArray(buildableItems.ships)
        ? buildableItems.ships.map((s: any) => s.slug)
        : Object.values(buildableItems.ships || {}).map((s: any) => s.slug)
    )

    return definitions.ships.map((ship) => {
      const slug = ship.slug
      const isBuildable = buildableSlugs.has(slug)
      
      const status: HexagonStatus = isBuildable 
        ? HexagonStatus.AVAILABLE 
        : HexagonStatus.PREREQUISITE_NOT_MET

      // Determine prerequisites from ship definition
      const prerequisites: string[] = []
      if (ship.prerequisites && Array.isArray(ship.prerequisites)) {
        // Map prerequisite ship slugs to their IDs
        ship.prerequisites.forEach((prereqSlug: string) => {
          const prereqShip = definitions.ships.find(s => s.slug === prereqSlug)
          if (prereqShip) {
            prerequisites.push(prereqShip.id.toString())
          }
        })
      }

      return {
        id: ship.id.toString(),
        slug: ship.slug,
        name: ship.name,
        imageUrl: getShipImage(ship.slug),
        status,
        prerequisites,
        description: ship.description,
        costTellerium: ship.tellerium_cost,
        costKrypton: ship.krypton_cost,
        buildTime: ship.build_time_ticks,
      }
    })
  }, [definitions, buildableItems])

  const handleItemClick = (item: TechTreeItem) => {
    // Prevent building if prerequisites not met
    if (item.status === HexagonStatus.PREREQUISITE_NOT_MET) {
      toast.error('Prerequisites not met for this item')
      return
    }
    
    // Open a build detail panel
    openPanel(PanelType.BUILD_DETAIL, 'MEDIUM' as any, {
      type: 'ship',
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
        <p>No ships available</p>
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

