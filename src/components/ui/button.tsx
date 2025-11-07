import * as React from 'react'
import * as SlotPrimitive from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-none cut-corners',
  {
    variants: {
      variant: {
        default:
          'bg-gray-800/90 text-white border border-cyan-400 shadow-[0_0_4px_rgba(0,255,255,0.3)] hover:bg-gray-700/90 hover:border-cyan-300 hover:shadow-[0_0_8px_rgba(0,255,255,0.5)]',
        destructive:
          'bg-red-900/90 text-white border border-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)] hover:bg-red-800/90 hover:border-red-400 hover:shadow-[0_0_8px_rgba(239,68,68,0.5)]',
        outline:
          'bg-gray-700/90 text-white border border-gray-500 hover:bg-gray-600/90 hover:border-gray-400',
        secondary:
          'bg-gray-700/90 text-white border border-gray-500 hover:bg-gray-600/90 hover:border-gray-400',
        ghost: 'border-transparent hover:bg-gray-800/50 hover:text-foreground',
        link: 'text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300 border-transparent',
        warning:
          'bg-orange-900/90 text-white border border-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.3)] hover:bg-orange-800/90 hover:border-orange-400 hover:shadow-[0_0_8px_rgba(249,115,22,0.5)]',
        inactive:
          'bg-gray-400/30 text-gray-400 border border-gray-500/30 cursor-not-allowed',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? SlotPrimitive.Root : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

