// Pre-import galaxy images so Vite bundles them and paths are stable
import galaxyType1 from '../../assets/images/galaxy/galaxy_type_1.png'
import galaxyType2 from '../../assets/images/galaxy/galaxy_type_2.png'
import galaxyType3 from '../../assets/images/galaxy/galaxy_type_3.png'
import galaxyType4 from '../../assets/images/galaxy/galaxy_type_4.png'
import galaxyType5 from '../../assets/images/galaxy/galaxy_type_5.png'

const imageByType: Record<number, string> = {
  1: galaxyType1,
  2: galaxyType2,
  3: galaxyType3,
  4: galaxyType4,
  5: galaxyType5,
}

export function getGalaxyImage(type?: number): string {
  if (!type || !imageByType[type]) {
    return imageByType[1] // Default to type 1
  }
  return imageByType[type]
}

/**
 * Get a deterministic random galaxy type (1-5) based on system coordinates
 * This ensures the same system always gets the same galaxy image
 */
export function getRandomGalaxyTypeForSystem(systemKey: string): number {
  // Parse the system key (format: "Q:S:G")
  const parts = systemKey.split(':').map(Number)
  if (parts.length < 3) {
    return 1 // Default if invalid
  }
  
  const [quadrant, sector, galaxy] = parts
  
  // Create a deterministic hash from coordinates
  // Use a simple hash function to ensure same system always gets same type
  const hash = (quadrant * 1000 + sector * 100 + galaxy) % 1000
  
  // Map hash to 1-5 range
  return (hash % 5) + 1
}

