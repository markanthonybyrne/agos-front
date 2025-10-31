import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Lock, FlaskConical } from 'lucide-react'
import { formatResource } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'

interface ResearchItem {
  slug: string
  name: string
  description?: string
  cost_tellerium?: number
  cost_krypton?: number
  completed?: boolean
  can_research?: boolean
  prerequisite_research?: string[]
  prerequisite_facilities?: string[]
}

interface ResearchTreeProps {
  researchItems: ResearchItem[]
  completedResearch: string[]
  planetTellerium: number
  planetKrypton: number
  onResearchClick?: (slug: string) => void
}

export function ResearchTree({
  researchItems,
  completedResearch,
  planetTellerium,
  planetKrypton,
  onResearchClick,
}: ResearchTreeProps) {
  // Organize research into rows/tiers based on prerequisites
  const organizedResearch = useMemo(() => {
    const itemsByTier: Record<number, ResearchItem[]> = {}
    const processedSlugs = new Set<string>()

    // Helper to determine tier based on prerequisites
    const getTier = (item: ResearchItem): number => {
      if (!item.prerequisite_research || item.prerequisite_research.length === 0) {
        return 0
      }
      
      const maxPrereqTier = item.prerequisite_research.reduce((maxTier, prereqSlug) => {
        const prereqItem = researchItems.find(r => r.slug === prereqSlug)
        if (!prereqItem || processedSlugs.has(prereqSlug)) {
          return maxTier
        }
        processedSlugs.add(prereqSlug)
        return Math.max(maxTier, getTier(prereqItem) + 1)
      }, -1)
      
      return maxPrereqTier
    }

    researchItems.forEach((item) => {
      const tier = getTier(item)
      if (!itemsByTier[tier]) {
        itemsByTier[tier] = []
      }
      itemsByTier[tier].push(item)
    })

    return itemsByTier
  }, [researchItems])

  const canAfford = (item: ResearchItem) => {
    return (
      planetTellerium >= (item.cost_tellerium || 0) &&
      planetKrypton >= (item.cost_krypton || 0)
    )
  }

  const isAvailable = (item: ResearchItem) => {
    if (item.completed) return false
    if (!item.can_research) return false
    
    // Check prerequisites
    if (item.prerequisite_research) {
      const allPrereqsMet = item.prerequisite_research.every(slug => 
        completedResearch.includes(slug)
      )
      if (!allPrereqsMet) return false
    }

    return canAfford(item)
  }

  const getStatusIcon = (item: ResearchItem) => {
    if (item.completed || completedResearch.includes(item.slug)) {
      return <CheckCircle className="w-6 h-6 text-green-400" />
    }
    if (isAvailable(item)) {
      return <FlaskConical className="w-6 h-6 text-cyan-400" />
    }
    return <Lock className="w-6 h-6 text-muted-foreground opacity-50" />
  }

  return (
    <div className="relative w-full min-h-[600px] p-8">
      {/* Research tree visualization */}
      <div className="space-y-12">
        {Object.keys(organizedResearch)
          .sort((a, b) => Number(a) - Number(b))
          .map((tier) => {
            const items = organizedResearch[Number(tier)]
            return (
              <div key={tier} className="relative">
                {/* Tier label */}
                <div className="text-sm text-muted-foreground mb-4 font-semibold">
                  Tier {Number(tier) + 1}
                </div>
                
                {/* Research items in this tier */}
                <div className="flex flex-wrap gap-6 justify-center">
                  {items.map((item) => {
                    const available = isAvailable(item)
                    const completed = item.completed || completedResearch.includes(item.slug)
                    
                    return (
                      <Card
                        key={item.slug}
                        className={`
                          panel-glass border-border/50 cursor-pointer transition-all duration-200
                          hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10
                          hover:scale-105 hover:-translate-y-1
                          ${completed ? 'border-green-500/30 bg-green-500/5' : ''}
                          ${available ? 'border-cyan-500/30' : 'opacity-60'}
                        `}
                        onClick={() => available && onResearchClick?.(item.slug)}
                      >
                        <CardContent className="p-4 flex flex-col items-center gap-3 min-w-[180px]">
                          {/* Diamond icon container */}
                          <div className="relative w-20 h-20 flex items-center justify-center transform rotate-45 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg border-2 border-current/20">
                            <div className="transform -rotate-45">
                              {getStatusIcon(item)}
                            </div>
                          </div>
                          
                          {/* Research name */}
                          <div className="text-center">
                            <h4 className="text-sm font-semibold line-clamp-2">{item.name}</h4>
                          </div>

                          {/* Cost badges */}
                          <div className="flex gap-2 flex-wrap justify-center text-xs">
                            {(item.cost_tellerium || 0) > 0 && (
                              <Badge 
                                variant="outline" 
                                className={canAfford(item) ? 'text-tellerium' : 'text-destructive'}
                              >
                                {formatResource(item.cost_tellerium || 0)} T
                              </Badge>
                            )}
                            {(item.cost_krypton || 0) > 0 && (
                              <Badge 
                                variant="outline"
                                className={canAfford(item) ? 'text-krypton' : 'text-destructive'}
                              >
                                {formatResource(item.cost_krypton || 0)} K
                              </Badge>
                            )}
                          </div>

                          {/* Status badge */}
                          <Badge 
                            variant="outline"
                            className={
                              completed
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : available
                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                : 'bg-muted/20 text-muted-foreground'
                            }
                          >
                            {completed ? 'Completed' : available ? 'Available' : 'Locked'}
                          </Badge>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

