import React, { ReactNode, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Minimize2, Maximize2, Maximize } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PanelSize, PanelState } from '@/app/slices/panelSlice'
import { useWindowDrag } from '@/hooks/useWindowDrag'
import { useWindowResize } from '@/hooks/useWindowResize'
import {
  getDefaultWindowDimensions,
  getDefaultWindowPosition,
  constrainWindowPosition,
  constrainWindowDimensions,
  getWindowPositionFromStorage,
  saveWindowPositionToStorage,
  getWindowDimensionsFromStorage,
  saveWindowDimensionsToStorage,
} from '@/lib/windowUtils'

interface DesktopWindowProps {
  id: string
  isOpen: boolean
  onClose: () => void
  title: string | ReactNode
  description?: string
  children: ReactNode
  className?: string
  size?: PanelSize
  panelState?: PanelState
  isMaximized?: boolean
  position?: { x: number; y: number }
  dimensions?: { width: number; height: number }
  onMinimize?: () => void
  onMaximize?: () => void
  onPositionChange?: (position: { x: number; y: number }) => void
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void
  zIndex?: number
  persistPosition?: boolean
}

export const DesktopWindow = React.memo<DesktopWindowProps>(function DesktopWindow({
  id,
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = PanelSize.MEDIUM,
  panelState = PanelState.NORMAL,
  isMaximized = false,
  position: externalPosition,
  dimensions: externalDimensions,
  onMinimize,
  onMaximize,
  onPositionChange,
  onDimensionsChange,
  zIndex = 100,
  persistPosition = true,
}) {
  const windowRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [internalPosition, setInternalPosition] = useState<{ x: number; y: number } | null>(null)
  const [internalDimensions, setInternalDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // Initialize dimensions and position
  useEffect(() => {
    if (!mounted) {
      setMounted(true)
      return
    }

    if (externalDimensions) {
      setInternalDimensions(externalDimensions)
    } else {
      // Try to load from storage, otherwise use defaults
      const stored = persistPosition ? getWindowDimensionsFromStorage(id) : null
      setInternalDimensions(stored || getDefaultWindowDimensions(size))
    }

    if (externalPosition) {
      setInternalPosition(externalPosition)
    } else {
      // Try to load from storage, otherwise use defaults
      const stored = persistPosition ? getWindowPositionFromStorage(id) : null
      if (stored) {
        setInternalPosition(stored)
      } else {
        const dims = internalDimensions || getDefaultWindowDimensions(size)
        setInternalPosition(getDefaultWindowPosition(dims))
      }
    }
  }, [mounted, id, size, persistPosition])

  // Update internal state when external props change (but not during drag/resize)
  useEffect(() => {
    if (!isDragging && !isResizing) {
      if (externalDimensions) {
        setInternalDimensions(externalDimensions)
      }
      if (externalPosition) {
        setInternalPosition(externalPosition)
      }
    }
  }, [externalDimensions, externalPosition, isDragging, isResizing])

  // Calculate final position and dimensions
  const position = useMemo(() => {
    return externalPosition || internalPosition || { x: 100, y: 100 }
  }, [externalPosition, internalPosition])

  const dimensions = useMemo(() => {
    if (isMaximized) {
      return {
        width: window.innerWidth - 40,
        height: window.innerHeight - 40,
      }
    }
    return externalDimensions || internalDimensions || getDefaultWindowDimensions(size)
  }, [externalDimensions, internalDimensions, isMaximized, size])

  // Constrain dimensions
  const constrainedDimensions = useMemo(() => {
    return constrainWindowDimensions(dimensions)
  }, [dimensions])

  // Constrain position (only if not maximized)
  const constrainedPosition = useMemo(() => {
    if (isMaximized) {
      return { x: 20, y: 20 }
    }
    return constrainWindowPosition(position, constrainedDimensions)
  }, [isMaximized, position, constrainedDimensions])

  // Window drag handler
  const { onMouseDown: onDragMouseDown } = useWindowDrag({
    enabled: isOpen && !isMaximized && panelState === PanelState.NORMAL,
    onDragStart: () => {
      setIsDragging(true)
    },
    onDrag: (newPosition) => {
      const constrained = constrainWindowPosition(newPosition, constrainedDimensions)
      setInternalPosition(constrained)
      onPositionChange?.(constrained)
    },
    onDragEnd: (finalPosition) => {
      setIsDragging(false)
      const constrained = constrainWindowPosition(finalPosition, constrainedDimensions)
      setInternalPosition(constrained)
      onPositionChange?.(constrained)
      if (persistPosition) {
        saveWindowPositionToStorage(id, constrained)
      }
    },
    minX: 0,
    maxX: window.innerWidth - constrainedDimensions.width,
    minY: 0,
    maxY: window.innerHeight - constrainedDimensions.height,
  })

  // Debounced handlers for resize end to reduce state updates
  const handleResizeEndDebounced = useCallback(
    (finalDimensions: { width: number; height: number }, finalPosition: { x: number; y: number }) => {
      setIsResizing(false)
      const constrainedDims = constrainWindowDimensions(finalDimensions)
      const constrainedPos = constrainWindowPosition(finalPosition, constrainedDims)
      setInternalDimensions(constrainedDims)
      setInternalPosition(constrainedPos)
      onDimensionsChange?.(constrainedDims)
      onPositionChange?.(constrainedPos)
      if (persistPosition) {
        saveWindowDimensionsToStorage(id, constrainedDims)
        saveWindowPositionToStorage(id, constrainedPos)
      }
    },
    [persistPosition, id, onDimensionsChange, onPositionChange]
  )

  // Window resize handler
  const { createResizeHandle, isResizing: isResizingState } = useWindowResize({
    enabled: isOpen && !isMaximized && panelState === PanelState.NORMAL,
    minWidth: size === PanelSize.FULL_HEIGHT ? 600 : 300,
    minHeight: 200,
    onResizeStart: () => {
      setIsResizing(true)
    },
    onResize: (newDimensions, newPosition) => {
      const constrainedDims = constrainWindowDimensions(newDimensions)
      const constrainedPos = constrainWindowPosition(newPosition, constrainedDims)
      setInternalDimensions(constrainedDims)
      setInternalPosition(constrainedPos)
      // Only update external callbacks during resize, not on every frame
      onDimensionsChange?.(constrainedDims)
      onPositionChange?.(constrainedPos)
    },
    onResizeEnd: handleResizeEndDebounced,
  })

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen && windowRef.current) {
      const firstFocusable = windowRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }
  }, [isOpen])

  if (!mounted || panelState === PanelState.MINIMIZED) {
    return null
  }

  // Full-screen windows get frosted glass backdrop blur
  const isFullScreen = size === PanelSize.FULL_HEIGHT || isMaximized
  const backdropBlur = isFullScreen ? 'backdrop-blur-md' : ''
  
  // For full-screen views, add a backdrop overlay to blur the map behind
  const needsBackdropOverlay = isFullScreen && panelState === PanelState.NORMAL

  const windowContent = (
    <>
      {/* Backdrop overlay for full-screen windows to blur map behind */}
      {needsBackdropOverlay && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: zIndex - 1,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        />
      )}
      <div
        ref={windowRef}
        data-window={id}
        className={cn(
          'desktop-window fixed transition-all duration-200 ease-out',
          isDragging || isResizingState ? 'select-none' : '',
          isFullScreen && 'inset-5',
          className
        )}
        style={{
          zIndex,
          ...(isMaximized
            ? {
                left: 20,
                top: 20,
                width: window.innerWidth - 40,
                height: window.innerHeight - 40,
              }
            : {
                left: constrainedPosition.x,
                top: constrainedPosition.y,
                width: constrainedDimensions.width,
                height: constrainedDimensions.height,
              }),
          transform: 'translateZ(0)', // GPU acceleration
          willChange: isDragging || isResizingState ? 'transform' : 'auto',
        }}
      >
      <Card
        className={cn(
          'h-full w-full flex flex-col panel-glass border border-cyan-500/30',
          'shadow-2xl shadow-cyan-500/10',
          backdropBlur,
          'rounded-none' // Sharp corners - EVE Online style
        )}
        style={{
          background: isFullScreen
            ? 'linear-gradient(180deg, hsl(var(--card) / 0.85) 0%, hsl(var(--card) / 0.75) 100%)'
            : 'linear-gradient(180deg, hsl(var(--card) / 0.75) 0%, hsl(var(--card) / 0.6) 100%)',
        }}
      >
        {/* Glowing Cyan Stripe at Top - EVE Online style */}
        <div 
          className="absolute top-0 left-0 right-0 z-10"
          style={{
            height: '2px',
            background: 'linear-gradient(to right, transparent 0%, #00FFFF 20%, #00FFFF 80%, transparent 100%)',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.9), 0 0 5px rgba(0, 255, 255, 0.7), 0 0 2px rgba(0, 255, 255, 0.5)',
          }}
        />
        
        {/* Window Header - Draggable */}
        <CardHeader
          className={cn(
            'flex-shrink-0 border-b border-cyan-500/20',
            'cursor-move select-none',
            'flex flex-row items-center justify-between p-2 pr-1',
            'relative', // For positioning the cyan stripe
            'bg-gradient-to-b from-gray-900/95 to-gray-900/90'
          )}
          onMouseDown={onDragMouseDown}
          style={{
            paddingTop: 'calc(0.5rem + 2px)', // Account for stripe height
            marginTop: '2px', // Push header below stripe
          }}
        >
          <div className="flex-1 min-w-0 px-2">
            <CardTitle
              className={cn(
                'text-sm font-semibold truncate text-cyan-300',
                typeof title !== 'string' && 'flex items-center gap-2'
              )}
            >
              {title}
            </CardTitle>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onMinimize && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMinimize()
                }}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-cyan-500/50 border border-transparent transition-colors bg-transparent"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            )}
            {onMaximize && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMaximize()
                }}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-cyan-500/50 border border-transparent transition-colors bg-transparent"
              >
                {isMaximized ? <Maximize className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/50 border border-transparent transition-colors bg-transparent"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>

        {/* Window Content */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="p-4">{children}</div>
          </div>
        </CardContent>

        {/* Resize Handles - Only show if not maximized */}
        {!isMaximized && panelState === PanelState.NORMAL && (
          <>
            {/* Corner handles */}
            <div
              {...createResizeHandle('nw', 'absolute top-0 left-0 w-3 h-3 cursor-nw-resize')}
              style={{ zIndex: zIndex + 1 }}
            />
            <div
              {...createResizeHandle('ne', 'absolute top-0 right-0 w-3 h-3 cursor-ne-resize')}
              style={{ zIndex: zIndex + 1 }}
            />
            <div
              {...createResizeHandle('sw', 'absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize')}
              style={{ zIndex: zIndex + 1 }}
            />
            <div
              {...createResizeHandle('se', 'absolute bottom-0 right-0 w-3 h-3 cursor-se-resize border-r-2 border-b-2 border-cyan-500/50 hover:border-cyan-500 transition-colors')}
              style={{ zIndex: zIndex + 1 }}
            />

            {/* Edge handles */}
            <div
              {...createResizeHandle('n', 'absolute top-0 left-3 right-3 h-1 cursor-n-resize')}
              style={{ zIndex: zIndex + 1 }}
            />
            <div
              {...createResizeHandle('s', 'absolute bottom-0 left-3 right-3 h-1 cursor-s-resize')}
              style={{ zIndex: zIndex + 1 }}
            />
            <div
              {...createResizeHandle('w', 'absolute left-0 top-3 bottom-3 w-1 cursor-w-resize')}
              style={{ zIndex: zIndex + 1 }}
            />
            <div
              {...createResizeHandle('e', 'absolute right-0 top-3 bottom-3 w-1 cursor-e-resize')}
              style={{ zIndex: zIndex + 1 }}
            />
          </>
        )}
      </Card>
    </div>
    </>
  )

  // Render to document.body via portal
  return isOpen ? createPortal(windowContent, document.body) : null
})

