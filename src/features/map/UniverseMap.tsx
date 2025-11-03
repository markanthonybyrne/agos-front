import { UnifiedUniverseMapV2 } from '@/components/map/UnifiedUniverseMapV2'

/**
 * UniverseMap - Main entry point for the universe map
 * 
 * Now uses the new UnifiedUniverseMapV2 component which implements:
 * - 5-level hierarchy (Quadrant:Sector:Galaxy:System:Planet)
 * - Pre-loading of all planet data
 * - Single flat grid with zoom/pan
 * - System-level rendering with central stars
 * - Navigation overlays
 */
export function UniverseMap() {
  return <UnifiedUniverseMapV2 />
}
