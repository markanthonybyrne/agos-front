import { useMemo } from 'react'
import { useGetFacilityDefinitionsQuery, useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
import { HexagonalTechTree, TechTreeItem } from './HexagonalTechTree'
import { HexagonStatus } from './HexagonNode'
import { getFacilityImage } from '@/lib/facilityImages'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppSelector } from '@/app/hooks'
import { PanelType } from '@/app/slices/panelSlice'
import { usePanel } from '@/components/common/PanelManager'

interface FacilityTechTreeProps {
  planetId: number
  className?: string
}

export function FacilityTechTree({ planetId, className }: FacilityTechTreeProps) {
  const { openPanel } = usePanel()
  const { data: definitions, isLoading: isLoadingDefinitions } = useGetFacilityDefinitionsQuery()
  const { data: planetFacilities } = useGetPlanetFacilitiesQuery(planetId)
  const { data: buildableItems } = useGetBuildableItemsQuery(planetId)
  
  const facilitiesList = useMemo(() => {
    if (!planetFacilities || !planetFacilities.facilities) return []
    
    const pf: any = planetFacilities
    return pf.facilities || pf.data?.facilities || []
  }, [planetFacilities])

  const techTreeItems: TechTreeItem[] = useMemo(() => {
    if (!definitions?.facilities || !buildableItems?.facilities) return []

    // Get buildable facility slugs
    const buildableSlugs = new Set(
      Array.isArray(buildableItems.facilities)
        ? buildableItems.facilities.map((f: any) => f.slug)
        : Object.keys(buildableItems.facilities || {})
    )

    // Get built facility levels
    const builtFacilities = new Map<string, number>()
    facilitiesList.forEach((fac: any) => {
      const slug = fac.facility_slug || fac.slug
      if (slug) {
        builtFacilities.set(slug, fac.level || 1)
      }
    })

    return definitions.facilities.map((facility) => {
      const slug = facility.slug
      const isBuilt = builtFacilities.has(slug)
      const isBuildable = buildableSlugs.has(slug)
      
      let status: HexagonStatus
      if (isBuilt) {
        status = HexagonStatus.COMPLETED
      } else if (isBuildable) {
        status = HexagonStatus.AVAILABLE
      } else {
        status = HexagonStatus.PREREQUISITE_NOT_MET
      }

      // Determine prerequisites from facility definition
      const prerequisites: string[] = []
      if (facility.prerequisites && Array.isArray(facility.prerequisites)) {
        // Map prerequisite facility slugs to their IDs
        facility.prerequisites.forEach((prereqSlug: string) => {
          const prereqFac = definitions.facilities.find(f => f.slug === prereqSlug)
          if (prereqFac) {
            prerequisites.push(prereqFac.id.toString())
          }
        })
      }

      return {
        id: facility.id.toString(),
        slug: facility.slug,
        name: facility.name,
        imageUrl: getFacilityImage(facility.slug),
        status,
        prerequisites,
      }
    })
  }, [definitions, buildableItems, facilitiesList])

  const handleItemClick = (item: TechTreeItem) => {
    // Open a build detail panel
    openPanel(PanelType.BUILD_DETAIL, 'MEDIUM' as any, {
      type: 'facility',
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
        <p>No facilities available</p>
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

