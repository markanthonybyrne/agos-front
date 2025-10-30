import { useMemo, useCallback } from 'react'
import { useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetMyResearchQuery } from '@/api/endpoints/researchApi'
import { BuildableItem } from '@/types/api.types'

interface PrerequisiteCheck {
  canBuild: boolean
  missingPrerequisites: string[]
  completedPrerequisites: string[]
  completionPercentage: number
}

export function usePrerequisites(planetId: number, buildableItems: BuildableItem[] | any[]) {
  const { data: facilitiesData } = useGetPlanetFacilitiesQuery(planetId)
  const { data: researchData } = useGetMyResearchQuery()

  const facilities = facilitiesData?.facilities || []
  const completedResearch = researchData?.research || []

  const checkPrerequisites = useMemo(() => {
    const result: Record<string, PrerequisiteCheck> = {}

    buildableItems.forEach((item) => {
      const missingPrerequisites: string[] = []
      const completedPrerequisites: string[] = []

      // Check facility prerequisites
      if (item.prerequisites) {
        item.prerequisites.forEach((prereq: string) => {
          const facility = facilities.find(f => f.facility_slug === prereq)
          if (facility && facility.level > 0) {
            completedPrerequisites.push(prereq)
          } else {
            missingPrerequisites.push(prereq)
          }
        })
      }

      // Check research prerequisites (if item has research requirements)
      if ((item as any).prerequisite_research) {
        ((item as any).prerequisite_research as any[]).forEach((prereq) => {
          const research = completedResearch.find(r => r.research_slug === prereq)
          if (research && research.is_completed) {
            completedPrerequisites.push(prereq)
          } else {
            missingPrerequisites.push(prereq)
          }
        })
      }

      // Check facility prerequisites for research
      if ((item as any).prerequisite_facilities) {
        ((item as any).prerequisite_facilities as any[]).forEach((prereq) => {
          const facility = facilities.find(f => f.facility_slug === prereq)
          if (facility && facility.level > 0) {
            completedPrerequisites.push(prereq)
          } else {
            missingPrerequisites.push(prereq)
          }
        })
      }

      const totalPrerequisites = completedPrerequisites.length + missingPrerequisites.length
      const completionPercentage = totalPrerequisites > 0 
        ? (completedPrerequisites.length / totalPrerequisites) * 100 
        : 100

      result[item.slug] = {
        canBuild: missingPrerequisites.length === 0,
        missingPrerequisites,
        completedPrerequisites,
        completionPercentage,
      }
    })

    return result
  }, [buildableItems, facilities, completedResearch])

  const canBuildItem = useCallback((itemSlug: string) => {
    return checkPrerequisites[itemSlug]?.canBuild || false
  }, [checkPrerequisites])

  const getMissingPrerequisites = useCallback((itemSlug: string) => {
    return checkPrerequisites[itemSlug]?.missingPrerequisites || []
  }, [checkPrerequisites])

  const getCompletedPrerequisites = useCallback((itemSlug: string) => {
    return checkPrerequisites[itemSlug]?.completedPrerequisites || []
  }, [checkPrerequisites])

  const getCompletionPercentage = useCallback((itemSlug: string) => {
    return checkPrerequisites[itemSlug]?.completionPercentage || 0
  }, [checkPrerequisites])

  const getPrerequisiteStatus = useCallback((itemSlug: string) => {
    return checkPrerequisites[itemSlug] || {
      canBuild: false,
      missingPrerequisites: [],
      completedPrerequisites: [],
      completionPercentage: 0,
    }
  }, [checkPrerequisites])

  return {
    checkPrerequisites,
    canBuildItem,
    getMissingPrerequisites,
    getCompletedPrerequisites,
    getCompletionPercentage,
    getPrerequisiteStatus,
  }
}
