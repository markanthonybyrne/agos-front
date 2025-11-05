import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Maximize2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskbarWidget {
  id: string
  title: string
}

interface TaskbarProps {
  minimizedWidgets: TaskbarWidget[]
  onRestoreWidget: (widgetId: string) => void
  onCloseWidget: (widgetId: string) => void
  onReorder?: (newOrder: string[]) => void
}

export function Taskbar({
  minimizedWidgets,
  onRestoreWidget,
  onCloseWidget,
  onReorder,
}: TaskbarProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('holopad-taskbar-order')
    return saved ? JSON.parse(saved) : []
  })

  // Update order when minimizedWidgets changes
  useEffect(() => {
    const currentIds = minimizedWidgets.map(w => w.id)
    const saved = localStorage.getItem('holopad-taskbar-order')
    const savedOrder = saved ? JSON.parse(saved) : []
    
    // Merge saved order with new widgets
    const merged = [...savedOrder.filter((id: string) => currentIds.includes(id))]
    minimizedWidgets.forEach(w => {
      if (!merged.includes(w.id)) {
        merged.push(w.id)
      }
    })
    
    setWidgetOrder(merged)
  }, [minimizedWidgets])

  const orderedWidgets = useMemo(() => {
    return minimizedWidgets.sort((a, b) => {
      const aIndex = widgetOrder.indexOf(a.id)
      const bIndex = widgetOrder.indexOf(b.id)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }, [minimizedWidgets, widgetOrder])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedIndex === null || draggedIndex === index) return

    const newOrder = [...widgetOrder]
    const draggedWidget = orderedWidgets[draggedIndex]
    const draggedId = draggedWidget.id
    
    // Remove from old position
    const oldIndex = newOrder.indexOf(draggedId)
    if (oldIndex !== -1) {
      newOrder.splice(oldIndex, 1)
    }
    
    // Insert at new position
    const targetId = orderedWidgets[index].id
    const targetIndex = newOrder.indexOf(targetId)
    if (targetIndex !== -1) {
      newOrder.splice(targetIndex, 0, draggedId)
    } else {
      newOrder.splice(index, 0, draggedId)
    }
    
    setWidgetOrder(newOrder)
    setDraggedIndex(index)
    onReorder?.(newOrder)
    localStorage.setItem('holopad-taskbar-order', JSON.stringify(newOrder))
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  if (minimizedWidgets.length === 0) {
    return null
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {orderedWidgets.map((widget, index) => (
          <div
            key={widget.id}
            draggable
            onDragStart={(e) => {
              e.stopPropagation()
              handleDragStart(index)
            }}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDragLeave={(e) => {
              e.preventDefault()
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
              "bg-muted/50 hover:bg-muted border-border/50 hover:border-primary/50",
              draggedIndex === index ? "opacity-50 cursor-grabbing" : "cursor-grab"
            )}
          >
            <span className="text-sm font-medium whitespace-nowrap">
              {widget.title}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  onRestoreWidget(widget.id)
                }}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-red-500/20 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseWidget(widget.id)
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

