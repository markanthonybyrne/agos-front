import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import type { MapPoint, MapFleet } from '@/components/map/hooks/useUniverseMapData'
import { QuadTree } from '@/components/map/utils/spatialIndex'

interface UniverseStarMapProps {
  className?: string
  planets?: MapPoint[]
  fleets?: MapFleet[]
}

export function UniverseStarMap({ className, planets = [], fleets = [] }: UniverseStarMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const worldRef = useRef<PIXI.Container | null>(null)
  const planetsLayerRef = useRef<PIXI.Container | null>(null)
  const fleetsLayerRef = useRef<PIXI.Container | null>(null)
  const planetsParticlesRef = useRef<PIXI.ParticleContainer | null>(null)
  const planetSpritesRef = useRef<PIXI.Sprite[] | null>(null)
  const lastScaleRef = useRef<number>(1)
  const fleetSpritesRef = useRef<Map<number, PIXI.Sprite> | null>(null)
  const lastPointerDownRef = useRef<{x:number;y:number}|null>(null)
  const lastPointerUpRef = useRef<{x:number;y:number}|null>(null)
  const [selected, setSelected] = useState<
    | { type: 'planet'; id: number | string; name?: string; x: number; y: number }
    | { type: 'fleet'; id: number; x: number; y: number }
    | null
  >(null)
  const planetIndexRef = useRef<QuadTree<{ id: number | string; name?: string }> | null>(null)
  const fleetIndexRef = useRef<QuadTree<{ id: number }> | null>(null)
  // Handlers for cleanup
  const onPointerDownRef = useRef<((e: PointerEvent) => void) | null>(null)
  const onPointerMoveRef = useRef<((e: PointerEvent) => void) | null>(null)
  const onPointerUpRef = useRef<((e: PointerEvent) => void) | null>(null)
  const onWheelRef = useRef<((e: WheelEvent) => void) | null>(null)
  const onResizeRef = useRef<(() => void) | null>(null)
  const fleetTickHandlerRef = useRef<(() => void) | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const cancelledRef = useRef<boolean>(false)

  // Safe canvas getter
  function getCanvas(): HTMLCanvasElement | null {
    const app = appRef.current as any
    let canvas: HTMLCanvasElement | null = null
    try {
      if (app && 'canvas' in app && app.canvas) {
        canvas = app.canvas as HTMLCanvasElement
      }
    } catch {}
    if (!canvas) {
      try {
        if (app && app.renderer && app.renderer.canvas) {
          canvas = app.renderer.canvas as HTMLCanvasElement
        }
      } catch {}
    }
    if (canvas) return canvas
    try {
      const node = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | null
      if (node) return node
    } catch {}
    return null
  }

  function createCircleTexture(radius: number, color: number, app: PIXI.Application): PIXI.Texture {
    const g = new PIXI.Graphics()
    g.beginFill(color, 1)
    g.drawCircle(0, 0, radius)
    g.endFill()
    const texture = app.renderer.generateTexture(g)
    g.destroy()
    return texture
  }

  useEffect(() => {
    if (!containerRef.current) return

    const app = new PIXI.Application()
    appRef.current = app

    // Init application view
    const containerEl = containerRef.current
    const { width: cw, height: ch } = containerEl.getBoundingClientRect()
    app.init({
      backgroundAlpha: 0,
      antialias: true,
      width: Math.max(1, Math.floor(cw || 800)),
      height: Math.max(1, Math.floor(ch || 600)),
    }).then(async () => {
      if (!containerRef.current) return
      const canvasEl = getCanvas()
      if (canvasEl && !canvasEl.parentElement) containerRef.current.appendChild(canvasEl)

      // Prevent render until scene is built
      try { app.ticker.stop() } catch {}

      const world = new PIXI.Container()
      worldRef.current = world
      world.eventMode = 'static'
      app.stage.addChild(world)

      // Galaxy background - randomly select from available types
      const galaxyTypes = [1, 2, 3, 4]
      const randomType = galaxyTypes[Math.floor(Math.random() * galaxyTypes.length)]
      const { getGalaxyImage } = await import('@/lib/galaxyImages')
      const bgUrl = getGalaxyImage(randomType)
      let texture: PIXI.Texture
      try {
        texture = await (PIXI.Assets as any).load(bgUrl)
      } catch {
        texture = PIXI.Texture.EMPTY
      }
      if (cancelledRef.current || !worldRef.current) return
      const bg = new PIXI.Sprite(texture)
      bg.anchor.set(0.5)
      bg.position.set(app.renderer.width / 2, app.renderer.height / 2)
      const maxDim = Math.max(app.renderer.width, app.renderer.height)
      bg.width = maxDim
      bg.height = maxDim
      const worldNow = worldRef.current
      if (!worldNow) return
      worldNow.addChild(bg)

      // Layers
      const planetsLayer = new PIXI.Container()
      const fleetsLayer = new PIXI.Container()
      planetsLayerRef.current = planetsLayer
      fleetsLayerRef.current = fleetsLayer
      if (!cancelledRef.current && worldNow) {
        worldNow.addChild(planetsLayer)
        worldNow.addChild(fleetsLayer)
      }

      // Particle container for planets (fast batched sprites)
      const particles = new PIXI.ParticleContainer()
      planetsParticlesRef.current = particles
      planetsLayer.addChild(particles)

      // Basic pan/zoom state
      let isDragging = false
      let lastX = 0
      let lastY = 0
      const minScale = 0.2
      const maxScale = 5

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true
        lastX = e.clientX
        lastY = e.clientY
        lastPointerDownRef.current = { x: e.clientX, y: e.clientY }
      }
      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY
        world.position.x += dx
        world.position.y += dy
      }
      const onPointerUp = (e: PointerEvent) => {
        isDragging = false
        lastPointerUpRef.current = { x: e.clientX, y: e.clientY }
        // Click detection (small movement)
        const down = lastPointerDownRef.current
        if (down) {
          const dx = e.clientX - down.x
          const dy = e.clientY - down.y
          const moved = Math.hypot(dx, dy)
          if (moved < 5) {
            // Treat as click: compute world coords and select nearest object
            const canvasEl = getCanvas()
            if (!canvasEl) return
            const rect = canvasEl.getBoundingClientRect()
            const sx = e.clientX - rect.left
            const sy = e.clientY - rect.top
            const worldPos = app.stage.toLocal({ x: sx, y: sy }, undefined, undefined, undefined)
            handleSelectAtWorld(worldPos.x, worldPos.y)
          }
        }
      }
      const onWheel = (e: WheelEvent) => {
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
        const newScale = Math.min(maxScale, Math.max(minScale, world.scale.x * scaleFactor))

        // Zoom to cursor
        const canvasEl = getCanvas()
        if (!canvasEl) return
        const rect = canvasEl.getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top
        const worldPosBefore = app.stage.toLocal({ x: cursorX, y: cursorY }, undefined, undefined, undefined)
        world.scale.set(newScale)
        const worldPosAfter = app.stage.toLocal({ x: cursorX, y: cursorY }, undefined, undefined, undefined)
        world.position.x += (worldPosAfter.x - worldPosBefore.x) * world.scale.x
        world.position.y += (worldPosAfter.y - worldPosBefore.y) * world.scale.y

        // Trigger LOD update on zoom
        lastScaleRef.current = newScale
        updateLOD()
      }
      onPointerDownRef.current = onPointerDown
      onPointerMoveRef.current = onPointerMove
      onPointerUpRef.current = onPointerUp
      onWheelRef.current = onWheel
      const canvasAdd = getCanvas()
      if (canvasAdd) canvasAdd.addEventListener('pointerdown', onPointerDown)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      if (canvasAdd) canvasAdd.addEventListener('wheel', onWheel, { passive: true })

      // Handle resize
      const onResize = () => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const w = Math.max(1, Math.floor(rect.width || 1))
        const h = Math.max(1, Math.floor(rect.height || 1))
        app.renderer.resize(w, h)
        bg.position.set(app.renderer.width / 2, app.renderer.height / 2)
        const maxDimR = Math.max(app.renderer.width, app.renderer.height)
        bg.width = maxDimR
        bg.height = maxDimR
      }
      onResizeRef.current = onResize
      const ro = new ResizeObserver(() => onResize())
      resizeObserverRef.current = ro
      ro.observe(containerRef.current)

      // LOD updater
      const updateLOD = () => {
        if (!planetsParticlesRef.current || !planetSpritesRef.current) return
        const scale = world.scale.x
        const sprites = planetSpritesRef.current
        // Determine sprite size and sparsity by scale
        let radius = 1.5
        let step = 1
        if (scale < 0.4) { radius = 0.8; step = 6 }
        else if (scale < 0.7) { radius = 1.0; step = 4 }
        else if (scale < 1.2) { radius = 1.5; step = 2 }
        else if (scale < 2.0) { radius = 2.0; step = 1 }
        else { radius = 3.0; step = 1 }

        // Update visibility sparsity
        for (let i = 0; i < sprites.length; i++) {
          const visible = (i % step) === 0
          sprites[i].visible = visible
          if (visible) {
            sprites[i].scale.set(radius / 2) // since base texture is diameter ~2
          }
        }
      }

      // Expose updater in closure
      ;(updateLOD as any).noop = null

      // Initial LOD
      updateLOD()

      // Start rendering now that scene is ready
      try { app.ticker.start() } catch {}
    })

    return () => {
      cancelledRef.current = true
      const canvas = getCanvas()
      if (canvas && onPointerDownRef.current) canvas.removeEventListener('pointerdown', onPointerDownRef.current)
      if (onPointerMoveRef.current) window.removeEventListener('pointermove', onPointerMoveRef.current)
      if (onPointerUpRef.current) window.removeEventListener('pointerup', onPointerUpRef.current)
      if (canvas && onWheelRef.current) canvas.removeEventListener('wheel', onWheelRef.current as any)
      if (resizeObserverRef.current && containerRef.current) {
        try { resizeObserverRef.current.unobserve(containerRef.current) } catch {}
        try { resizeObserverRef.current.disconnect() } catch {}
        resizeObserverRef.current = null
      }
      // Remove fleet ticker handler if any
      const ticker = appRef.current?.ticker
      if (ticker && fleetTickHandlerRef.current) ticker.remove(fleetTickHandlerRef.current)
      // Destroy app
      if (appRef.current) {
        try {
          appRef.current.destroy(true)
        } catch {}
        appRef.current = null
      }
      worldRef.current = null
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  // Render planets/fleets
  useEffect(() => {
    const app = appRef.current
    const particles = planetsParticlesRef.current
    if (!app || !particles) return

    // Rebuild sprites (ParticleContainer uses removeParticles in Pixi v8)
    const prevSprites = planetSpritesRef.current
    if (prevSprites && prevSprites.length > 0) {
      try {
        ;(particles as any).removeParticles(...prevSprites)
      } catch {
        // fallback for older versions
        prevSprites.forEach(s => particles.removeChild(s))
      }
    }
    const sprites: PIXI.Sprite[] = []
    const texNeutral = createCircleTexture(2, 0x9aa0a6, app)
    const texOwned = createCircleTexture(2, 0x42d392, app)
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i]
      const sprite = new PIXI.Sprite(p.ownerEmpireId ? texOwned : texNeutral)
      sprite.position.set(p.x, p.y)
      sprite.anchor.set(0.5)
      particles.addChild(sprite)
      sprites.push(sprite)
    }
    planetSpritesRef.current = sprites

    // Apply LOD immediately
    const world = worldRef.current
    if (world) {
      lastScaleRef.current = world.scale.x
      // mimic internal update function by recomputing sparsity/size
      // duplicate logic from updateLOD
      const scale = world.scale.x
      let radius = 1.5
      let step = 1
      if (scale < 0.4) { radius = 0.8; step = 6 }
      else if (scale < 0.7) { radius = 1.0; step = 4 }
      else if (scale < 1.2) { radius = 1.5; step = 2 }
      else if (scale < 2.0) { radius = 2.0; step = 1 }
      else { radius = 3.0; step = 1 }
      for (let i = 0; i < sprites.length; i++) {
        const visible = (i % step) === 0
        sprites[i].visible = visible
        if (visible) {
          sprites[i].scale.set(radius / 2)
        }
      }
    }
  }, [planets])

  useEffect(() => {
    const fleetsLayer = fleetsLayerRef.current
    const app = appRef.current
    if (!fleetsLayer || !app) return
    fleetsLayer.removeChildren()

    const sprites = new Map<number, PIXI.Sprite>()
    const texFleet = createCircleTexture(3, 0x61dafb, app)

    fleets.forEach((f) => {
      const s = new PIXI.Sprite(texFleet)
      s.anchor.set(0.5)
      s.position.set(f.x, f.y)
      fleetsLayer.addChild(s)
      sprites.set(f.id, s)
    })
    fleetSpritesRef.current = sprites

    // Animate towards destination with a constant speed
    const ticker = app.ticker
    const speed = 80 // world units per second
    let lastTime = performance.now()
    const tickHandler = () => {
      const now = performance.now()
      const dt = (now - lastTime) / 1000
      lastTime = now
      fleets.forEach((f) => {
        const sprite = sprites.get(f.id)
        if (!sprite) return
        const dx = f.destX - sprite.x
        const dy = f.destY - sprite.y
        const dist = Math.hypot(dx, dy)
        if (dist < 0.5) {
          sprite.x = f.destX
          sprite.y = f.destY
          return
        }
        const step = Math.min(dist, speed * dt)
        sprite.position.set(sprite.x + (dx / (dist || 1)) * step, sprite.y + (dy / (dist || 1)) * step)
      })
    }
    ticker.add(tickHandler)
    fleetTickHandlerRef.current = tickHandler

    return () => {
      ticker.remove(tickHandler)
      if (fleetTickHandlerRef.current === tickHandler) {
        fleetTickHandlerRef.current = null
      }
    }
  }, [fleets])

  // Helper: select nearest planet/fleet at given world coordinates
  function handleSelectAtWorld(wx: number, wy: number) {
    // Threshold in world units adapts to zoom
    const world = worldRef.current
    const scale = world?.scale.x ?? 1
    const threshold = 12 / Math.max(0.5, Math.min(2, scale))

    // Query quad-trees
    let bestPlanet:
      | { d: number; id: number | string; name?: string; x: number; y: number }
      | null = null
    const pIdx = planetIndexRef.current
    if (pIdx) {
      const candidates = pIdx.queryRadius(wx, wy, threshold)
      for (const c of candidates) {
        const d = Math.hypot(c.x - wx, c.y - wy)
        if (!bestPlanet || d < (bestPlanet?.d ?? Infinity)) {
          bestPlanet = { d, id: c.payload.id, name: c.payload.name, x: c.x, y: c.y }
        }
      }
    }

    let bestFleet: { d: number; id: number; x: number; y: number } | null = null
    const fIdx = fleetIndexRef.current
    if (fIdx) {
      const candidates = fIdx.queryRadius(wx, wy, threshold)
      for (const c of candidates) {
        const d = Math.hypot(c.x - wx, c.y - wy)
        if (!bestFleet || d < (bestFleet?.d ?? Infinity)) {
          bestFleet = { d, id: c.payload.id, x: c.x, y: c.y }
        }
      }
    }

    if (bestPlanet && (!bestFleet || bestPlanet.d <= bestFleet.d)) {
      setSelected({ type: 'planet', id: bestPlanet.id, name: bestPlanet.name, x: bestPlanet.x, y: bestPlanet.y })
    } else if (bestFleet) {
      setSelected({ type: 'fleet', id: bestFleet.id, x: bestFleet.x, y: bestFleet.y })
    } else {
      setSelected(null)
    }
  }

  // HUD controls
  function zoom(step: number) {
    const app = appRef.current
    const world = worldRef.current
    if (!app || !world) return
    const scale = world.scale.x
    const newScale = Math.min(5, Math.max(0.2, scale * step))
    const cx = app.renderer.width / 2
    const cy = app.renderer.height / 2
    const before = app.stage.toLocal({ x: cx, y: cy }, undefined, undefined, undefined)
    world.scale.set(newScale)
    const after = app.stage.toLocal({ x: cx, y: cy }, undefined, undefined, undefined)
    world.position.x += (after.x - before.x) * world.scale.x
    world.position.y += (after.y - before.y) * world.scale.y
  }

  function resetView() {
    const app = appRef.current
    const world = worldRef.current
    if (!app || !world) return
    world.position.set(0, 0)
    world.scale.set(1)
  }

  // Build spatial indices when data changes
  useEffect(() => {
    if (planets.length) {
      const minX = Math.min(...planets.map(p => p.x)) - 100
      const minY = Math.min(...planets.map(p => p.y)) - 100
      const maxX = Math.max(...planets.map(p => p.x)) + 100
      const maxY = Math.max(...planets.map(p => p.y)) + 100
      const q = new QuadTree<{ id: number | string; name?: string }>({ x: minX, y: minY, w: maxX - minX, h: maxY - minY }, 64)
      for (const p of planets) q.insert({ x: p.x, y: p.y, payload: { id: p.id, name: p.name } })
      planetIndexRef.current = q
    } else {
      planetIndexRef.current = null
    }
  }, [planets])

  useEffect(() => {
    if (fleets.length) {
      const minX = Math.min(...fleets.map(f => f.x)) - 100
      const minY = Math.min(...fleets.map(f => f.y)) - 100
      const maxX = Math.max(...fleets.map(f => f.x)) + 100
      const maxY = Math.max(...fleets.map(f => f.y)) + 100
      const q = new QuadTree<{ id: number }>({ x: minX, y: minY, w: maxX - minX, h: maxY - minY }, 32)
      for (const f of fleets) q.insert({ x: f.x, y: f.y, payload: { id: f.id } })
      fleetIndexRef.current = q
    } else {
      fleetIndexRef.current = null
    }
  }, [fleets])

  return (
    <div ref={containerRef} className={className}>
      {/* Overlay HUD */}
      <div className="pointer-events-auto absolute top-2 right-2 z-10 flex flex-col gap-2">
        <button
          className="px-2 py-1 text-xs bg-black/60 text-white rounded hover:bg-black/80"
          onClick={() => zoom(1.2)}
        >
          + Zoom In
        </button>
        <button
          className="px-2 py-1 text-xs bg-black/60 text-white rounded hover:bg-black/80"
          onClick={() => zoom(1/1.2)}
        >
          − Zoom Out
        </button>
        <button
          className="px-2 py-1 text-xs bg-black/60 text-white rounded hover:bg-black/80"
          onClick={resetView}
        >
          Reset View
        </button>
      </div>

      {/* Selection Tooltip */}
      {selected && (
        <div className="absolute bottom-2 left-2 z-10 p-2 rounded bg-black/60 text-white text-xs flex gap-2 items-center">
          {selected.type === 'planet' ? (
            <>
              <img
                src={new URL(`../../../assets/images/planet-type-${(Number(selected.id) % 4) + 1}.jpg`, import.meta.url).href}
                alt="planet"
                className="w-10 h-10 object-cover rounded"
              />
              <div>
                <div className="font-semibold">Planet {selected.name || selected.id}</div>
                <div>x: {Math.round(selected.x)} y: {Math.round(selected.y)}</div>
              </div>
            </>
          ) : (
            <div>
              <div className="font-semibold">Fleet #{selected.id}</div>
              <div>x: {Math.round(selected.x)} y: {Math.round(selected.y)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


