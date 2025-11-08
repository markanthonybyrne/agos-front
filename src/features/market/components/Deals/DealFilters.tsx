import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'

export interface DealFiltersState {
  resource?: string
  minAmount?: number
  maxAmount?: number
  status?: 'open' | 'completed' | 'cancelled' | 'expired' | 'all'
}

interface DealFiltersProps {
  onChange: (filters: DealFiltersState) => void
  initialFilters?: DealFiltersState
}

export function DealFilters({ onChange, initialFilters }: DealFiltersProps) {
  const { allResources, getMetadata } = useResourcesCatalog()
  const [filters, setFilters] = useState<DealFiltersState>({
    resource: initialFilters?.resource,
    minAmount: initialFilters?.minAmount,
    maxAmount: initialFilters?.maxAmount,
    status: initialFilters?.status ?? 'open',
  })

  const handleChange = (partial: Partial<DealFiltersState>) => {
    const next = { ...filters, ...partial }
    setFilters(next)
    onChange(next)
  }

  const resourceOptions = useMemo(() => {
    return allResources.map((resource) => ({
      ...resource,
      label: resource.name,
    }))
  }, [allResources])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="space-y-2">
        <Label htmlFor="resource-filter">Resource</Label>
        <Select
          value={filters.resource || 'all'}
          onValueChange={(value) => handleChange({ resource: value === 'all' ? undefined : value })}
        >
          <SelectTrigger id="resource-filter">
            <SelectValue placeholder="All resources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resources</SelectItem>
            {resourceOptions.map((resource) => (
              <SelectItem key={resource.slug} value={resource.slug}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getMetadata(resource.slug).color }}
                  />
                  {resource.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="min-amount">Min Amount</Label>
        <Input
          id="min-amount"
          type="number"
          min={0}
          value={filters.minAmount ?? ''}
          onChange={(event) => {
            const value = event.target.value
            handleChange({ minAmount: value === '' ? undefined : Number(value) })
          }}
          placeholder="Any"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-amount">Max Amount</Label>
        <Input
          id="max-amount"
          type="number"
          min={0}
          value={filters.maxAmount ?? ''}
          onChange={(event) => {
            const value = event.target.value
            handleChange({ maxAmount: value === '' ? undefined : Number(value) })
          }}
          placeholder="Any"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select
          value={filters.status || 'open'}
          onValueChange={(value) =>
            handleChange({ status: value as DealFiltersState['status'] })
          }
        >
          <SelectTrigger id="status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}


