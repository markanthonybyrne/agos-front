import { useState, useCallback, useRef, useEffect } from 'react'
import { ContextMenuItem } from '@/components/common/ContextMenu'

interface UseContextMenuOptions {
  items: ContextMenuItem[]
  enabled?: boolean
}

export function useContextMenu({ items, enabled = true }: UseContextMenuOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return

      e.preventDefault()
      e.stopPropagation()

      setPosition({ x: e.clientX, y: e.clientY })
      setIsOpen(true)
    },
    [enabled]
  )

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  // Close menu when clicking outside (handled by ContextMenu component)
  useEffect(() => {
    if (!isOpen) return

    const handleClick = () => {
      closeMenu()
    }

    // Use capture phase to catch events before they bubble
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [isOpen, closeMenu])

  return {
    isOpen,
    position,
    handleContextMenu,
    closeMenu,
    toggleMenu,
    items,
  }
}

