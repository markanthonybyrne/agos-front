import { BuildableItems } from '@/types/api.types'

export interface TechTreeProgress {
  facilities: {
    unlocked: number
    total: number
    percentage: number
  }
  research: {
    completed: number
    total: number
    percentage: number
  }
  ships: {
    unlocked: number
    total: number
    percentage: number
  }
  overall: {
    unlocked: number
    total: number
    percentage: number
  }
}

/**
 * Calculate tech tree progress for a planet based on unlocked facilities, research, and ships
 */
export function calculateTechTreeProgress(
  buildableItems?: BuildableItems,
  researchData?: { research: Array<{ slug: string; completed?: boolean; unlocked?: boolean }> },
  techTreeData?: {
    facilities?: Array<{ slug: string; unlocked?: boolean; completed?: boolean }>
    research?: Array<{ slug: string; unlocked?: boolean; completed?: boolean }>
    ships?: Array<{ slug: string; unlocked?: boolean }>
  }
): TechTreeProgress {
  // Calculate facilities progress - ensure it's an array
  let facilities: any[] = []
  if (buildableItems?.facilities) {
    if (Array.isArray(buildableItems.facilities)) {
      facilities = buildableItems.facilities
    } else if (typeof buildableItems.facilities === 'object') {
      // If it's an object, convert to array
      facilities = Object.values(buildableItems.facilities)
    }
  }
  
  const unlockedFacilities = facilities.filter(f => {
    // Check if facility has unlocked or completed properties
    return (f as any)?.unlocked === true || (f as any)?.completed === true || 
           (f as any)?.can_build === true || (f as any)?.available === true
  }).length
  const totalFacilities = facilities.length

  // Calculate research progress - ensure it's an array
  // Research completion is now empire-wide, so we check the completed field
  let research: any[] = []
  if (researchData?.research) {
    if (Array.isArray(researchData.research)) {
      research = researchData.research
    } else if (typeof researchData.research === 'object') {
      research = Object.values(researchData.research)
    }
  }
  
  // Count completed research (empire-wide)
  const completedResearch = research.filter(r => {
    // Research is completed if the completed field is true (empire-wide)
    return r?.completed === true
  }).length
  const totalResearch = research.length

  // Calculate ships progress - ensure it's an array
  let ships: any[] = []
  if (buildableItems?.ships) {
    if (Array.isArray(buildableItems.ships)) {
      ships = buildableItems.ships
    } else if (typeof buildableItems.ships === 'object') {
      ships = Object.values(buildableItems.ships)
    }
  }
  
  const unlockedShips = ships.filter(s => {
    return (s as any)?.unlocked === true || (s as any)?.can_build === true || (s as any)?.available === true
  }).length
  const totalShips = ships.length

  // Calculate overall progress
  const totalUnlocked = unlockedFacilities + completedResearch + unlockedShips
  const totalItems = totalFacilities + totalResearch + totalShips

  return {
    facilities: {
      unlocked: unlockedFacilities,
      total: totalFacilities,
      percentage: totalFacilities > 0 ? (unlockedFacilities / totalFacilities) * 100 : 0,
    },
    research: {
      completed: completedResearch,
      total: totalResearch,
      percentage: totalResearch > 0 ? (completedResearch / totalResearch) * 100 : 0,
    },
    ships: {
      unlocked: unlockedShips,
      total: totalShips,
      percentage: totalShips > 0 ? (unlockedShips / totalShips) * 100 : 0,
    },
    overall: {
      unlocked: totalUnlocked,
      total: totalItems,
      percentage: totalItems > 0 ? (totalUnlocked / totalItems) * 100 : 0,
    },
  }
}

