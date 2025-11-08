import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  overlayClassName?: string
  preventClose?: boolean
  zIndex?: number
}

export function CustomModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  overlayClassName,
  preventClose = false,
  zIndex = 10000,
}: CustomModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || preventClose) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose, preventClose])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        overlayClassName
      )}
      style={{ zIndex }}
      onClick={(e) => {
        if (!preventClose && e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ zIndex: zIndex }}
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative z-50 w-full max-w-2xl mx-4 rounded-2xl',
          'panel-glass surface-gradient card-glow vignette border-cyan-500/40',
          'shadow-2xl',
          className
        )}
        style={{
          zIndex: zIndex + 1,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description || !preventClose) && (
          <div className="px-6 pt-6 pb-4 border-b border-border/50 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {title && (
                  <h2 className="text-xl font-heading text-cyan-400 glow-cyan mb-1">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {!preventClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

