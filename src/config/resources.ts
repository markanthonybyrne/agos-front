import { ResourceRarity, SecondaryResourceLedgerEntry, SecondaryReserve } from '@/types/api.types'

export type ResourceCategory = 'primary' | 'secondary'

export interface ResourceMetadata {
  slug: string
  name: string
  category: ResourceCategory
  rarity: ResourceRarity
  color: string
  icon?: string
  description?: string
  unit?: string
}

const RARITY_COLORS: Record<ResourceRarity, string> = {
  common: '#6FCF97',
  rare: '#56CCF2',
  exotic: '#BB6BD9',
}

const primaryMetadata: Record<string, ResourceMetadata> = {
  tellerium: {
    slug: 'tellerium',
    name: 'Tellerium',
    category: 'primary',
    rarity: 'common',
    color: RARITY_COLORS.common,
  },
  krypton: {
    slug: 'krypton',
    name: 'Krypton',
    category: 'primary',
    rarity: 'rare',
    color: RARITY_COLORS.rare,
  },
}

const secondaryMetadata = new Map<string, ResourceMetadata>()

export function clearSecondaryResourceMetadata() {
  secondaryMetadata.clear()
}

export function registerSecondaryResource(metadata: ResourceMetadata | ResourceMetadata[]) {
  const list = Array.isArray(metadata) ? metadata : [metadata]
  list.forEach((item) => {
    if (item.category !== 'secondary') {
      throw new Error(`Secondary resource metadata must have category "secondary" (received ${item.slug})`)
    }
    secondaryMetadata.set(item.slug, {
      ...item,
      rarity: item.rarity ?? 'common',
      color: item.color ?? RARITY_COLORS[item.rarity ?? 'common'],
    })
  })
}

export function upsertSecondaryFromLedger(entries?: SecondaryResourceLedgerEntry[] | null) {
  if (!entries) return
  entries.forEach((entry) => {
    const existing = secondaryMetadata.get(entry.slug)
    if (!existing) {
      secondaryMetadata.set(entry.slug, {
        slug: entry.slug,
        name: entry.name ?? entry.slug.replace(/_/g, ' '),
        category: 'secondary',
        rarity: entry.rarity ?? 'common',
        color: RARITY_COLORS[entry.rarity ?? 'common'],
        icon: entry.icon ?? undefined,
      })
    }
  })
}

export function upsertSecondaryFromReserves(reserves?: SecondaryReserve[] | null) {
  if (!reserves) return
  reserves.forEach((reserve) => {
    if (!reserve.slug) return
    const existing = secondaryMetadata.get(reserve.slug)
    const rarity = reserve.rarity ?? existing?.rarity ?? 'common'
    const color = existing?.color ?? RARITY_COLORS[rarity]
    secondaryMetadata.set(reserve.slug, {
      slug: reserve.slug,
      name: reserve.name ?? existing?.name ?? reserve.slug.replace(/_/g, ' '),
      category: 'secondary',
      rarity,
      color,
      icon: existing?.icon,
    })
  })
}

export function getResourceMetadata(slug: string): ResourceMetadata {
  const normalized = slug.toLowerCase()
  if (primaryMetadata[normalized]) {
    return primaryMetadata[normalized]
  }
  const secondary = secondaryMetadata.get(normalized)
  if (secondary) {
    return secondary
  }
  return {
    slug,
    name: slug.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    category: 'secondary',
    rarity: 'common',
    color: RARITY_COLORS.common,
  }
}

export function listResourceMetadata(options?: { category?: ResourceCategory; includeUnknown?: boolean }): ResourceMetadata[] {
  const { category, includeUnknown = false } = options || {}
  const items: ResourceMetadata[] = []
  if (!category || category === 'primary') {
    items.push(...Object.values(primaryMetadata))
  }
  if (!category || category === 'secondary') {
    secondaryMetadata.forEach((value) => {
      items.push(value)
    })
  }
  if (includeUnknown) {
    items.push({
      slug: 'unknown',
      name: 'Unknown Material',
      category: 'secondary',
      rarity: 'common',
      color: RARITY_COLORS.common,
    })
  }
  return items
}

export function getRarityColor(rarity: ResourceRarity): string {
  return RARITY_COLORS[rarity] ?? RARITY_COLORS.common
}


