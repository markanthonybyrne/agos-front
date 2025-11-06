import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface EraBadgeProps {
  era: number
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'destructive'
}

const eraNames: Record<number, string> = {
  1: 'Awakening',
  2: 'Expansion',
  3: 'Consolidation',
  4: 'Ascension',
  5: 'Supremacy',
}

const eraColors: Record<number, string> = {
  1: 'default',
  2: 'secondary',
  3: 'outline',
  4: 'default',
  5: 'default',
}

export function EraBadge({ era, className, variant }: EraBadgeProps) {
  const eraName = eraNames[era] || `Era ${era}`
  const badgeVariant = variant || (eraColors[era] as 'default' | 'outline' | 'secondary' | 'destructive') || 'default'

  return (
    <Badge variant={badgeVariant} className={cn(className)}>
      {eraName}
    </Badge>
  )
}




