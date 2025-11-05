import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  subtext?: string
}

export const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = 'md', text, subtext, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center space-y-3', className)}
        {...props}
      >
        <Loader2 className={cn('animate-spin text-cyan-400', sizeClasses[size])} />
        {text && (
          <p className="text-sm font-medium text-cyan-400">{text}</p>
        )}
        {subtext && (
          <p className="text-xs text-muted-foreground">{subtext}</p>
        )}
      </div>
    )
  }
)
Loader.displayName = 'Loader'

export const LoaderCard = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = 'md', text, subtext, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'panel-glass border-cyan/20',
          'flex items-center justify-center',
          'min-h-[200px]',
          className
        )}
        {...props}
      >
        <Loader size={size} text={text} subtext={subtext} />
      </div>
    )
  }
)
LoaderCard.displayName = 'LoaderCard'







