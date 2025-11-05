import { useState } from 'react'
import { useGetResearchDefinitionsQuery, useGetMyResearchQuery, useStartResearchMutation, useGetPlanetAvailableResearchQuery } from '@/api/endpoints/researchApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ResearchTree } from '@/components/research/ResearchTree'
import { Planet } from '@/types/api.types'
import { formatResource, formatNumber } from '@/lib/formatters'
import { toast } from 'sonner'
import { FlaskConical, CheckCircle, Lock, Loader2, AlertCircle, Building2, Zap } from 'lucide-react'
import { useCheckPrerequisitesMutation } from '@/api/endpoints/prerequisitesApi'
import { Skeleton } from '@/components/ui/skeleton'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { TechTreeEmbedded } from '@/components/tech-tree/TechTreeEmbedded'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ResearchTabProps {
  planet: Planet
}

export function ResearchTab({ planet }: ResearchTabProps) {
  const [startResearchDialogOpen, setStartResearchDialogOpen] = useState(false)
  const [selectedResearchSlug, setSelectedResearchSlug] = useState<string | null>(null)

  const { data: definitions, isLoading: isLoadingDefinitions } = useGetResearchDefinitionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: researchProgress, isLoading: isLoadingProgress } = useGetMyResearchQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: planetResearchData, isLoading: isLoadingPlanetResearch } = useGetPlanetAvailableResearchQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  const [startResearch, { isLoading: isStarting }] = useStartResearchMutation()
  const [checkPrerequisites, { isLoading: isCheckingPrerequisites }] = useCheckPrerequisitesMutation()

  const handleStartResearch = async (researchSlug: string) => {
    try {
      // Check prerequisites first
      const checkResult = await checkPrerequisites({
        type: 'research',
        slug: researchSlug,
      }).unwrap()

      if (!checkResult.data?.can_build) {
        toast.error('Cannot start research: Missing prerequisites', {
          description: checkResult.data?.errors?.join(', ') || 'Check requirements',
        })
        return
      }

      await startResearch({ 
        planet_id: Number(planet.id),
        research_slug: researchSlug 
      }).unwrap()
      toast.success('Research queued successfully!')
      setStartResearchDialogOpen(false)
      setSelectedResearchSlug(null)
    } catch (error: any) {
      if (error?.data?.errors) {
        toast.error('Cannot start research', {
          description: error.data.errors.join(', '),
        })
      } else {
        toast.error(error?.data?.message || 'Failed to start research')
      }
    }
  }

  const getResearchDefinition = (slug: string) => {
    return definitions?.research?.find(r => r.slug === slug)
  }

  const isResearchCompleted = (slug: string) => {
    return researchProgress?.completed_research?.includes(slug) || false
  }

  const formatFacilityName = (slug: string) => {
    return slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (isLoadingDefinitions || isLoadingProgress || isLoadingPlanetResearch) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  const completedResearch = researchProgress?.completed_research || []
  const availableResearch = planetResearchData?.research || []

  return (
    <Tabs defaultValue="list" className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="list">Research List</TabsTrigger>
        <TabsTrigger value="tree">Tech Tree</TabsTrigger>
      </TabsList>
      
      <TabsContent value="list" className="space-y-6 mt-6">
      <div className="space-y-6">
      {/* Planet Resources */}
      <Card className="panel-glass border-cyan/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={getTelleriumImage()}
                  alt="Tellerium"
                  className="w-5 h-5 object-contain"
                  style={{ imageRendering: 'auto' }}
                />
                <span className="font-semibold text-tellerium">Tellerium</span>
              </div>
              <span className="text-2xl font-mono text-tellerium glow-cyan">
                {formatResource(planet.tellerium_balance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={getKryptonImage()}
                  alt="Krypton"
                  className="w-5 h-5 object-contain"
                  style={{ imageRendering: 'auto' }}
                />
                <span className="font-semibold text-krypton">Krypton</span>
              </div>
              <span className="text-2xl font-mono text-krypton glow-blue">
                {formatResource(planet.krypton_balance)}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Research requires resources to purchase. Ensure you have enough tellerium and krypton before starting research.
          </p>
        </CardContent>
      </Card>

      {/* Completed Research */}
      {completedResearch.length > 0 && (
        <Card className="panel-glass border-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Completed Research ({completedResearch.length})
            </CardTitle>
            <CardDescription>
              Technologies you have already researched
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedResearch.map((slug) => {
                const research = getResearchDefinition(slug)
                if (!research) return null

                return (
                  <div key={slug} className="flex items-start gap-3 p-3 bg-green/10 rounded-lg border border-green/20">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium">{research.name}</h4>
                        {research.era && (
                          <Badge variant="outline" className="text-xs">
                            Era {research.era}
                          </Badge>
                        )}
                        {research.specialization && research.specialization !== 'general' && (
                          <Badge variant={research.specialization === 'military' ? 'destructive' : research.specialization === 'industrial' ? 'secondary' : 'outline'} className="text-xs">
                            {research.specialization.charAt(0).toUpperCase() + research.specialization.slice(1)}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          Completed
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {research.description}
                      </p>
                      {Object.keys(research.effects).length > 0 && (
                        <div className="text-xs text-green-400">
                          <strong>Effects:</strong>{' '}
                          {Object.entries(research.effects).map(([key, value]) => (
                            <span key={key}>
                              {key.replace(/_/g, ' ')}: {typeof value === 'number' && value < 1 ? `+${(value * 100).toFixed(0)}%` : `+${value}`}
                            </span>
                          )).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Research Tree */}
      {availableResearch.length > 0 && (
        <Card className="panel-glass border-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              Research Tree
            </CardTitle>
            <CardDescription>
              Technologies organized by prerequisites - click to research
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResearchTree
              researchItems={availableResearch.map(r => ({
                slug: r.slug,
                name: r.name,
                description: r.description,
                cost_tellerium: r.cost_tellerium,
                cost_krypton: r.cost_krypton,
                completed: r.completed,
                can_research: r.can_research,
                prerequisite_research: r.prerequisite_research,
                prerequisite_facilities: r.prerequisite_facilities,
              }))}
              completedResearch={completedResearch}
              planetTellerium={planet.tellerium_balance}
              planetKrypton={planet.krypton_balance}
              onResearchClick={(slug) => {
                const research = availableResearch.find(r => r.slug === slug)
                if (research) {
                  const canAffordTellerium = planet.tellerium_balance >= research.cost_tellerium
                  const canAffordKrypton = planet.krypton_balance >= research.cost_krypton
                  const canAfford = canAffordTellerium && canAffordKrypton
                  if (research.can_research && canAfford && !research.completed) {
                    handleStartResearch(slug)
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Detailed Research List (Optional - can be hidden with a toggle) */}
      {availableResearch.length > 0 && (
        <details className="panel-glass border-cyan/20 p-4 rounded-lg">
          <summary className="cursor-pointer font-semibold mb-4">View Detailed List</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {availableResearch.map((research) => {
                const canAffordTellerium = planet.tellerium_balance >= research.cost_tellerium
                const canAffordKrypton = planet.krypton_balance >= research.cost_krypton
                const canAfford = canAffordTellerium && canAffordKrypton

                return (
                  <Card
                    key={research.slug}
                    className={`panel-glass ${
                      research.can_research && canAfford && !research.completed
                        ? 'border-cyan/20'
                        : 'border-muted/20 opacity-60'
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FlaskConical className="w-5 h-5 text-cyan-400" />
                        {research.name}
                        <div className="flex gap-2 ml-auto">
                          {research.era && (
                            <Badge variant="outline">
                              Era {research.era}
                            </Badge>
                          )}
                          {research.specialization && research.specialization !== 'general' && (
                            <Badge variant={research.specialization === 'military' ? 'destructive' : research.specialization === 'industrial' ? 'secondary' : 'outline'}>
                              {research.specialization.charAt(0).toUpperCase() + research.specialization.slice(1)}
                            </Badge>
                          )}
                          {research.completed && (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                      <CardDescription>
                        {research.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Resource Costs */}
                      <div className="p-3 bg-muted/20 rounded-lg">
                        <p className="text-sm font-medium mb-2">Resource Cost:</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={getTelleriumImage()}
                                alt="T"
                                className="w-4 h-4 object-contain"
                                style={{ imageRendering: 'auto' }}
                              />
                              <span className="text-sm text-tellerium">Tellerium</span>
                            </div>
                            <Badge variant="outline" className={canAffordTellerium ? 'text-tellerium' : 'text-destructive'}>
                              {formatResource(research.cost_tellerium)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={getKryptonImage()}
                                alt="K"
                                className="w-4 h-4 object-contain"
                                style={{ imageRendering: 'auto' }}
                              />
                              <span className="text-sm text-krypton">Krypton</span>
                            </div>
                            <Badge variant="outline" className={canAffordKrypton ? 'text-krypton' : 'text-destructive'}>
                              {formatResource(research.cost_krypton)}
                            </Badge>
                          </div>
                          {research.build_time_ticks > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t border-muted/30">
                              <span className="text-sm text-muted-foreground">Research Time</span>
                              <span className="text-sm font-mono">
                                {research.build_time_ticks} ticks
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Facility Prerequisites */}
                      {research.prerequisite_facilities && research.prerequisite_facilities.length > 0 && (
                        <div className="p-3 bg-blue/10 rounded-lg border border-blue/20">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            Required Facilities (on this planet):
                          </p>
                          <div className="space-y-1">
                            {research.prerequisite_facilities.map((facilitySlug) => {
                              const hasFacility = planet.facilities && planet.facilities[facilitySlug] > 0
                              return (
                                <div key={facilitySlug} className="flex items-center gap-2 text-sm">
                                  {hasFacility ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <span className={hasFacility ? 'text-green-400' : 'text-muted-foreground'}>
                                    {formatFacilityName(facilitySlug)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Research Prerequisites */}
                      {research.prerequisite_research && research.prerequisite_research.length > 0 && (
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-purple-400" />
                            Required Research (empire-wide):
                          </p>
                          <div className="space-y-1">
                            {research.prerequisite_research.map((researchSlug) => {
                              const isCompleted = completedResearch.includes(researchSlug)
                              const prereqDef = getResearchDefinition(researchSlug)
                              return (
                                <div key={researchSlug} className="flex items-center gap-2 text-sm">
                                  {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <span className={isCompleted ? 'text-green-400' : 'text-muted-foreground'}>
                                    {prereqDef?.name || researchSlug}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Missing Prerequisites Summary */}
                      {research.missing_prerequisites && research.missing_prerequisites.length > 0 && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm font-medium text-destructive mb-2">Missing Prerequisites:</p>
                          <div className="space-y-1">
                            {research.missing_prerequisites.map((missing) => {
                              const isFacility = research.prerequisite_facilities?.includes(missing)
                              const isResearch = research.prerequisite_research?.includes(missing)
                              return (
                                <div key={missing} className="flex items-center gap-2 text-sm text-destructive">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>
                                    {isFacility ? formatFacilityName(missing) : getResearchDefinition(missing)?.name || missing}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Effects */}
                      {research.effects && Object.keys(research.effects).length > 0 && (
                        <div className="p-3 bg-cyan/10 rounded-lg border border-cyan/20">
                          <p className="text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Research Effects:
                          </p>
                          <div className="space-y-2 text-sm">
                            {Object.entries(research.effects).map(([key, value]) => {
                              const isMultiplier = key.includes('_mul') || key.includes('reduction')
                              const isBoolean = typeof value === 'boolean'
                              const displayValue = isBoolean
                                ? (value ? 'Enabled' : 'Disabled')
                                : isMultiplier
                                ? (value < 1 
                                    ? `${(value * 100).toFixed(1)}% reduction` 
                                    : `+${((value - 1) * 100).toFixed(1)}% increase`)
                                : `+${formatNumber(value as number)}`
                              
                              const effectName = key
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, l => l.toUpperCase())
                                .replace('Mul', 'Multiplier')
                                .replace('Per Tick', '/Tick')
                              
                              return (
                                <div key={key} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                                  <span className="text-muted-foreground">{effectName}:</span>
                                  <Badge variant="outline" className="text-green-400 border-green-500/30">
                                    {displayValue}
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {(!research.can_research || !canAfford || research.completed) && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-destructive">
                            {research.completed
                              ? 'Already completed'
                              : !canAffordTellerium
                              ? 'Insufficient tellerium'
                              : !canAffordKrypton
                              ? 'Insufficient krypton'
                              : 'Prerequisites not met'}
                          </span>
                        </div>
                      )}

                      {!research.completed && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="w-full"
                              disabled={!research.can_research || !canAfford}
                              onClick={() => setSelectedResearchSlug(research.slug)}
                            >
                              <FlaskConical className="w-4 h-4 mr-2" />
                              Start Research
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="panel-glass border-purple/20">
                            <DialogHeader>
                              <DialogTitle>Start Research</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to start researching {research.name}?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted/20 rounded-lg">
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getTelleriumImage()}
                                        alt="T"
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                      />
                                      <span className="text-tellerium">Tellerium Cost:</span>
                                    </div>
                                    <span className={`font-mono ${
                                      canAffordTellerium ? 'text-tellerium' : 'text-destructive'
                                    }`}>
                                      {formatResource(research.cost_tellerium)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getTelleriumImage()}
                                        alt="T"
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                      />
                                      <span className="text-tellerium">Available Tellerium:</span>
                                    </div>
                                    <span className={`font-mono ${
                                      canAffordTellerium ? 'text-tellerium' : 'text-destructive'
                                    }`}>
                                      {formatResource(planet.tellerium_balance)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getKryptonImage()}
                                        alt="K"
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                      />
                                      <span className="text-krypton">Krypton Cost:</span>
                                    </div>
                                    <span className={`font-mono ${
                                      canAffordKrypton ? 'text-krypton' : 'text-destructive'
                                    }`}>
                                      {formatResource(research.cost_krypton)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getKryptonImage()}
                                        alt="K"
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                      />
                                      <span className="text-krypton">Available Krypton:</span>
                                    </div>
                                    <span className={`font-mono ${
                                      canAffordKrypton ? 'text-krypton' : 'text-destructive'
                                    }`}>
                                      {formatResource(planet.krypton_balance)}
                                    </span>
                                  </div>
                                  {research.build_time_ticks > 0 && (
                                    <div className="flex justify-between pt-2 border-t border-muted/30">
                                      <span>Research Time:</span>
                                      <span className="font-mono">
                                        {research.build_time_ticks} ticks
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setStartResearchDialogOpen(false)
                                    setSelectedResearchSlug(null)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleStartResearch(research.slug)}
                                  disabled={isStarting || isCheckingPrerequisites || !canAfford}
                                >
                                  {isStarting || isCheckingPrerequisites ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Starting...
                                    </>
                                  ) : (
                                    <>
                                      <FlaskConical className="w-4 h-4 mr-2" />
                                      Start Research
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </details>
      )}

      {/* No Available Research */}
      {availableResearch.length === 0 && completedResearch.length === 0 && (
        <Card className="panel-glass border-muted/20">
          <CardContent className="pt-6 text-center">
            <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Research Available</h3>
            <p className="text-muted-foreground mb-4">
              Build research facilities to generate research points and unlock new technologies.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
      </TabsContent>
      
      <TabsContent value="tree" className="mt-6">
        <TechTreeEmbedded nodeType="research" planetId={Number(planet.id)} height="600px" />
      </TabsContent>
    </Tabs>
  )
}
