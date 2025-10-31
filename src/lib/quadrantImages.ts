// Pre-import quadrant images so Vite bundles them and paths are stable
import quadrantType1 from '../../assets/images/quadrant/quadrant_type_1.png'
import quadrantType2 from '../../assets/images/quadrant/quadrant_type_2.png'
import quadrantType3 from '../../assets/images/quadrant/quadrant_type_3.png'
import quadrantType4 from '../../assets/images/quadrant/quadrant_type_4.png'

const imageByType: Record<number, string> = {
  1: quadrantType1,
  2: quadrantType2,
  3: quadrantType3,
  4: quadrantType4,
}

export function getQuadrantImage(type?: number): string {
  if (!type || !imageByType[type]) {
    return imageByType[1] // Default to type 1
  }
  return imageByType[type]
}

