import React, { ReactNode, useEffect, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface ContextMenuItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  separator?: boolean
  submenu?: ContextMenuItem[]
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  position: { x: number; y: number }
  onClose: () => void
  className?: string
}

export const ContextMenu = React.memo<ContextMenuProps>(function ContextMenu({
  items,
  position,
  onClose,
  className,
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const [mounted, setMounted] = useState(false)
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const openedAtRef = useRef<number>(Date.now())
  
  // Reset opened time when position changes (menu was opened)
  useEffect(() => {
    openedAtRef.current = Date.now()
  }, [position])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Adjust position to prevent off-screen
  useEffect(() => {
    if (!menuRef.current || !mounted) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x
    let y = position.y

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10
    }
    if (x < 10) {
      x = 10
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10
    }
    if (y < 10) {
      y = 10
    }

    setAdjustedPosition({ x, y })
  }, [position, mounted])

  // Close on click outside (left click only)
  useEffect(() => {
    // Track any pending timeouts
    let timeoutId: NodeJS.Timeout | null = null
    let listenerTimeoutId: NodeJS.Timeout | null = null
    
    const handleClickOutside = (e: MouseEvent) => {
      // Prevent immediate closure from the right-click that opened the menu
      // The click event after a right-click can fire very quickly, so we wait at least 200ms
      const timeSinceOpen = Date.now() - openedAtRef.current
      if (timeSinceOpen < 200) {
        return
      }
      
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Small delay to ensure the menu is fully rendered
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onClose()
        }, 10)
      }
    }

    // Store handler in ref so we can remove it properly
    clickHandlerRef.current = handleClickOutside

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Use 'click' instead of 'mousedown' to avoid conflicts with right-click
    // Add a delay before attaching listener to prevent immediate closure from the right-click that opened the menu
    listenerTimeoutId = setTimeout(() => {
      if (clickHandlerRef.current) {
        document.addEventListener('click', clickHandlerRef.current, true)
      }
    }, 250)

    document.addEventListener('keydown', handleEscape)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (listenerTimeoutId) {
        clearTimeout(listenerTimeoutId)
      }
      // Always try to remove listener if handler exists (safe even if not attached)
      if (clickHandlerRef.current) {
        document.removeEventListener('click', clickHandlerRef.current, true)
        clickHandlerRef.current = null
      }
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Close on scroll
  useEffect(() => {
    const handleScroll = () => {
      onClose()
    }

    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  if (!mounted) {
    return null
  }

  const menuContent = (
    <div
      ref={menuRef}
      className={cn(
        'context-menu fixed z-[9999] min-w-[200px]',
        'bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl shadow-cyan-500/10',
        'rounded-none overflow-hidden cut-corners relative',
        className
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: 'translateZ(0)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Glowing Cyan Stripe at Top */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: '2px',
          background: 'linear-gradient(to right, transparent 0%, #00FFFF 20%, #00FFFF 80%, transparent 100%)',
          boxShadow: '0 0 10px rgba(0, 255, 255, 0.9), 0 0 5px rgba(0, 255, 255, 0.7), 0 0 2px rgba(0, 255, 255, 0.5)',
        }}
      />
      <div className="py-1" style={{ paddingTop: 'calc(0.25rem + 2px)' }}>
        {items.map((item, index) => {
          if (item.separator) {
            return (
              <div
                key={`separator-${index}`}
                className="my-1 h-px bg-border/50"
              />
            )
          }

          const Icon = item.icon

          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                if (!item.disabled) {
                  item.onClick()
                  onClose()
                }
              }}
              disabled={item.disabled}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-white',
                'hover:bg-gray-700/50 hover:text-cyan-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200',
                'focus:bg-gray-700/50 focus:text-cyan-300 focus:outline-none'
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span className="flex-1">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return createPortal(menuContent, document.body)
})

