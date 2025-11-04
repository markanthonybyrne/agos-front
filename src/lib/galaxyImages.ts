// Pre-import galaxy images so Vite bundles them and paths are stable
import galaxyType1 from '../../assets/images/galaxy/galaxy_type_1.png'
import galaxyType2 from '../../assets/images/galaxy/galaxy_type_2.png'
import galaxyType3 from '../../assets/images/galaxy/galaxy_type_3.png'
import galaxyType4 from '../../assets/images/galaxy/galaxy_type_4.png'
import galaxyType5 from '../../assets/images/galaxy/galaxy_type_5.png'
import galaxyType6 from '../../assets/images/galaxy/galaxy_type_6.png'
import galaxyType7 from '../../assets/images/galaxy/galaxy_type_7.png'
import galaxyType8 from '../../assets/images/galaxy/galaxy_type_8.png'
import galaxyType9 from '../../assets/images/galaxy/galaxy_type_9.png'
import galaxyType10 from '../../assets/images/galaxy/galaxy_type_10.png'
import galaxyType11 from '../../assets/images/galaxy/galaxy_type_11.png'
import galaxyType12 from '../../assets/images/galaxy/galaxy_type__12.png'
import galaxyType13 from '../../assets/images/galaxy/galaxy_type_13.png'

const imageByType: Record<number, string> = {
  1: galaxyType1,
  2: galaxyType2,
  3: galaxyType3,
  4: galaxyType4,
  5: galaxyType5,
  6: galaxyType6,
  7: galaxyType7,
  8: galaxyType8,
  9: galaxyType9,
  10: galaxyType10,
  11: galaxyType11,
  12: galaxyType12,
  13: galaxyType13,
}

const MAX_GALAXY_TYPES = 13

export function getGalaxyImage(type?: number): string {
  if (!type || !imageByType[type]) {
    return imageByType[1] // Default to type 1
  }
  return imageByType[type]
}

/**
 * Get a deterministic random galaxy type (1-13) based on system coordinates
 * This ensures the same system always gets the same galaxy image
 */
export function getRandomGalaxyTypeForSystem(systemKey: string): number {
  // Parse the system key (format: "Q:S:G:SY" or "Q:S:G")
  const parts = systemKey.split(':').map(Number)
  if (parts.length < 3) {
    return 1 // Default if invalid
  }
  
  const [quadrant, sector, galaxy, system] = parts
  
  // Create a deterministic hash from coordinates
  // Include system if available for more variety
  let hash = quadrant * 10000 + sector * 1000 + galaxy * 100
  if (system) {
    hash += system
  }
  
  // Map hash to 1-13 range
  return (hash % MAX_GALAXY_TYPES) + 1
}

