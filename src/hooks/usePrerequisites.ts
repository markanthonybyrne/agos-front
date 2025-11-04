import { useMemo, useCallback } from 'react'
import { useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetMyResearchQuery } from '@/api/endpoints/researchApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { BuildableItem } from '@/types/api.types'

interface PrerequisiteCheck {
  canBuild: boolean
  missingPrerequisites: string[]
  completedPrerequisites: string[]
  completionPercentage: number
  errors: string[] // Detailed error messages
}

export function usePrerequisites(planetId: number, buildableItems: BuildableItem[] | any[]) {
  const { data: facilitiesData } = useGetPlanetFacilitiesQuery(planetId)
  const { data: researchData } = useGetMyResearchQuery()
  const { data: meData } = useGetMeQuery()

  const facilities = facilitiesData?.facilities || []
  const completedResearch = researchData?.completed_research || []
  const empire = meData?.empire
  
  const activeEra = empire?.active_era || 1
  const specializationsUnlocked = empire?.specializations_unlocked || []

  const checkPrerequisites = useMemo(() => {
    const result: Record<string, PrerequisiteCheck> = {}

    buildableItems.forEach((item) => {
      const missingPrerequisites: string[] = []
      const completedPrerequisites: string[] = []
      const errors: string[] = []

      // Check era requirement: definition->era <= empire->active_era
      if ((item as any).era !== undefined) {
        const itemEra = (item as any).era as number
        if (itemEra > activeEra) {
          errors.push(`Era ${itemEra} required (current: ${activeEra})`)
          missingPrerequisites.push(`era_${itemEra}`)
        } else {
          completedPrerequisites.push(`era_${itemEra}`)
        }
      }

      // Check specialization requirement: specialization == 'general' OR in_array(specialization, specializations_unlocked)
      if ((item as any).specialization !== undefined) {
        const itemSpecialization = (item as any).specialization as string
        if (itemSpecialization !== 'general' && !specializationsUnlocked.includes(itemSpecialization)) {
          errors.push(`Specialization '${itemSpecialization}' required`)
          missingPrerequisites.push(`specialization_${itemSpecialization}`)
        } else {
          completedPrerequisites.push(`specialization_${itemSpecialization}`)
        }
      }

      // Check facility prerequisites
      if (item.prerequisites) {
        item.prerequisites.forEach((prereq: string) => {
          const facility = facilities.find(f => f.facility_slug === prereq)
          if (facility && facility.level > 0) {
            completedPrerequisites.push(prereq)
          } else {
            missingPrerequisites.push(prereq)
            errors.push(`Facility '${prereq}' required`)
          }
        })
      }

      // Check research prerequisites (if item has research requirements)
      if ((item as any).prerequisite_research) {
        ((item as any).prerequisite_research as any[]).forEach((prereq: string) => {
          if (completedResearch.includes(prereq)) {
            completedPrerequisites.push(prereq)
          } else {
            missingPrerequisites.push(prereq)
            errors.push(`Research '${prereq}' required`)
          }
        })
      }

      // Check facility prerequisites for research
      if ((item as any).prerequisite_facilities) {
        ((item as any).prerequisite_facilities as any[]).forEach((prereq: string) => {
          const facility = facilities.find(f => f.facility_slug === prereq)
          if (facility && facility.level > 0) {
            completedPrerequisites.push(prereq)
          } else {
            missingPrerequisites.push(prereq)
            errors.push(`Facility '${prereq}' required`)
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
        errors,
      }
    })

    return result
  }, [buildableItems, facilities, completedResearch, activeEra, specializationsUnlocked])

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
      errors: [],
    }
  }, [checkPrerequisites])

  const getPrerequisiteErrors = useCallback((itemSlug: string) => {
    return checkPrerequisites[itemSlug]?.errors || []
  }, [checkPrerequisites])

  return {
    checkPrerequisites,
    canBuildItem,
    getMissingPrerequisites,
    getCompletedPrerequisites,
    getCompletionPercentage,
    getPrerequisiteStatus,
    getPrerequisiteErrors,
  }
}
