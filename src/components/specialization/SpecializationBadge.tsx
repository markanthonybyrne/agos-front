import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SpecializationBadgeProps {
  specialization: 'industrial' | 'military' | 'relic'
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'destructive'
}

const specializationNames: Record<string, string> = {
  industrial: 'Industrial',
  military: 'Military',
  relic: 'Relic',
}

const specializationVariants: Record<string, 'default' | 'outline' | 'secondary' | 'destructive'> = {
  industrial: 'secondary',
  military: 'destructive',
  relic: 'outline',
}

export function SpecializationBadge({ specialization, className, variant }: SpecializationBadgeProps) {
  const name = specializationNames[specialization] || specialization
  const badgeVariant = variant || specializationVariants[specialization] || 'default'

  return (
    <Badge variant={badgeVariant} className={cn(className)}>
      {name}
    </Badge>
  )
}





