import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveCoordinate } from '@/lib/coordinateResolver'
import { formatCoordinate } from '@/lib/coordinates'
import { Planet } from '@/types/api.types'

interface CoordinateSearchBarProps {
  onSearch: (centerX: number, centerY: number, normalizedZoom: number) => void
  className?: string
  planets?: Planet[]
}

/**
 * CoordinateSearchBar - Floating search input for coordinate navigation
 * 
 * Features:
 * - Minimalist, futuristic styling
 * - Autocomplete suggestions (optional, for future enhancement)
 * - Smooth transitions on coordinate search
 */
export function CoordinateSearchBar({ onSearch, className, planets }: CoordinateSearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced autocomplete lookup (future enhancement)
  useEffect(() => {
    if (!planets || planets.length === 0 || query.trim().length < 2) {
      setSuggestions([])
      return
    }

    const normalizedQuery = query.trim().toLowerCase()
    const matches = Array.from(
      new Set(
        planets
          .map((planet) => formatCoordinate(planet.coordinate))
          .filter((coord) => coord && coord !== 'Invalid coordinate')
      )
    )
      .filter((coord) => coord.toLowerCase().includes(normalizedQuery))
      .slice(0, 10)

    setSuggestions(matches)
  }, [planets, query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    try {
      const resolution = resolveCoordinate(query.trim(), planets)
      onSearch(resolution.centerX, resolution.centerY, resolution.normalizedZoom)
      setQuery('')
      setSuggestions([])
      setIsFocused(false)
    } catch (err) {
      // Error handling - could show toast notification
      console.error('Coordinate search error:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    } else if (e.key === 'Escape') {
      setQuery('')
      setSuggestions([])
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Enter coordinate (e.g., 1:2:3:4)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay blur to allow clicking on suggestions
              setTimeout(() => setIsFocused(false), 200)
            }}
            className={cn(
              'pl-10 pr-10 w-full bg-black/80 backdrop-blur-sm border-gray-700 text-white',
              'font-mono text-sm',
              'focus:border-cyan-400 focus:ring-cyan-400/20',
              'transition-all duration-200'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSuggestions([])
                inputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown (future enhancement) */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-xl max-h-48 overflow-y-auto z-50">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
              onClick={() => {
                  setQuery(suggestion)
                  setSuggestions([])
                  setIsFocused(false)
                  try {
                    const resolution = resolveCoordinate(suggestion, planets)
                    onSearch(resolution.centerX, resolution.centerY, resolution.normalizedZoom)
                    setQuery('')
                  } catch (err) {
                    console.error('Coordinate suggestion error:', err)
                  } finally {
                    inputRef.current?.blur()
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-mono"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Help text */}
        {isFocused && query.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-md text-xs text-gray-400 font-mono">
            Format: Q, Q:S, Q:S:G, Q:S:G:SY, or Q:S:G:SY:P
          </div>
        )}
      </form>
    </div>
  )
}



