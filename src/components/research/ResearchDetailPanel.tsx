import { useGetResearchDefinitionsQuery, useGetPlanetAvailableResearchQuery, useStartResearchMutation } from '@/api/endpoints/researchApi'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2, FlaskConical, Building2 } from 'lucide-react'
import { formatResource } from '@/lib/formatters'
import { toast } from 'sonner'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { Skeleton } from '@/components/ui/skeleton'

interface ResearchDetailPanelProps {
  slug: string
  planetId: number
}

export function ResearchDetailPanel({ slug, planetId }: ResearchDetailPanelProps) {
  const { data: researchDefs } = useGetResearchDefinitionsQuery()
  const { data: planetData } = useGetPlanetQuery(planetId)
  const { data: planetResearchData } = useGetPlanetAvailableResearchQuery(planetId)
  const [startResearch, { isLoading: isStarting }] = useStartResearchMutation()

  const researchDef = researchDefs?.research?.find((r) => r.slug === slug)
  const planetResearch = planetResearchData?.research?.find((r) => r.slug === slug)
  const planet = planetData?.planet

  if (!researchDef || !planet || !planetResearch) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const canAfford =
    planet.tellerium_balance >= planetResearch.cost_tellerium &&
    planet.krypton_balance >= planetResearch.cost_krypton

  const canResearch = planetResearch.can_research && canAfford

  const handleStartResearch = async () => {
    try {
      await startResearch({
        planet_id: planetId,
        research_slug: slug,
      }).unwrap()
      toast.success('Research queued successfully!')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to start research')
    }
  }

  return (
    <div className="space-y-6">
      {/* Research Info */}
      <Card className="panel-glass border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 flex items-center justify-center bg-primary/20 rounded-lg border-2 border-primary/50">
              <FlaskConical className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{researchDef.name}</CardTitle>
              <p className="mt-2 text-muted-foreground">{researchDef.description}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Effects */}
      {planetResearch?.effects && Object.keys(planetResearch.effects).length > 0 && (
        <Card className="panel-glass border-green/20">
          <CardHeader>
            <CardTitle className="text-lg">Effects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(planetResearch.effects).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400">
                    {typeof value === 'number' && value < 1
                      ? `+${(value * 100).toFixed(0)}%`
                      : `+${value}`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prerequisites */}
      {planetResearch?.prerequisite_facilities && planetResearch.prerequisite_facilities.length > 0 && (
        <Card className="panel-glass border-blue/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-blue-400" />
              Required Facilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planetResearch.prerequisite_facilities.map((facility: string) => {
                const hasFacility =
                  planet.facilities && planet.facilities[facility] > 0
                return (
                  <div
                    key={facility}
                    className="flex items-center gap-2 text-sm"
                  >
                    {hasFacility ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span
                      className={
                        hasFacility ? 'text-green-400' : 'text-destructive'
                      }
                    >
                      {facility.replace(/_/g, ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost */}
      <Card className="panel-glass border-green/20">
        <CardHeader>
          <CardTitle className="text-lg">Cost</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={getTelleriumImage()}
                alt="Tellerium"
                className="w-8 h-8"
              />
              <span className="font-semibold text-tellerium">Tellerium</span>
            </div>
            <span
              className={`text-xl font-mono ${
                canAfford ? 'text-tellerium' : 'text-destructive'
              }`}
            >
              {formatResource(planetResearch.cost_tellerium)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <img src={getKryptonImage()} alt="Krypton" className="w-8 h-8" />
              <span className="font-semibold text-krypton">Krypton</span>
            </div>
            <span
              className={`text-xl font-mono ${
                canAfford ? 'text-krypton' : 'text-destructive'
              }`}
            >
              {formatResource(planetResearch.cost_krypton)}
            </span>
          </div>
          {!canAfford && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-destructive">
                Insufficient resources
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Research Button */}
      <Button
        onClick={handleStartResearch}
        disabled={isStarting || !canResearch}
        className="w-full text-lg py-6"
        size="lg"
      >
        {isStarting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Starting Research...
          </>
        ) : (
          <>
            <FlaskConical className="w-5 h-5 mr-2" />
            Start Research
          </>
        )}
      </Button>
    </div>
  )
}

