import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T extends { id?: number | string }> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  meta?: {
    page: number
    per_page: number
    total: number
    pages: number
  }
  onPageChange?: (page: number) => void
  onSearch?: (search: string) => void
  searchPlaceholder?: string
  emptyMessage?: string
  rowActions?: (row: T) => React.ReactNode
}

export function DataTable<T extends { id?: number | string }>({
  data,
  columns,
  loading = false,
  meta,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  rowActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')

  const handleSearch = (value: string) => {
    setSearch(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {onSearch && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="panel-glass border-border/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/5 border-b border-border/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-sm font-semibold text-foreground glow-cyan"
                  >
                    {column.header}
                  </th>
                ))}
                {rowActions && <th className="px-4 py-3 text-right text-sm font-semibold text-foreground glow-cyan">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (rowActions ? 1 : 0)}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr 
                    key={row.id ?? `row-${index}`} 
                    className="border-b border-border/30 hover:bg-primary/10 hover:border-cyan-400/20 transition-all group"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm text-foreground">
                        {column.accessor(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {rowActions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && onPageChange && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {meta.page === 1 ? 1 : (meta.page - 1) * meta.per_page + 1} to{' '}
            {Math.min(meta.page * meta.per_page, meta.total)} of {meta.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={meta.page === 1}
              className="hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-400"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page === 1}
              className="hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-4 text-foreground">
              Page {meta.page} of {meta.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.pages}
              className="hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-400"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(meta.pages)}
              disabled={meta.page >= meta.pages}
              className="hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-400"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

