// Pre-import galaxy images so Vite bundles them and paths are stable
import galaxyType1 from '../../assets/images/galaxy/galaxy_type_1.png'
import galaxyType2 from '../../assets/images/galaxy/galaxy_type_2.png'
import galaxyType3 from '../../assets/images/galaxy/galaxy_type_3.png'
import galaxyType4 from '../../assets/images/galaxy/galaxy_type_4.png'

const imageByType: Record<number, string> = {
  1: galaxyType1,
  2: galaxyType2,
  3: galaxyType3,
  4: galaxyType4,
}

export function getGalaxyImage(type?: number): string {
  if (!type || !imageByType[type]) {
    return imageByType[1] // Default to type 1
  }
  return imageByType[type]
}

