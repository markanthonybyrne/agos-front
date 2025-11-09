import { GeometryDefaultsConfig } from '@/types/api.types'

let cachedGeometryDefaults: GeometryDefaultsConfig | null = null

export function setGeometryDefaults(defaults?: GeometryDefaultsConfig | null) {
  cachedGeometryDefaults = defaults ?? null
}

export function getGeometryDefaults(): GeometryDefaultsConfig | null {
  return cachedGeometryDefaults
}

export function getSystemRadiusDefault(): number | undefined {
  return cachedGeometryDefaults?.system_radius_default
}

export function getRegionRadiusMin(): number | undefined {
  return cachedGeometryDefaults?.region_radius_min
}

export function getRegionAdjacencyBuffer(): number | undefined {
  return cachedGeometryDefaults?.region_adjacency_buffer
}

