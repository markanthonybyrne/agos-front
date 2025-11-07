import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { formatResource } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface ResourceIconProps {
  resource: 'tellerium' | 'krypton' | 'dark_matter' | 'T' | 'K'
  amount?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showAmount?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function ResourceIcon({
  resource,
  amount,
  size = 'md',
  showLabel = false,
  showAmount = true,
  className,
}: ResourceIconProps) {
  const getImage = () => {
    switch (resource) {
      case 'tellerium':
      case 'T':
        return getTelleriumImage()
      case 'krypton':
      case 'K':
        return getKryptonImage()
      case 'dark_matter':
        // Dark matter doesn't have an image yet, return undefined
        return undefined
      default:
        return undefined
    }
  }

  const getLabel = () => {
    switch (resource) {
      case 'tellerium':
      case 'T':
        return 'T'
      case 'krypton':
      case 'K':
        return 'K'
      case 'dark_matter':
        return 'DM'
      default:
        return ''
    }
  }

  const imageSrc = getImage()
  const label = getLabel()

  if (!imageSrc && resource === 'dark_matter') {
    // Fallback for dark matter - show text icon
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <span className={cn('font-bold text-purple-400', textSizeClasses[size])}>DM</span>
        {showAmount && amount !== undefined && (
          <span className={cn('text-muted-foreground', textSizeClasses[size])}>
            {formatResource(amount)}
          </span>
        )}
      </div>
    )
  }

  if (!imageSrc) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <img
        src={imageSrc}
        alt={label}
        className={sizeClasses[size]}
      />
      {showLabel && <span className={cn('text-muted-foreground', textSizeClasses[size])}>{label}</span>}
      {showAmount && amount !== undefined && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {formatResource(amount)}
        </span>
      )}
    </div>
  )
}




