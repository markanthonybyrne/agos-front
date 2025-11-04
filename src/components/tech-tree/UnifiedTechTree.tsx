import { useMemo } from 'react'
import { useGetTechTreeQuery } from '@/api/endpoints/empiresApi'
import { HexagonalTechTree, TechTreeItem } from './HexagonalTechTree'
import { HexagonStatus } from './HexagonNode'
import { Skeleton } from '@/components/ui/skeleton'
import { getFacilityImage } from '@/lib/facilityImages'
import { getShipImage } from '@/lib/shipImages'
import { getDefenseImage } from '@/lib/defenseImages'
import { FlaskConical } from 'lucide-react'

interface UnifiedTechTreeProps {
  className?: string
}

export function UnifiedTechTree({ className }: UnifiedTechTreeProps) {
  const { data: techTreeData, isLoading } = useGetTechTreeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  const techTreeItems: TechTreeItem[] = useMemo(() => {
    if (!techTreeData) return []

    const items: TechTreeItem[] = []

    // Process facilities
    if (techTreeData.facilities) {
      techTreeData.facilities.forEach((facility: any) => {
        let status: HexagonStatus = HexagonStatus.LOCKED
        if (facility.completed) {
          status = HexagonStatus.COMPLETED
        } else if (facility.can_build && facility.unlocked) {
          status = HexagonStatus.AVAILABLE
        } else if (facility.unlocked) {
          status = HexagonStatus.LOCKED
        }

        items.push({
          id: `facility-${facility.slug}`,
          slug: facility.slug,
          name: facility.name,
          imageUrl: getFacilityImage(facility.slug),
          status,
          era: facility.era,
          specialization: facility.specialization,
          prerequisites: facility.prerequisites || [],
          description: facility.description,
          costTellerium: facility.base_tellerium_cost,
          costKrypton: facility.base_krypton_cost,
          productionTellerium: facility.per_tick?.tellerium,
          productionKrypton: facility.per_tick?.krypton,
          upkeepTellerium: facility.upkeep?.tellerium,
          upkeepKrypton: facility.upkeep?.krypton,
          buildTime: facility.build_time_ticks,
        })
      })
    }

    // Process research
    if (techTreeData.research) {
      techTreeData.research.forEach((research: any) => {
        let status: HexagonStatus = HexagonStatus.LOCKED
        if (research.completed) {
          status = HexagonStatus.COMPLETED
        } else if (research.can_research && research.unlocked) {
          status = HexagonStatus.AVAILABLE
        } else if (research.unlocked) {
          status = HexagonStatus.LOCKED
        }

        items.push({
          id: `research-${research.slug}`,
          slug: research.slug,
          name: research.name,
          imageUrl: undefined, // Research doesn't have images typically
          status,
          era: research.era,
          specialization: research.specialization,
          prerequisites: [
            ...(research.prerequisite_facilities || []),
            ...(research.prerequisite_research || []),
          ],
          description: research.description,
          costTellerium: research.cost_tellerium,
          costKrypton: research.cost_krypton,
          buildTime: research.build_time_ticks,
        })
      })
    }

    // Process ships
    if (techTreeData.ships) {
      techTreeData.ships.forEach((ship: any) => {
        let status: HexagonStatus = HexagonStatus.LOCKED
        if (ship.can_build && ship.unlocked) {
          status = HexagonStatus.AVAILABLE
        } else if (ship.unlocked) {
          status = HexagonStatus.LOCKED
        }

        items.push({
          id: `ship-${ship.slug}`,
          slug: ship.slug,
          name: ship.name,
          imageUrl: getShipImage(ship.slug),
          status,
          era: ship.era,
          specialization: ship.specialization,
          prerequisites: ship.prerequisites || [],
          description: ship.description,
          costTellerium: ship.tellerium_cost,
          costKrypton: ship.krypton_cost,
          buildTime: ship.build_time_ticks,
        })
      })
    }

    // Process defences
    if (techTreeData.defences) {
      techTreeData.defences.forEach((defence: any) => {
        let status: HexagonStatus = HexagonStatus.LOCKED
        if (defence.can_build && defence.unlocked) {
          status = HexagonStatus.AVAILABLE
        } else if (defence.unlocked) {
          status = HexagonStatus.LOCKED
        }

        items.push({
          id: `defence-${defence.slug}`,
          slug: defence.slug,
          name: defence.name,
          imageUrl: getDefenseImage(defence.slug),
          status,
          era: defence.era,
          specialization: defence.specialization,
          prerequisites: defence.prerequisites || [],
          description: defence.description,
          costTellerium: defence.tellerium_cost,
          costKrypton: defence.krypton_cost,
          buildTime: defence.build_time_ticks,
        })
      })
    }

    return items
  }, [techTreeData])

  const activeEra = techTreeData?.empire?.active_era || 1
  const specializationsUnlocked = techTreeData?.empire?.specializations_unlocked || []

  if (isLoading) {
    return (
      <div className={className}>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!techTreeData) {
    return (
      <div className={className}>
        <div className="text-center py-8 text-muted-foreground">
          <p>Failed to load tech tree data</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <HexagonalTechTree
        items={techTreeItems}
        activeEra={activeEra}
        specializationsUnlocked={specializationsUnlocked}
        hexagonSize={100}
      />
    </div>
  )
}

