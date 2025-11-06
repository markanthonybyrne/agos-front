import { UnifiedUniverseMapV4 } from '@/components/map/v4/UnifiedUniverseMapV4'

/**
 * UniverseMap - Main entry point for the universe map
 * 
 * Now uses the new UnifiedUniverseMapV4 component which implements:
 * - PixiJS WebGL rendering for GPU acceleration
 * - 4-level hierarchy (Sector:Galaxy:System:Planet)
 * - Lightweight 2D rendering without image assets
 * - Smooth zoom/pan transitions
 * - CSS gradient background matching V2
 */
export function UniverseMap() {
  return <UnifiedUniverseMapV4 />
}
