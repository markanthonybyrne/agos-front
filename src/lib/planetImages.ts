// Pre-import images so Vite bundles them and paths are stable
import aridImg from '../../assets/images/planets/arid.png'
import oceanicImg from '../../assets/images/planets/oceanic.png'
import volcanicImg from '../../assets/images/planets/volcanic.png'
import iceImg from '../../assets/images/planets/ice.png'
import asteroidImg from '../../assets/images/planets/asteroid.png'
import barrenImg from '../../assets/images/planets/barren.png'
import temperateImg from '../../assets/images/planets/temperate.png'
import toxicImg from '../../assets/images/planets/toxic.png'
import crystallineImg from '../../assets/images/planets/crystalline.png'
import gasGiantImg from '../../assets/images/planets/gas_giant.png'
import terranImg from '../../assets/images/planets/terran.png'

const imageBySlug: Record<string, string> = {
  arid: aridImg,
  oceanic: oceanicImg,
  volcanic: volcanicImg,
  ice: iceImg,
  asteroid: asteroidImg,
  barren: barrenImg,
  temperate: temperateImg,
  toxic: toxicImg,
  crystalline: crystallineImg,
  gas_giant: gasGiantImg,
  'gas-giant': gasGiantImg, // Support both snake_case and kebab-case
  terran: terranImg,
}

export function getPlanetImage(slug?: string): string | undefined {
  if (!slug) return undefined
  // Normalize slug to handle variations (snake_case, kebab-case, etc.)
  const normalizedSlug = slug.toLowerCase().replace(/-/g, '_')
  return imageBySlug[slug] || imageBySlug[normalizedSlug] || aridImg
}


