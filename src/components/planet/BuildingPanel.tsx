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
          'fixed right-0 top-0 flex h-full w-full max-h-screen flex-col bg-card border-l border-border z-50',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        <Card className="flex h-full min-h-0 flex-col rounded-none border-0 panel-glass">
          <CardHeader className="sticky top-0 z-10 border-b border-brand-cyan/30 bg-[rgba(8,14,23,0.9)] p-4 sm:p-6 backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg text-brand-cyan sm:text-xl">{title}</CardTitle>
                {description && (
                  <CardDescription className="text-sm text-muted-foreground/80">
                    {description}
                  </CardDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="self-end text-muted-foreground hover:text-brand-cyan sm:self-center"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

