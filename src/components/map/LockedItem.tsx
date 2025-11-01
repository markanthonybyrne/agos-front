import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LockedItemProps {
  type: 'quadrant' | 'sector' | 'galaxy'
  unlockRequirement: string
  children: React.ReactNode
  className?: string
}

export function LockedItem({ type, unlockRequirement, children, className }: LockedItemProps) {
  return (
    <div className={cn("relative group", className)}>
      {/* Dimmed/blurred content */}
      <div className="opacity-40 grayscale blur-[2px] pointer-events-none select-none">
        {children}
      </div>
      
      {/* Lock icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Lock className="w-12 h-12 text-yellow-500/80 drop-shadow-lg" />
      </div>
      
      {/* ??? text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-16">
        <span className="text-4xl font-mono text-muted-foreground/50 drop-shadow-lg">???</span>
      </div>
      
      {/* Hover tooltip */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -mt-16 z-50">
        <div className="parallelogram-box bg-background/95 backdrop-blur-sm border border-yellow-500/50 p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-yellow-500">Locked</span>
          </div>
          <div className="text-xs text-muted-foreground max-w-[200px]">
            {unlockRequirement}
          </div>
        </div>
      </div>
    </div>
  )
}

