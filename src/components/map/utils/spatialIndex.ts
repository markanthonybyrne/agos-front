export interface PointLike<T = any> {
  x: number
  y: number
  payload: T
}

interface Bounds {
  x: number
  y: number
  w: number
  h: number
}

export class QuadTree<T = any> {
  private bounds: Bounds
  private capacity: number
  private points: PointLike<T>[] = []
  private divided = false
  private nw?: QuadTree<T>
  private ne?: QuadTree<T>
  private sw?: QuadTree<T>
  private se?: QuadTree<T>

  constructor(bounds: Bounds, capacity = 32) {
    this.bounds = bounds
    this.capacity = capacity
  }

  insert(p: PointLike<T>): boolean {
    if (!this.contains(p.x, p.y)) return false
    if (this.points.length < this.capacity) {
      this.points.push(p)
      return true
    }
    if (!this.divided) this.subdivide()
    return (
      this.nw!.insert(p) ||
      this.ne!.insert(p) ||
      this.sw!.insert(p) ||
      this.se!.insert(p)
    )
  }

  queryRadius(x: number, y: number, r: number, out: PointLike<T>[] = []): PointLike<T>[] {
    if (!this.intersectsCircle(x, y, r)) return out
    for (const p of this.points) {
      const dx = p.x - x
      const dy = p.y - y
      if (dx * dx + dy * dy <= r * r) out.push(p)
    }
    if (this.divided) {
      this.nw!.queryRadius(x, y, r, out)
      this.ne!.queryRadius(x, y, r, out)
      this.sw!.queryRadius(x, y, r, out)
      this.se!.queryRadius(x, y, r, out)
    }
    return out
  }

  private contains(x: number, y: number): boolean {
    return (
      x >= this.bounds.x &&
      y >= this.bounds.y &&
      x < this.bounds.x + this.bounds.w &&
      y < this.bounds.y + this.bounds.h
    )
  }

  private intersectsCircle(x: number, y: number, r: number): boolean {
    const rx = Math.max(this.bounds.x, Math.min(x, this.bounds.x + this.bounds.w))
    const ry = Math.max(this.bounds.y, Math.min(y, this.bounds.y + this.bounds.h))
    const dx = x - rx
    const dy = y - ry
    return dx * dx + dy * dy <= r * r
  }

  private subdivide() {
    const { x, y, w, h } = this.bounds
    const hw = w / 2
    const hh = h / 2
    this.nw = new QuadTree({ x, y, w: hw, h: hh }, this.capacity)
    this.ne = new QuadTree({ x: x + hw, y, w: hw, h: hh }, this.capacity)
    this.sw = new QuadTree({ x, y: y + hh, w: hw, h: hh }, this.capacity)
    this.se = new QuadTree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.capacity)
    this.divided = true
  }
}


