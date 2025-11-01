import { useMemo } from 'react'
import { useGetFacilityDefinitionsQuery, useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { HexagonalTechTree, TechTreeItem } from './HexagonalTechTree'
import { HexagonStatus } from './HexagonNode'
import { getFacilityImage } from '@/lib/facilityImages'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppSelector } from '@/app/hooks'
import { PanelType } from '@/app/slices/panelSlice'
import { usePanel } from '@/components/common/PanelManager'
import { toast } from 'sonner'

interface FacilityTechTreeProps {
  planetId: number
  className?: string
}

export function FacilityTechTree({ planetId, className }: FacilityTechTreeProps) {
  const { openPanel } = usePanel()
  const { data: definitions, isLoading: isLoadingDefinitions } = useGetFacilityDefinitionsQuery()
  const { data: planetFacilities } = useGetPlanetFacilitiesQuery(planetId)
  const { data: buildableItems } = useGetBuildableItemsQuery(planetId)
  const { data: meData } = useGetMeQuery() // Get facilities from auth/me endpoint
  
  // Get facilities from planet endpoint first, fallback to auth/me
  const facilitiesList = useMemo(() => {
    // Try planet-specific facilities first
    if (planetFacilities) {
      const pf: any = planetFacilities
      const facilitiesRaw = pf.facilities || pf.data?.facilities
      
      // Handle both array and object formats
      if (Array.isArray(facilitiesRaw)) {
        return facilitiesRaw
      } else if (facilitiesRaw && typeof facilitiesRaw === 'object') {
        // If it's an object, convert to array format
        return Object.entries(facilitiesRaw).map(([slug, level]) => ({
          facility_slug: slug,
          slug: slug,
          level: level as number,
          is_active: true,
        }))
      }
    }
    
    // Fallback to auth/me facilities (empire-wide)
    // Facilities are at root level of the response: { facilities: [...] }
    const meFacilities = (meData as any)?.facilities
    if (meFacilities && Array.isArray(meFacilities)) {
      console.log('✅ Using facilities from auth/me endpoint:', meFacilities.length, 'facilities')
      return meFacilities.map((fac: any) => ({
        facility_slug: fac.slug || fac.facility_slug,
        slug: fac.slug || fac.facility_slug,
        level: fac.level || 1,
        is_active: fac.is_active !== false,
        built_on: fac.built_on, // Planet-specific if available
        name: fac.name, // Include name for debugging
      }))
    }
    
    return []
  }, [planetFacilities, meData])

  const techTreeItems: TechTreeItem[] = useMemo(() => {
    if (!definitions?.facilities || !buildableItems?.facilities) return []

    // Get buildable facility slugs
    const buildableSlugs = new Set(
      Array.isArray(buildableItems.facilities)
        ? buildableItems.facilities.map((f: any) => f.slug)
        : Object.values(buildableItems.facilities || {}).map((f: any) => f.slug)
    )

    // Get built facility levels - handle both array and object formats
    // Use slug field (from auth/me) or facility_slug field (from planet endpoint)
    const builtFacilities = new Map<string, number>()
    facilitiesList.forEach((fac: any) => {
      // Try both slug and facility_slug fields
      const slug = fac.slug || fac.facility_slug
      if (slug) {
        builtFacilities.set(slug, fac.level || 1)
      }
    })
    
    console.log('🔍 FacilityTechTree - planetFacilities:', planetFacilities)
    console.log('🔍 FacilityTechTree - meData:', meData)
    console.log('🔍 FacilityTechTree - meData facilities (root):', (meData as any)?.facilities)
    console.log('🔍 FacilityTechTree - meData facilities (empire):', (meData as any)?.empire?.facilities)
    console.log('🔍 FacilityTechTree - facilitiesList:', facilitiesList)
    console.log('🔍 FacilityTechTree - builtFacilities map:', Array.from(builtFacilities.entries()))
    console.log('🔍 FacilityTechTree - All facility slugs from definitions:', definitions.facilities.map(f => f.slug))

    return definitions.facilities.map((facility) => {
      const slug = facility.slug
      const isBuilt = builtFacilities.has(slug)
      const isBuildable = buildableSlugs.has(slug)
      
      let status: HexagonStatus
      if (isBuilt) {
        status = HexagonStatus.COMPLETED
        console.log('✅ Facility marked as COMPLETED:', slug, 'Level:', builtFacilities.get(slug))
      } else if (isBuildable) {
        status = HexagonStatus.AVAILABLE
        console.log('⚠️ Facility is AVAILABLE (buildable but not built):', slug)
      } else {
        status = HexagonStatus.PREREQUISITE_NOT_MET
        console.log('❌ Facility prerequisites not met:', slug)
      }
      
      console.log(`📊 Final status for ${slug}:`, status, 'isBuilt:', isBuilt, 'isBuildable:', isBuildable)

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
        era: facility.era,
        description: facility.description,
        costTellerium: facility.base_tellerium_cost,
        costKrypton: facility.base_krypton_cost,
        productionTellerium: facility.production_tellerium,
        productionKrypton: facility.production_krypton,
        buildTime: facility.build_time_ticks,
      }
    })
  }, [definitions, buildableItems, facilitiesList])

  const handleItemClick = (item: TechTreeItem) => {
    // Prevent building if prerequisites not met
    if (item.status === HexagonStatus.PREREQUISITE_NOT_MET) {
      toast.error('Prerequisites not met for this item')
      return
    }
    
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

