import { ReactNode } from 'react'
import { Minimize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WidgetWindowProps {
  title: string
  children: ReactNode
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
  className?: string
  'data-tutorial'?: string
}

export function WidgetWindow({ 
  title, 
  children, 
  onMinimize, 
  onClose, 
  isMinimized = false,
  className,
  'data-tutorial': dataTutorial
}: WidgetWindowProps) {
  return (
    <Card 
      className={cn("h-full flex flex-col overflow-hidden", className)}
      data-tutorial={dataTutorial}
    >
      {/* Window-style header with controls */}
      <CardHeader className="flex-shrink-0 p-2 border-b border-border/50 bg-muted/20 widget-drag-handle cursor-move">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold truncate pr-2">{title}</CardTitle>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {onMinimize && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onMinimize()
                }}
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-red-500/20 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onClose()
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content area */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      )}
    </Card>
  )
}

