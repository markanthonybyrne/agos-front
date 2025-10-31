// Facility images utility
// Images should be named by facility slug (e.g., molecular_extraction.png)
// Located in assets/images/facilities/

// Use Vite's glob import to dynamically load all facility images
const facilityImages = import.meta.glob('../../assets/images/facilities/*.png', { eager: true, import: 'default' })

// Create a mapping of slug to image path
const imageBySlug: Record<string, string> = {}

// Extract slugs from the imported paths
Object.keys(facilityImages).forEach((path) => {
  const filename = path.split('/').pop()?.replace('.png', '') || ''
  if (filename) {
    imageBySlug[filename] = facilityImages[path] as string
  }
})

export function getFacilityImage(slug?: string): string | undefined {
  if (!slug) return undefined
  return imageBySlug[slug]
}

