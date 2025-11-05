import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setFilters } from '@/app/slices/techTreeSlice'
import { TechNodeType, SpecializationType } from '@/types/tech-tree.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X, Filter, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const NODE_TYPES: { value: TechNodeType; label: string }[] = [
  { value: 'facility', label: 'Facilities' },
  { value: 'research', label: 'Research' },
  { value: 'ship', label: 'Ships' },
  { value: 'defence', label: 'Defences' },
]

const ERAS = [1, 2, 3, 4, 5]

const SPECIALIZATIONS: { value: SpecializationType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'military', label: 'Military' },
  { value: 'relic', label: 'Relic' },
]

interface TechTreeFilterBarProps {
  className?: string
}

export function TechTreeFilterBar({ className }: TechTreeFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const dispatch = useAppDispatch()
  const { activeFilters } = useAppSelector((state) => state.techTree)

  const toggleNodeType = (type: TechNodeType) => {
    const currentTypes = activeFilters.nodeTypes
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type]
    dispatch(setFilters({ nodeTypes: newTypes }))
  }

  const toggleEra = (era: number) => {
    const currentEras = activeFilters.eras
    const newEras = currentEras.includes(era)
      ? currentEras.filter((e) => e !== era)
      : [...currentEras, era]
    dispatch(setFilters({ eras: newEras }))
  }

  const toggleSpecialization = (spec: SpecializationType) => {
    const currentSpecs = activeFilters.specializations
    const newSpecs = currentSpecs.includes(spec)
      ? currentSpecs.filter((s) => s !== spec)
      : [...currentSpecs, spec]
    dispatch(setFilters({ specializations: newSpecs }))
  }

  const handleSearchChange = (value: string) => {
    dispatch(setFilters({ searchQuery: value }))
  }

  const clearSearch = () => {
    dispatch(setFilters({ searchQuery: '' }))
  }

  const toggleShowLocked = () => {
    dispatch(setFilters({ showLocked: !activeFilters.showLocked }))
  }

  const toggleShowCompleted = () => {
    dispatch(setFilters({ showCompleted: !activeFilters.showCompleted }))
  }

  const clearAllFilters = () => {
    dispatch(setFilters({
      nodeTypes: [],
      eras: [],
      specializations: [],
      searchQuery: '',
      showLocked: true,
      showCompleted: true,
    }))
  }

  const hasActiveFilters = 
    activeFilters.nodeTypes.length > 0 ||
    activeFilters.eras.length > 0 ||
    activeFilters.specializations.length > 0 ||
    activeFilters.searchQuery !== '' ||
    !activeFilters.showLocked ||
    !activeFilters.showCompleted

  const activeFilterCount = 
    activeFilters.nodeTypes.length +
    activeFilters.eras.length +
    activeFilters.specializations.length +
    (activeFilters.searchQuery !== '' ? 1 : 0) +
    (!activeFilters.showLocked ? 1 : 0) +
    (!activeFilters.showCompleted ? 1 : 0)

  return (
    <TooltipProvider>
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-lg transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[300px]' : 'max-h-[60px]',
          className
        )}
      >
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          {/* Minimized Header - Always visible */}
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 h-9 px-3"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="top" className="mb-2">
                  <p className="text-sm">Click to open filter options</p>
                </TooltipContent>
              )}
            </Tooltip>
            
            {isExpanded && hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Expandable Filter Content */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              isExpanded ? 'max-h-[250px] opacity-100 mt-3' : 'max-h-0 opacity-0'
            )}
          >
            <div className="flex flex-col gap-3">
              {/* Main filter row */}
              <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tech tree..."
                value={activeFilters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-9"
              />
              {activeFilters.searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Node Types */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground mr-1">Type:</span>
              {NODE_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={activeFilters.nodeTypes.includes(type.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleNodeType(type.value)}
                  className="h-7 px-2 text-xs"
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {/* Eras */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground mr-1">Era:</span>
              {ERAS.map((era) => (
                <Button
                  key={era}
                  variant={activeFilters.eras.includes(era) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleEra(era)}
                  className="h-7 w-8 px-0 text-xs"
                >
                  {era}
                </Button>
              ))}
            </div>

            {/* Specializations */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground mr-1">Spec:</span>
              {SPECIALIZATIONS.map((spec) => (
                <Button
                  key={spec.value}
                  variant={activeFilters.specializations.includes(spec.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSpecialization(spec.value)}
                  className="h-7 px-2 text-xs"
                >
                  {spec.label}
                </Button>
              ))}
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-1">
              <Button
                variant={activeFilters.showLocked ? 'default' : 'outline'}
                size="sm"
                onClick={toggleShowLocked}
                className="h-7 px-2 text-xs"
              >
                Locked
              </Button>
              <Button
                variant={activeFilters.showCompleted ? 'default' : 'outline'}
                size="sm"
                onClick={toggleShowCompleted}
                className="h-7 px-2 text-xs"
              >
                Completed
              </Button>
            </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}


