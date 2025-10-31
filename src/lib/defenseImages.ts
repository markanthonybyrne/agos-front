// Defense images utility
// Images should be named by defense slug (e.g., ion_cannon.png)
// Located in assets/images/defenses/

// Use Vite's glob import to dynamically load all defense images
const defenseImages = import.meta.glob('../../assets/images/defenses/*.png', { eager: true, import: 'default' })

// Create a mapping of slug to image path
const imageBySlug: Record<string, string> = {}

// Extract slugs from the imported paths
Object.keys(defenseImages).forEach((path) => {
  const filename = path.split('/').pop()?.replace('.png', '') || ''
  if (filename) {
    // Handle case variations - convert to lowercase with underscores
    const normalizedSlug = filename.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    imageBySlug[normalizedSlug] = defenseImages[path] as string
    // Also store with original filename in case it's used
    imageBySlug[filename] = defenseImages[path] as string
  }
})

export function getDefenseImage(slug?: string): string | undefined {
  if (!slug) return undefined
  // Try exact match first
  if (imageBySlug[slug]) return imageBySlug[slug]
  // Try lowercase version
  const lowerSlug = slug.toLowerCase()
  if (imageBySlug[lowerSlug]) return imageBySlug[lowerSlug]
  // Try normalized version
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  return imageBySlug[normalizedSlug]
}

