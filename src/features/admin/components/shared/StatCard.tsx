import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
}

export function StatCard({ icon: Icon, label, value, variant = 'default', className }: StatCardProps) {
  const variantClasses = {
    default: 'bg-card text-card-foreground',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    destructive: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  
  return (
    <Card className={cn(variantClasses[variant], className)}>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

