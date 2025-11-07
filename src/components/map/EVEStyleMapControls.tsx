import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Home, 
  Eye, 
  GitBranch, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  ChevronRight,
  Minus,
  Plus,
  Navigation,
  Search,
  Target,
  MapPin,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'

// Engine dot component with animated pulse
function EngineDot({ x, y, active, delay }: { x: number; y: number; active: boolean; delay: number }) {
  const [pulseScale, setPulseScale] = useState(1)
  const [pulseOpacity, setPulseOpacity] = useState(0.7)

  useEffect(() => {
    if (!active) {
      setPulseScale(1)
      setPulseOpacity(0.4)
      return
    }

    const interval = setInterval(() => {
      const time = (Date.now() / 1500 + delay) % 1
      const scale = 1 + Math.sin(time * Math.PI * 2) * 0.2
      const opacity = 0.7 + Math.sin(time * Math.PI * 2) * 0.3
      setPulseScale(scale)
      setPulseOpacity(opacity)
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [active, delay])

  return (
    <div
      className="absolute w-2 h-2 bg-[#FFAA00] rounded-full"
      style={{
        left: `50%`,
        top: `50%`,
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${pulseScale})`,
        opacity: pulseOpacity,
        boxShadow: active 
          ? `0 0 8px rgba(255, 170, 0, ${pulseOpacity}), 0 0 4px rgba(255, 170, 0, ${pulseOpacity * 0.8})` 
          : `0 0 3px rgba(255, 170, 0, 0.5)`,
        transition: 'transform 0.1s ease-out, opacity 0.1s ease-out, box-shadow 0.1s ease-out',
      }}
    />
  )
}

interface EVEStyleMapControlsProps {
  onNavigateToCore?: () => void
  onToggleSpiralGuidelines?: (show: boolean) => void
  showSpiralGuidelines?: boolean
  onToggleRoutes?: (show: boolean) => void
  showRoutes?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onReset?: () => void
  zoomLevel?: number
  onOpenPanel?: (type: PanelType, size: PanelSize) => void
  onPan?: (deltaX: number, deltaY: number) => void
  panStep?: number
}

export function EVEStyleMapControls({
  onNavigateToCore,
  onToggleSpiralGuidelines,
  showSpiralGuidelines = false,
  onToggleRoutes,
  showRoutes = false,
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLevel = 1,
  onOpenPanel,
  onPan,
  panStep = 50,
  minZoom = 0.09,
  maxZoom = 1.554,
}: EVEStyleMapControlsProps & { minZoom?: number; maxZoom?: number }) {
  const [engineActive, setEngineActive] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  
  // Calculate zoom progress (0-100%) based on current zoom relative to min/max
  const zoomProgress = useMemo(() => {
    if (zoomLevel <= minZoom) return 0
    if (zoomLevel >= maxZoom) return 100
    const normalized = ((zoomLevel - minZoom) / (maxZoom - minZoom)) * 100
    return Math.max(0, Math.min(100, normalized))
  }, [zoomLevel, minZoom, maxZoom])
  
  const handlePan = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!onPan) return
    
    const step = panStep
    switch (direction) {
      case 'up':
        onPan(0, step)
        break
      case 'down':
        onPan(0, -step)
        break
      case 'left':
        onPan(step, 0)
        break
      case 'right':
        onPan(-step, 0)
        break
    }
  }, [onPan, panStep])

  // Simulate engine pulsing
  useEffect(() => {
    const interval = setInterval(() => {
      setEngineActive(prev => !prev)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  // Generate zoom progress segments (270-degree arc, from -135 to +135 degrees)
  // This shows zoom level as a progress indicator
  const zoomSegments = Array.from({ length: 40 }, (_, i) => {
    const segmentProgress = i / 40
    const angle = segmentProgress * 270 - 135 // -135 to +135 degrees
    const threshold = (segmentProgress * 100)
    const isActive = threshold <= zoomProgress
    const isMarker = Math.abs(threshold - zoomProgress) < 2.5
    return { angle, isActive, isMarker, segmentProgress }
  })

  // Position function buttons around the main circle (outside the control ring)
  const buttonPositions = [
    { 
      angle: 45, 
      icon: ChevronRight, 
      onClick: () => onNavigateToCore?.(), 
      title: "Navigate to Core", 
      active: false, 
      hasDot: true 
    },
    { 
      angle: 90, 
      icon: MapPin, 
      onClick: () => onOpenPanel?.(PanelType.FLEETS, PanelSize.LARGE), 
      title: "Waypoints / Fleet Management", 
      active: false 
    },
    { 
      angle: 135, 
      icon: Target, 
      onClick: () => onToggleSpiralGuidelines?.(!showSpiralGuidelines), 
      title: "Toggle Guidelines", 
      active: showSpiralGuidelines 
    },
    { 
      angle: 225, 
      icon: Navigation, 
      onClick: () => onToggleRoutes?.(!showRoutes), 
      title: "Toggle Routes", 
      active: showRoutes 
    },
    { 
      angle: 315, 
      icon: Search, 
      onClick: () => onOpenPanel?.(PanelType.SIGNALS, PanelSize.LARGE), 
      title: "Signals / Scan", 
      active: false 
    },
    { 
      angle: 0, 
      icon: RotateCcw, 
      onClick: () => onReset?.(), 
      title: "Reset View", 
      active: false 
    },
  ]

  // Main circle radius: 96px (half of 192px for w-48 h-48 circle)
  // Function buttons positioned outside the circle
  const mainCircleRadius = 96
  const buttonDistance = mainCircleRadius + 45 // Distance from center to button center

  // If minimized, show a compact button to restore
  if (isMinimized) {
    return (
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <button
          onClick={() => setIsMinimized(false)}
          className={cn(
            "pointer-events-auto w-12 h-12 rounded-full relative",
            "bg-gray-900/95 border-2 border-gray-700/50",
            "shadow-2xl shadow-black/50",
            "backdrop-blur-md",
            "flex items-center justify-center",
            "hover:bg-gray-800/95 hover:border-gray-600/70",
            "transition-all duration-300",
            "group overflow-visible"
          )}
          style={{
            background: 'radial-gradient(circle at center, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
          }}
          title="Show Map Controls"
        >
          {/* Cyan pulse effect on hover - similar to ticker countdown */}
          {/* Expanding ping layer - extends beyond button for visible glow */}
          <div 
            className="absolute rounded-full bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              left: '-8px',
              top: '-8px',
              right: '-8px',
              bottom: '-8px',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          {/* Pulsing glow layer - extends beyond button for visible glow */}
          <div 
            className="absolute rounded-full bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              left: '-8px',
              top: '-8px',
              right: '-8px',
              bottom: '-8px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          
          {/* Small engine indicator */}
          <div className="relative w-6 h-6 flex items-center justify-center z-10">
            <div className="absolute w-4 h-4 rounded-full border border-[#FFAA00]/40" style={{
              boxShadow: '0 0 4px rgba(255, 170, 0, 0.3)',
            }} />
            {[0, 90, 180, 270].map((angle) => {
              const rad = (angle * Math.PI) / 180
              const radius = 6
              const x = Math.cos(rad) * radius
              const y = Math.sin(rad) * radius
              return (
                <div
                  key={angle}
                  className="absolute w-1 h-1 bg-[#FFAA00] rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                    opacity: 0.7,
                    boxShadow: '0 0 3px rgba(255, 170, 0, 0.6)',
                  }}
                />
              )
            })}
          </div>
          {/* Chevron up icon */}
          <ChevronUp className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 text-gray-400 group-hover:text-cyan-400 transition-colors z-10" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      {/* Minimize Button - Positioned above the control panel */}
      <button
        onClick={() => setIsMinimized(true)}
        className={cn(
          "pointer-events-auto absolute left-1/2 transform -translate-x-1/2 -top-8",
          "w-8 h-8 rounded-full",
          "bg-gray-900/90 border border-gray-600/40",
          "flex items-center justify-center",
          "hover:bg-gray-800/90 hover:border-gray-500/60",
          "transition-all duration-200",
          "shadow-lg shadow-black/30",
          "backdrop-blur-sm",
          "group"
        )}
        title="Minimize Controls"
      >
        <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-cyan-400 transition-colors" />
      </button>
      
      {/* Main Circular Control Panel with Function Buttons */}
      <div className="relative pointer-events-auto" style={{ width: '350px', height: '350px' }}>
        {/* Function Buttons - Positioned around the main circle */}
        {buttonPositions.map(({ angle, icon: Icon, onClick, title, active, hasDot }) => {
          const rad = ((angle - 90) * Math.PI) / 180 // Adjust so 0° is at top
          const x = 175 + buttonDistance * Math.cos(rad)
          const y = 175 + buttonDistance * Math.sin(rad)

          return (
            <button
              key={angle}
              onClick={onClick}
              className={cn(
                "absolute w-10 h-10 rounded-full",
                "bg-gray-900/90 border border-gray-600/40",
                "flex items-center justify-center",
                "hover:bg-gray-800/90 hover:border-gray-500/60",
                "transition-all duration-200",
                "shadow-lg shadow-black/30",
                "backdrop-blur-sm",
                active && "bg-gray-800/50 border-gray-500/70",
                "transform -translate-x-1/2 -translate-y-1/2"
              )}
              style={{
                left: `${x}px`,
                top: `${y}px`,
              }}
              title={title}
            >
              <Icon className="w-4 h-4 text-white" />
              {hasDot && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full shadow-sm shadow-green-400/50" />
              )}
            </button>
          )
        })}

        {/* Main Circular Control Panel */}
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            "relative w-48 h-48 rounded-full",
            "bg-gray-900/95 border-2 border-gray-700/50",
            "shadow-2xl shadow-black/50",
            "backdrop-blur-md",
            "flex items-center justify-center",
            "overflow-hidden"
          )}
          style={{
            background: 'radial-gradient(circle at center, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
          }}
        >
          {/* Throttle Arc - Top 270 degrees */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 192 192"
            style={{ transform: 'rotate(-135deg)' }}
          >
            <defs>
              <linearGradient id="throttleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FFAA00" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {zoomSegments.map((segment, i) => {
              const radius = 82
              const segmentAngle = 270 / 40 // 6.75 degrees per segment
              const startAngle = (segment.angle * Math.PI) / 180
              const endAngle = ((segment.angle + segmentAngle) * Math.PI) / 180
              
              // Calculate arc endpoints
              const x1 = 96 + radius * Math.cos(startAngle)
              const y1 = 96 + radius * Math.sin(startAngle)
              const x2 = 96 + radius * Math.cos(endAngle)
              const y2 = 96 + radius * Math.sin(endAngle)

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={segment.isActive ? '#FFAA00' : '#666'}
                  strokeWidth={segment.isMarker ? 4 : 2.5}
                  strokeOpacity={segment.isActive ? (segment.isMarker ? 1 : 0.7) : 0.25}
                  strokeLinecap="round"
                  style={{
                    filter: segment.isMarker 
                      ? 'drop-shadow(0 0 6px #FFAA00) drop-shadow(0 0 3px rgba(255, 170, 0, 0.8))' 
                      : segment.isActive
                      ? 'drop-shadow(0 0 2px rgba(255, 170, 0, 0.5))'
                      : 'none',
                    transition: 'all 0.2s ease-out',
                  }}
                />
              )
            })}
          </svg>

          {/* Zoom Progress Markers */}
          {(() => {
            // Calculate marker position along the arc
            // The arc spans 270 degrees from -135 to +135
            // Map zoom progress (0-100%) to arc position
            const markerAngle = (zoomProgress / 100) * 270 - 135 // -135 to +135 degrees
            const markerRad = (markerAngle * Math.PI) / 180
            const markerRadius = 82 // Same radius as the arc segments
            const markerX = Math.cos(markerRad) * markerRadius
            const markerY = Math.sin(markerRad) * markerRadius
            
            return (
              <div className="absolute inset-0 pointer-events-none">
                {/* Active zoom marker - positioned along the arc */}
                <div
                  className="absolute w-0 h-0 border-l-[5px] border-r-[5px] border-t-[10px] border-t-[#FFAA00] border-l-transparent border-r-transparent"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${markerX}px), calc(-50% + ${markerY}px)) rotate(${markerAngle + 90}deg)`,
                    filter: 'drop-shadow(0 0 3px #FFAA00)',
                    transition: 'transform 0.3s ease-out',
                  }}
                />
                {/* Inactive marker at end of arc */}
                <div
                  className="absolute w-0 h-0 border-l-[5px] border-r-[5px] border-t-[10px] border-t-gray-600 border-l-transparent border-r-transparent opacity-50"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${Math.cos(135 * Math.PI / 180) * markerRadius}px), calc(-50% + ${Math.sin(135 * Math.PI / 180) * markerRadius}px)) rotate(225deg)`,
                  }}
                />
              </div>
            )
          })()}

          {/* Control Ring - Between throttle arc and center engine core */}
          {/* Annular region: radius ~40-70px from center (between throttle at ~82px and engine at ~16px) */}
          {(() => {
            // Control ring radius - positioned between throttle arc and center
            const controlRadius = 50 // Distance from center for controls
            const buttonSize = 28 // Size of control buttons
            
            return (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Panning Controls - Cardinal directions (Up/Down/Left/Right) */}
                {onPan && (() => {
                  const panAngles = [
                    { angle: 0, direction: 'up' as const, icon: ArrowUp },
                    { angle: 90, direction: 'right' as const, icon: ArrowRight },
                    { angle: 180, direction: 'down' as const, icon: ArrowDown },
                    { angle: 270, direction: 'left' as const, icon: ArrowLeft },
                  ]
                  
                  return panAngles.map(({ angle, direction, icon: Icon }) => {
                    const rad = ((angle - 90) * Math.PI) / 180 // Convert to radians, adjust so 0° is top
                    const x = controlRadius * Math.cos(rad)
                    const y = controlRadius * Math.sin(rad)
                    
                    return (
                      <button
                        key={direction}
                        onClick={() => handlePan(direction)}
                        className={cn(
                          "absolute w-7 h-7 rounded-full",
                          "bg-gray-800/90 border border-gray-700/50",
                          "hover:bg-gray-700/90 hover:border-gray-500/60",
                          "transition-all duration-200",
                          "flex items-center justify-center",
                          "text-white",
                          "shadow-lg shadow-black/40",
                          "backdrop-blur-sm",
                          "pointer-events-auto"
                        )}
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        title={`Pan ${direction.charAt(0).toUpperCase() + direction.slice(1)}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    )
                  })
                })()}
                
                {/* Zoom Controls - Diagonal/intermediate positions */}
                {(() => {
                  const zoomRadius = controlRadius
                  // Position zoom controls at 45° and 225° (diagonal positions)
                  const zoomPositions = [
                    { angle: 45, action: 'in' as const, icon: ZoomIn, handler: onZoomIn },
                    { angle: 225, action: 'out' as const, icon: ZoomOut, handler: onZoomOut },
                  ]
                  
                  return zoomPositions.map(({ angle, action, icon: Icon, handler }) => {
                    const rad = ((angle - 90) * Math.PI) / 180
                    const x = zoomRadius * Math.cos(rad)
                    const y = zoomRadius * Math.sin(rad)
                    
                    return (
                      <button
                        key={action}
                        onClick={handler}
                        className={cn(
                          "absolute w-7 h-7 rounded-full",
                          "bg-gray-800/90 border border-gray-700/50",
                          "hover:bg-gray-700/90 hover:border-gray-500/60",
                          "transition-all duration-200",
                          "flex items-center justify-center",
                          "text-white",
                          "shadow-lg shadow-black/40",
                          "backdrop-blur-sm",
                          "pointer-events-auto"
                        )}
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        title={`Zoom ${action === 'in' ? 'In' : 'Out'}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    )
                  })
                })()}
                
                {/* Zoom Level Display - Positioned at 135° (top-left diagonal) */}
                <div 
                  className="absolute px-1.5 py-0.5 bg-gray-800/90 border border-gray-700/50 rounded text-[9px] text-white font-mono text-center shadow-lg shadow-black/40 backdrop-blur-sm pointer-events-auto"
                  style={{
                    left: `calc(50% + ${controlRadius * Math.cos((135 - 90) * Math.PI / 180)}px)`,
                    top: `calc(50% + ${controlRadius * Math.sin((135 - 90) * Math.PI / 180)}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {Math.round(zoomLevel * 100)}%
                </div>
              </div>
            )
          })()}

          {/* Inner Core - Engine Status (smaller, at very center) */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Concentric rings of glowing dots */}
            {[0, 1, 2].map((ring) => {
              const dotCount = 4 + ring * 2
              return (
                <div
                  key={ring}
                  className="absolute rounded-full"
                  style={{
                    width: `${20 + ring * 10}px`,
                    height: `${20 + ring * 10}px`,
                    border: `1px solid ${engineActive ? 'rgba(255, 170, 0, 0.4)' : 'rgba(255, 170, 0, 0.2)'}`,
                    boxShadow: engineActive
                      ? `0 0 ${6 + ring * 3}px rgba(255, 170, 0, ${0.4 - ring * 0.1})`
                      : `0 0 ${3 + ring * 1.5}px rgba(255, 170, 0, ${0.2 - ring * 0.05})`,
                    transition: 'all 0.8s ease-in-out',
                  }}
                >
                  {Array.from({ length: dotCount }).map((_, i) => {
                    const angle = (i / dotCount) * 360
                    const rad = (angle * Math.PI) / 180
                    const radius = (20 + ring * 10) / 2 - 2
                    const x = Math.cos(rad) * radius
                    const y = Math.sin(rad) * radius
                    
                    return (
                      <EngineDot
                        key={i}
                        x={x}
                        y={y}
                        active={engineActive}
                        delay={i * 0.1 + ring * 0.3}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Center Pointers */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[10px] border-b-gray-600 border-l-transparent border-r-transparent opacity-60" />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[10px] border-t-gray-600 border-l-transparent border-r-transparent opacity-60" />

          {/* Side Indicators */}
          <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg shadow-green-400/50" />
          <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-5 h-5 flex flex-col gap-0.5 items-center justify-center">
            <div className="w-3 h-0.5 bg-gray-500" />
            <div className="w-3 h-0.5 bg-gray-500" />
            <div className="w-3 h-0.5 bg-gray-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

