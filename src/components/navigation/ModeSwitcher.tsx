import { MapPin, Home, Settings, FlaskConical, Factory, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ModeType = 'system' | 'colony' | 'infrastructure' | 'research' | 'production' | 'fleets'

interface Mode {
  id: ModeType
  label: string
  icon: typeof MapPin
}

const modes: Mode[] = [
  { id: 'system', label: 'SYSTEM', icon: MapPin },
  { id: 'colony', label: 'COLONY', icon: Home },
  { id: 'infrastructure', label: 'INFRASTRUCTURE', icon: Settings },
  { id: 'research', label: 'RESEARCH', icon: FlaskConical },
  { id: 'production', label: 'PRODUCTION', icon: Factory },
  { id: 'fleets', label: 'FLEETS', icon: Ship },
]

interface ModeSwitcherProps {
  activeMode: ModeType
  onModeChange: (mode: ModeType) => void
  className?: string
}

export function ModeSwitcher({ activeMode, onModeChange, className }: ModeSwitcherProps) {
  return (
    <div className={cn('flex items-center gap-1 bg-muted/20 p-1 rounded-lg', className)}>
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = activeMode === mode.id
        
        return (
          <Button
            key={mode.id}
            variant={isActive ? 'default' : 'ghost'}
            size="lg"
            onClick={() => onModeChange(mode.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-2 py-3 px-4 transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_8px_rgba(25,234,253,0.6)]')} />
            <span className="text-xs font-semibold tracking-wide">{mode.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

