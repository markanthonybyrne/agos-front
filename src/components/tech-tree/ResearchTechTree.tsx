import { useMemo } from 'react'
import { useGetResearchDefinitionsQuery, useGetMyResearchQuery, useGetPlanetAvailableResearchQuery } from '@/api/endpoints/researchApi'
import { HexagonalTechTree, TechTreeItem } from './HexagonalTechTree'
import { HexagonStatus } from './HexagonNode'
import { Skeleton } from '@/components/ui/skeleton'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType } from '@/app/slices/panelSlice'

interface ResearchTechTreeProps {
  planetId: number
  className?: string
}

export function ResearchTechTree({ planetId, className }: ResearchTechTreeProps) {
  const { openPanel } = usePanel()
  const { data: definitions, isLoading: isLoadingDefinitions } = useGetResearchDefinitionsQuery()
  const { data: researchProgress } = useGetMyResearchQuery()
  const { data: planetResearchData } = useGetPlanetAvailableResearchQuery(planetId)

  const techTreeItems: TechTreeItem[] = useMemo(() => {
    if (!definitions?.research || !planetResearchData?.research) return []

    const completedResearch = researchProgress?.completed_research || []
    
    return planetResearchData.research.map((research) => {
      const isCompleted = research.completed || completedResearch.includes(research.slug)
      const isAvailable = research.can_research && !isCompleted
      
      let status: HexagonStatus
      if (isCompleted) {
        status = HexagonStatus.COMPLETED
      } else if (isAvailable) {
        status = HexagonStatus.AVAILABLE
      } else {
        status = HexagonStatus.PREREQUISITE_NOT_MET
      }

      // Determine prerequisites from research definition
      const prerequisites: string[] = []
      if (research.prerequisite_research && Array.isArray(research.prerequisite_research)) {
        // Map prerequisite research slugs to their IDs
        research.prerequisite_research.forEach((prereqSlug: string) => {
          const prereqResearch = definitions.research.find(r => r.slug === prereqSlug)
          if (prereqResearch) {
            prerequisites.push(prereqResearch.id.toString())
          }
        })
      }

      return {
        id: research.slug, // Use slug as ID since PlanetResearchItem doesn't have id
        slug: research.slug,
        name: research.name,
        imageUrl: undefined, // Research doesn't have images yet
        status,
        prerequisites,
      }
    })
  }, [definitions, planetResearchData, researchProgress])

  const handleItemClick = (item: TechTreeItem) => {
    // Open a research detail panel or start research directly
    openPanel(PanelType.RESEARCH_DETAIL, 'MEDIUM' as any, {
      type: 'research',
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
        <p>No research available</p>
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

