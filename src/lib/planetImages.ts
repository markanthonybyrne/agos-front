// Pre-import images so Vite bundles them and paths are stable
import aridImg from '../../assets/images/planets/arid.png'
import oceanicImg from '../../assets/images/planets/oceanic.png'
import volcanicImg from '../../assets/images/planets/volcanic.png'
import iceImg from '../../assets/images/planets/ice.png'
import asteroidImg from '../../assets/images/planets/asteroid.png'

const imageBySlug: Record<string, string> = {
  arid: aridImg,
  oceanic: oceanicImg,
  volcanic: volcanicImg,
  ice: iceImg,
  asteroid: asteroidImg,
}

export function getPlanetImage(slug?: string): string | undefined {
  if (!slug) return undefined
  return imageBySlug[slug] || aridImg
}


