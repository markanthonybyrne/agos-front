import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface BuildingPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function BuildingPanel({ 
  isOpen, 
  onClose, 
  title, 
  description,
  children,
  className 
}: BuildingPanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border z-50',
          'transform transition-transform duration-300 ease-out',
          'overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        <Card className="h-full rounded-none border-0 panel-glass">
          <CardHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                {description && (
                  <CardDescription className="mt-1">{description}</CardDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

