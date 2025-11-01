import { useState, useMemo } from 'react'
import { Search, Check, User, Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/common/Avatar'
import { getUserAvatarUrl } from '@/lib/avatar'

interface Empire {
  id: number
  name: string
  score?: number
  user?: {
    id?: number
    username?: string
    avatar_url?: string | null
  } | null
}

interface EmpireSelectorProps {
  empires: Empire[]
  value: number
  onChange: (empireId: number) => void
  disabled?: boolean
  placeholder?: string
}

export function EmpireSelector({
  empires,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an empire...',
}: EmpireSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedEmpire = useMemo(
    () => empires.find(emp => emp.id === value),
    [empires, value]
  )

  const filteredEmpires = useMemo(() => {
    if (!searchTerm.trim()) {
      return empires
    }
    const term = searchTerm.toLowerCase()
    return empires.filter(
      emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.user?.username?.toLowerCase().includes(term)
    )
  }, [empires, searchTerm])

  const handleSelect = (empireId: number) => {
    onChange(empireId)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full h-auto min-h-[60px] justify-between px-4 py-3',
          'panel-glass surface-gradient border-border/50',
          'hover:border-cyan-500/50 transition-all',
          isOpen && 'border-cyan-500/50 ring-2 ring-cyan-500/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedEmpire ? (
            <>
              <Avatar
                src={getUserAvatarUrl(selectedEmpire.user)}
                name={selectedEmpire.name}
                size="md"
                className="border-2 border-cyan-500/30 flex-shrink-0"
              />
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="font-semibold text-foreground truncate w-full">
                  {selectedEmpire.name}
                </span>
                {selectedEmpire.score !== undefined && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {selectedEmpire.score.toLocaleString()}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{placeholder}</span>
            </div>
          )}
        </div>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className={cn(
              'absolute top-full left-0 right-0 mt-2 z-[100]',
              'panel-glass surface-gradient card-glow vignette',
              'border border-border/50 rounded-lg shadow-2xl',
              'overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2'
            )}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search empires..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50 border-border/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Empire List */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredEmpires.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No empires found</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredEmpires.map((empire) => {
                    const isSelected = empire.id === value
                    return (
                      <button
                        key={empire.id}
                        type="button"
                        onClick={() => handleSelect(empire.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-3 rounded-lg',
                          'transition-all cursor-pointer group text-left',
                          'hover:bg-cyan-500/10 hover:border-cyan-500/20',
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-500/40'
                            : 'border border-transparent'
                        )}
                      >
                        <Avatar
                          src={getUserAvatarUrl(empire.user)}
                          name={empire.name}
                          size="md"
                          className={cn(
                            'border-2 transition-all flex-shrink-0',
                            isSelected
                              ? 'border-cyan-400'
                              : 'border-border/50 group-hover:border-cyan-500/50'
                          )}
                        />
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <div className="flex items-center gap-2 w-full">
                            <span className={cn(
                              'font-semibold truncate flex-1',
                              isSelected ? 'text-cyan-400' : 'text-foreground'
                            )}>
                              {empire.name}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            )}
                          </div>
                          {empire.score !== undefined && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Score: {empire.score.toLocaleString()}
                            </span>
                          )}
                          {empire.user?.username && (
                            <span className="text-xs text-muted-foreground">
                              @{empire.user.username}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

