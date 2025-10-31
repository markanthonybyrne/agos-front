import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface VisualItemGridProps {
  items: Array<{
    id: string
    name: string
    image?: string
    imageAlt?: string
    description?: string
    badge?: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
  }>
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function VisualItemGrid({ 
  items, 
  columns = 4,
  className 
}: VisualItemGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {items.map((item) => (
        <Card
          key={item.id}
          onClick={item.onClick}
          className={cn(
            'panel-glass border-border/50 cursor-pointer transition-all duration-200',
            'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
            'hover:scale-105 hover:-translate-y-1',
            item.disabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0',
            item.className
          )}
        >
          <CardContent className="p-4 flex flex-col items-center gap-3">
            {/* Image */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt || item.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'auto' }}
                />
              ) : (
                <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
              )}
              {item.badge && (
                <div className="absolute -top-2 -right-2">
                  {item.badge}
                </div>
              )}
            </div>
            
            {/* Name */}
            <div className="text-center">
              <h4 className="text-sm font-semibold line-clamp-2">{item.name}</h4>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

