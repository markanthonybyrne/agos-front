// Pre-import images so Vite bundles them and paths are stable
import aridImg from '../../assets/images/arid.jpg'
import oceanicImg from '../../assets/images/oceanic.jpg'
import volcanicImg from '../../assets/images/volcanic.jpg'
import iceImg from '../../assets/images/ice.jpg'

const imageBySlug: Record<string, string> = {
  arid: aridImg,
  oceanic: oceanicImg,
  volcanic: volcanicImg,
  ice: iceImg,
}

export function getPlanetImage(slug?: string): string | undefined {
  if (!slug) return undefined
  return imageBySlug[slug] || aridImg
}


