import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/formatters'
import { DealResourceAmount } from '@/api/endpoints/dealsApi'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'

interface DealResourceListProps {
  resources: DealResourceAmount[]
  title: string
}

export function DealResourceList({ resources, title }: DealResourceListProps) {
  const { getMetadata } = useResourcesCatalog()

  if (!resources || resources.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/80">None</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {resources.map((resource, index) => {
          const metadata = getMetadata(resource.resource_type)
          return (
            <Badge
              key={`${resource.resource_type}-${index}`}
              variant="outline"
              className="flex items-center gap-2 capitalize border-border/40"
              style={{ borderColor: `${metadata.color}60`, color: metadata.color }}
            >
              <span>{formatNumber(resource.quantity)}</span>
              <span>{metadata.name}</span>
            </Badge>
          )
        })}
      </div>
    </div>
  )
}


