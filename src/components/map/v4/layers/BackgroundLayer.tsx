/**
 * BackgroundLayer - CSS gradient overlay matching V2
 * 
 * Note: For a true spiral galaxy appearance, consider using:
 * - A spiral galaxy background image
 * - Canvas-based rendering with radial gradient from core
 * - Bright core (yellow/orange) at center (1000, 1000)
 * - Spiral arms visible (brighter than inter-arm space)
 * - Stars denser along arms, sparser between arms
 * - Overall darker theme with bright core and arm highlights
 */
export function BackgroundLayer() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none z-0" />
  )
}


