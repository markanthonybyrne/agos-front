import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import { getAvatarUrl, getInitials } from '@/lib/avatar'
import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackIcon?: React.ReactNode
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-xl',
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  fallbackIcon,
}: AvatarProps) {
  const avatarUrl = src ? getAvatarUrl(src) : null
  const [imageError, setImageError] = useState(false)
  const initials = name ? getInitials(name) : '?'
  const sizeClass = sizeClasses[size]
  const showImage = avatarUrl && !imageError

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-[#17191D] border-0 overflow-hidden',
        sizeClass,
        className
      )}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-semibold text-white bg-[#17191D]',
            'flex'
          )}
        >
          {name ? (
            <span className="select-none text-white">{initials}</span>
          ) : (
            fallbackIcon || <User className="w-1/2 h-1/2 text-white" />
          )}
        </div>
      )}
    </div>
  )
}