/**
 * Spiral Galaxy Utilities
 * 
 * Helper functions for spiral galaxy layout calculations:
 * - Convex hull algorithm for region boundaries
 * - Spiral arm calculations
 * - Region-to-arm mapping
 */

export const GALACTIC_CORE = { x: 1000, y: 1000 }

/**
 * Region-to-Arm Mapping
 * 3 spiral arms extending from galactic core
 */
export const SPIRAL_ARM_REGIONS: Record<number, number[]> = {
  1: [1, 4, 7, 10, 13, 16, 19], // Arm 1
  2: [2, 5, 8, 11, 14, 17, 20], // Arm 2
  3: [3, 6, 9, 12, 15, 18],      // Arm 3
}

/**
 * Get which spiral arm a region belongs to
 */
export function getRegionArm(region: number): number | null {
  for (const [arm, regions] of Object.entries(SPIRAL_ARM_REGIONS)) {
    if (regions.includes(region)) {
      return parseInt(arm, 10)
    }
  }
  return null
}

/**
 * Get all regions for a specific spiral arm
 */
export function getArmRegions(armNumber: number): number[] {
  return SPIRAL_ARM_REGIONS[armNumber] || []
}

/**
 * Navigate along a spiral arm to a specific position
 * @param armNumber - Spiral arm number (1, 2, or 3)
 * @param position - Position along arm (0.0 to 1.0, where 0 is core, 1 is outer edge)
 * @returns Approximate X/Y coordinates along the spiral arm
 */
export function getSpiralArmPosition(armNumber: number, position: number): { x: number; y: number } {
  const baseAngle = ((armNumber - 1) * 2 * Math.PI) / 3 // 0°, 120°, 240°
  const maxAngle = 7 * Math.PI // Maximum angle for spiral
  const angle = position * maxAngle
  const a = 100 // Starting radius
  const b = 0.12 // Growth rate
  const radius = a * Math.exp(b * angle)
  
  return {
    x: GALACTIC_CORE.x + radius * Math.cos(baseAngle + angle),
    y: GALACTIC_CORE.y + radius * Math.sin(baseAngle + angle),
  }
}

/**
 * Point type for convex hull calculations
 */
export type Point = [number, number]

/**
 * Calculate convex hull of points using Graham scan algorithm
 * Returns array of points forming the convex hull in counter-clockwise order
 */
export function convexHull(points: Point[]): Point[] {
  if (points.length < 3) {
    // Need at least 3 points for a hull, return all points
    return points
  }

  // Find the bottom-most point (or leftmost in case of tie)
  let bottomIndex = 0
  for (let i = 1; i < points.length; i++) {
    if (points[i][1] < points[bottomIndex][1] || 
        (points[i][1] === points[bottomIndex][1] && points[i][0] < points[bottomIndex][0])) {
      bottomIndex = i
    }
  }

  // Swap bottom point to first position
  const bottom = points[bottomIndex]
  points[bottomIndex] = points[0]
  points[0] = bottom

  // Sort points by polar angle with respect to bottom point
  const sorted = points.slice(1).sort((a, b) => {
    const cross = crossProduct(bottom, a, b)
    if (Math.abs(cross) < 1e-10) {
      // Points are collinear, sort by distance
      const distA = distanceSquared(bottom, a)
      const distB = distanceSquared(bottom, b)
      return distA - distB
    }
    return cross > 0 ? -1 : 1
  })

  // Build convex hull
  const hull: Point[] = [bottom, sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const point = sorted[i]
    
    // Remove points that create clockwise turns
    while (hull.length > 1 && crossProduct(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
      hull.pop()
    }
    
    hull.push(point)
  }

  return hull
}

/**
 * Calculate cross product of vectors (p1->p2) and (p1->p3)
 * Returns positive if p3 is to the left of p1->p2, negative if to the right
 */
function crossProduct(p1: Point, p2: Point, p3: Point): number {
  return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
}

/**
 * Calculate squared distance between two points
 */
function distanceSquared(p1: Point, p2: Point): number {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  return dx * dx + dy * dy
}

/**
 * Calculate spiral arm path points
 * Logarithmic spiral: r = a * exp(b * θ)
 * 
 * @param armNumber - Spiral arm number (1, 2, or 3)
 * @param startAngle - Starting angle in radians
 * @param endAngle - Ending angle in radians
 * @param stepSize - Angle step size for point generation
 * @param a - Starting radius parameter (default: 100)
 * @param b - Growth rate parameter (default: 0.12)
 * @returns Array of [x, y] points along the spiral arm
 */
export function calculateSpiralArmPoints(
  armNumber: number,
  startAngle: number = 0,
  endAngle: number = 7 * Math.PI,
  stepSize: number = 0.1,
  a: number = 100,
  b: number = 0.12
): Point[] {
  const baseAngle = ((armNumber - 1) * 2 * Math.PI) / 3 // 0°, 120°, 240°
  const points: Point[] = []

  for (let angle = startAngle; angle <= endAngle; angle += stepSize) {
    const radius = a * Math.exp(b * angle)
    const x = GALACTIC_CORE.x + radius * Math.cos(baseAngle + angle)
    const y = GALACTIC_CORE.y + radius * Math.sin(baseAngle + angle)
    points.push([x, y])
  }

  return points
}

/**
 * Get all spiral arm paths for visualization
 */
export function getAllSpiralArmPaths(
  startAngle: number = 0,
  endAngle: number = 7 * Math.PI,
  stepSize: number = 0.1
): Point[][] {
  return [
    calculateSpiralArmPoints(1, startAngle, endAngle, stepSize),
    calculateSpiralArmPoints(2, startAngle, endAngle, stepSize),
    calculateSpiralArmPoints(3, startAngle, endAngle, stepSize),
  ]
}

/**
 * Calculate center point from array of points (average)
 */
export function calculateCenter(points: Point[]): Point | null {
  if (points.length === 0) return null

  const sumX = points.reduce((sum, p) => sum + p[0], 0)
  const sumY = points.reduce((sum, p) => sum + p[1], 0)

  return [sumX / points.length, sumY / points.length]
}

/**
 * Convert convex hull points to SVG path string
 */
export function hullToPath(hull: Point[]): string {
  if (hull.length === 0) return ''
  if (hull.length === 1) return `M ${hull[0][0]} ${hull[0][1]}`
  if (hull.length === 2) {
    return `M ${hull[0][0]} ${hull[0][1]} L ${hull[1][0]} ${hull[1][1]}`
  }

  const path = hull.map((point, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${command} ${point[0]} ${point[1]}`
  }).join(' ')

  return `${path} Z` // Close the path
}

