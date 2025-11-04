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
import bluePlanetImg from '../../assets/images/planets/blue-planet-space.png'
import dwarfImg from '../../assets/images/planets/dwarf.png'
import exoticImg from '../../assets/images/planets/exotic.png'
import forestImg from '../../assets/images/planets/forest.png'
import jungleImg from '../../assets/images/planets/jungle.png'
import metallicImg from '../../assets/images/planets/metallic.png'
import moltenImg from '../../assets/images/planets/molten.png'
import nebulousImg from '../../assets/images/planets/nebulous.png'
import plasmaImg from '../../assets/images/planets/plasma.png'
import quantumImg from '../../assets/images/planets/quantum.png'
import ringedImg from '../../assets/images/planets/ringed.png'
import rockyImg from '../../assets/images/planets/rocky.png'
import solAngryImg from '../../assets/images/planets/sol-angry.png'
import solDangerousImg from '../../assets/images/planets/sol-dangerous.png'
import solDarkImg from '../../assets/images/planets/sol-dark.png'
import solFlareImg from '../../assets/images/planets/sol-flare.png'
import solMassiveImg from '../../assets/images/planets/sol-massive.png'
import solPrimeImg from '../../assets/images/planets/sol-prime.png'
import solImg from '../../assets/images/planets/sol.png'
import swampImg from '../../assets/images/planets/swamp.png'
import tropicalImg from '../../assets/images/planets/tropical.png'
import tundraImg from '../../assets/images/planets/tundra.png'
import yellowImg from '../../assets/images/planets/yellow.png'

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
  // Additional planet types
  blue_planet: bluePlanetImg,
  'blue-planet': bluePlanetImg,
  'blue-planet-space': bluePlanetImg,
  dwarf: dwarfImg,
  exotic: exoticImg,
  forest: forestImg,
  jungle: jungleImg,
  metallic: metallicImg,
  molten: moltenImg,
  nebulous: nebulousImg,
  plasma: plasmaImg,
  quantum: quantumImg,
  ringed: ringedImg,
  rocky: rockyImg,
  sol: solImg,
  sol_angry: solAngryImg,
  'sol-angry': solAngryImg,
  sol_dangerous: solDangerousImg,
  'sol-dangerous': solDangerousImg,
  sol_dark: solDarkImg,
  'sol-dark': solDarkImg,
  sol_flare: solFlareImg,
  'sol-flare': solFlareImg,
  sol_massive: solMassiveImg,
  'sol-massive': solMassiveImg,
  sol_prime: solPrimeImg,
  'sol-prime': solPrimeImg,
  swamp: swampImg,
  tropical: tropicalImg,
  tundra: tundraImg,
  yellow: yellowImg,
}

export function getPlanetImage(slug?: string): string | undefined {
  if (!slug) return undefined
  // Normalize slug to handle variations (snake_case, kebab-case, etc.)
  const normalizedSlug = slug.toLowerCase().replace(/-/g, '_')
  return imageBySlug[slug] || imageBySlug[normalizedSlug] || aridImg
}

// Export asteroid image for use in other components
export { asteroidImg }

// All sol images for random system star selection
const solImages = [
  solImg,
  solAngryImg,
  solDangerousImg,
  solDarkImg,
  solFlareImg,
  solMassiveImg,
  solPrimeImg,
]

const MAX_SOL_TYPES = solImages.length

/**
 * Get a deterministic random sol image based on system coordinates
 * This ensures the same system always gets the same sol image
 */
export function getRandomSolImageForSystem(systemKey: string): string {
  // Parse the system key (format: "Q:S:G:SY")
  const parts = systemKey.split(':').map(Number)
  if (parts.length < 4) {
    return solImg // Default if invalid
  }
  
  const [quadrant, sector, galaxy, system] = parts
  
  // Create a deterministic hash from coordinates
  const hash = quadrant * 10000 + sector * 1000 + galaxy * 100 + system
  
  // Map hash to 0-6 range (7 sol images)
  const index = hash % MAX_SOL_TYPES
  
  return solImages[index]
}

// Export sol images for use in system rendering
export { solImg, solAngryImg, solMassiveImg, solDangerousImg, solDarkImg, solFlareImg, solPrimeImg }


