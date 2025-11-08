import { useMemo, useState } from 'react'
import { usePanel } from '@/components/common/PanelManager'
import { PanelSize, PanelType } from '@/app/slices/panelSlice'
import {
  useApplyPopulationEdictMutation,
  useGetPlanetPopulationQuery,
  useGetPopulationDraftMetricsQuery,
  useSelectPopulationSpecializationMutation,
} from '@/api/endpoints/planetsApi'
import {
  PopulationEdict,
  PopulationEdictRequirement,
  PopulationEvent,
  PopulationStage,
  PopulationStratum,
} from '@/types/api.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertTriangle,
  Check,
  Flame,
  Gauge,
  ShieldAlert,
  Sparkles,
  Target,
  Activity,
  Users,
  Hammer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface PlanetPopulationPanelProps {
  planetId: number
  isOpen: boolean
}

const UNREST_WARNING = 35
const UNREST_CRITICAL = 70

function resolveRequirementName(req: PopulationEdictRequirement | string) {
  if (typeof req === 'string') return req
  return req.name || req.slug
}

function resolveRequirementMet(req: PopulationEdictRequirement | string | undefined) {
  if (!req) return true
  if (typeof req === 'string') return true
  return req.met !== false
}

function PopulationStageCard({ stage }: { stage: PopulationStage }) {
  const progressPercent = stage.progress_cap
    ? Math.min(100, Math.round((stage.progress / stage.progress_cap) * 100))
    : 0

  return (
    <Card className="border border-cyan-500/20 bg-black/30 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-cyan-200">
          <Sparkles className="h-4 w-4" />
          {stage.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Stage progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-cyan-500/10" />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Requirements
          </p>
          <div className="space-y-1.5">
            {stage.requirements.map((req) => (
              <div
                key={req.slug}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2 py-1 text-xs',
                  req.met
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200',
                )}
              >
                {req.met ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                <span className="font-semibold">{req.name}</span>
                {req.description && (
                  <span className="text-muted-foreground/70">– {req.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StrataBar({ strata }: { strata: PopulationStratum[] }) {
  const total = strata.reduce((sum, s) => sum + (s.population || 0), 0)
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        <Users className="h-4 w-4 text-cyan-300" />
        Strata Composition
      </div>
      <div className="overflow-hidden rounded-full border border-cyan-500/30 bg-black/30">
        <div className="flex h-6 w-full">
          {strata.map((stratum) => (
            <TooltipProvider key={stratum.slug}>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'h-full transition-opacity hover:opacity-90',
                      stratum.slug === 'engineers' && 'bg-cyan-500/60',
                      stratum.slug === 'cultivators' && 'bg-emerald-500/60',
                      stratum.slug === 'pioneers' && 'bg-amber-500/60',
                      !['engineers', 'cultivators', 'pioneers'].includes(stratum.slug) &&
                        'bg-purple-500/60',
                    )}
                    style={{ width: `${Math.max(5, stratum.percentage || 0)}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent className="border border-cyan-500/30 bg-background text-xs shadow-lg">
                  <div className="font-semibold text-cyan-200">{stratum.name}</div>
                  <div className="text-muted-foreground">
                    {stratum.population.toLocaleString()} ({Math.round(stratum.percentage)}%)
                  </div>
                  {stratum.modifiers?.length ? (
                    <ul className="mt-1 space-y-1">
                      {stratum.modifiers.map((mod) => (
                        <li key={mod.slug} className="text-[11px] text-muted-foreground/80">
                          {mod.name}: {mod.value}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
      <div className="text-right text-[11px] text-muted-foreground">
        Total population tracked: {total.toLocaleString()}
      </div>
    </div>
  )
}

function DraftWidget({
  current,
  capacity,
  ratio,
  overdraft,
  onOpenBarracks,
}: {
  current: number
  capacity: number
  ratio: number
  overdraft: number
  onOpenBarracks: () => void
}) {
  const progressPercent = capacity ? Math.min(150, Math.round((current / capacity) * 100)) : 0
  const state =
    ratio >= 1 ? (ratio >= 1.1 || overdraft > 0 ? 'critical' : 'warning') : 'normal'

  return (
    <Card
      className={cn(
        'border bg-black/30',
        state === 'critical' ? 'border-red-500/40' : state === 'warning' ? 'border-amber-500/40' : 'border-cyan-500/20',
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-cyan-200">
          <Target className="h-4 w-4" />
          Draft Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {current.toLocaleString()} / {capacity.toLocaleString()} troopers
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress
            value={progressPercent}
            className={cn(
              'h-2',
              state === 'critical'
                ? 'bg-red-500/20'
                : state === 'warning'
                ? 'bg-amber-500/20'
                : 'bg-cyan-500/10',
            )}
          />
        </div>
        {state !== 'normal' && (
          <div
            className={cn(
              'flex items-start gap-2 rounded-md border px-3 py-2 text-xs',
              state === 'critical'
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-200',
            )}
          >
            {state === 'critical' ? (
              <ShieldAlert className="mt-0.5 h-4 w-4" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4" />
            )}
            <div className="space-y-1">
              <div className="font-semibold uppercase tracking-[0.22em]">
                {state === 'critical' ? 'Critical Overdraft' : 'Draft Warning'}
              </div>
              <p className="text-[11px]">
                {state === 'critical'
                  ? 'Draft ratio exceeds safe limits. Build more barracks or lower draft intensity.'
                  : 'Approaching draft capacity. Consider building barracks or pausing drafts.'}
              </p>
              <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-200" onClick={onOpenBarracks}>
                Open Barracks Options
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EdictCard({
  edict,
  onApply,
  disabled,
  isActive,
  onCancel,
}: {
  edict: PopulationEdict
  onApply?: () => void
  onCancel?: () => void
  disabled?: boolean
  isActive?: boolean
}) {
  const requirementBadges = edict.requirements || []

  return (
    <div className="rounded-lg border border-cyan-500/20 bg-black/30 p-3 text-xs shadow-inner">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-cyan-200">{edict.name}</div>
          <div className="text-muted-foreground">{edict.description}</div>
        </div>
        <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
          {edict.duration_ticks} ticks
        </Badge>
      </div>

      {edict.effects?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {edict.effects.map((effect) => (
            <Badge key={effect.slug} variant="secondary" className="bg-cyan-500/10 text-cyan-200">
              {effect.name}: {effect.value}
            </Badge>
          ))}
        </div>
      ) : null}

      {requirementBadges.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {requirementBadges.map((req, index) => {
            const met = resolveRequirementMet(req)
            return (
              <Badge
                key={typeof req === 'string' ? `${req}-${index}` : req.slug}
                variant="outline"
                className={cn(
                  'border px-2 py-0.5',
                  met ? 'border-emerald-500/30 text-emerald-200' : 'border-amber-500/40 text-amber-200',
                )}
              >
                {resolveRequirementName(req)}
              </Badge>
            )
          })}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        {edict.remaining_ticks !== undefined && (
          <span>Remaining: {edict.remaining_ticks} ticks</span>
        )}
        {edict.cooldown_ticks !== undefined && !isActive && (
          <span>Cooldown: {edict.cooldown_ticks} ticks</span>
        )}
        <div className="flex-1" />
        {isActive ? (
          onCancel && (
            <Button size="sm" variant="ghost" className="text-amber-200 hover:text-amber-100" onClick={onCancel}>
              Cancel
            </Button>
          )
        ) : (
          onApply && (
            <Button size="sm" className="bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30" disabled={disabled} onClick={onApply}>
              Activate
            </Button>
          )
        )}
      </div>
    </div>
  )
}

function EventsFeed({ events }: { events: PopulationEvent[] | undefined }) {
  if (!events?.length) {
    return null
  }

  return (
    <Card className="border border-cyan-500/20 bg-black/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-cyan-200">
          <Activity className="h-4 w-4" />
          Recent Population Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ScrollArea className="max-h-40">
          <div className="space-y-1.5 pr-2">
            {events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  'rounded-md border px-3 py-2 text-xs',
                  event.severity === 'critical'
                    ? 'border-red-500/40 bg-red-500/10 text-red-200'
                    : event.severity === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold uppercase tracking-[0.18em]">{event.type}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{event.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function PlanetPopulationPanel({ planetId, isOpen }: PlanetPopulationPanelProps) {
  const { openPanel } = usePanel()
  const [specializationModalOpen, setSpecializationModalOpen] = useState(false)
  const [selectedEdict, setSelectedEdict] = useState<string | null>(null)

  const {
    data: populationData,
    isFetching: isFetchingPopulation,
    refetch: refetchPopulation,
  } = useGetPlanetPopulationQuery(planetId, {
    skip: !planetId || !isOpen,
  })

  const {
    data: draftData,
    isFetching: isFetchingDraft,
    refetch: refetchDraft,
  } = useGetPopulationDraftMetricsQuery(planetId, {
    skip: !planetId || !isOpen,
  })

  const [applyEdict, { isLoading: isApplyingEdict }] = useApplyPopulationEdictMutation()
  const [selectSpecialization, { isLoading: isSelectingSpecialization }] =
    useSelectPopulationSpecializationMutation()

  const profile = populationData?.population
  const draft = draftData?.draft || populationData?.draft
  const edicts = populationData?.edicts
  const events = populationData?.events

  const unrestState =
    profile && profile.unrest >= UNREST_CRITICAL
      ? 'critical'
      : profile && profile.unrest >= UNREST_WARNING
      ? 'warning'
      : 'normal'

  const strata = useMemo<PopulationStratum[]>(() => profile?.strata || [], [profile?.strata])

  const handleApplyEdict = async (edict: PopulationEdict) => {
    try {
      setSelectedEdict(edict.slug)
      await applyEdict({ planetId, edict_slug: edict.slug }).unwrap()
      toast.success('Edict activated', {
        description: `${edict.name} is now affecting your colony.`,
      })
      await Promise.all([refetchPopulation(), refetchDraft()])
    } catch (error: any) {
      toast.error('Unable to activate edict', {
        description: error?.data?.message || error?.message || 'Unknown error',
      })
    } finally {
      setSelectedEdict(null)
    }
  }

  const handleOpenBarracks = () => {
    openPanel(PanelType.BUILD_DETAIL, PanelSize.MEDIUM, {
      type: 'facility',
      slug: 'barracks',
      planetId,
    })
  }

  const handleSelectSpecialization = async (specialization: string) => {
    try {
      await selectSpecialization({ planetId, specialization }).unwrap()
      toast.success('Colony specialization updated', {
        description: specialization,
      })
      setSpecializationModalOpen(false)
      await refetchPopulation()
    } catch (error: any) {
      toast.error('Unable to set specialization', {
        description: error?.data?.message || error?.message || 'Unknown error',
      })
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card className="border border-cyan-500/30 bg-black/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm text-cyan-100">
            <span>
              {profile?.specialization ? `${profile.specialization} Colony` : 'Colony Population'}
            </span>
            <Dialog open={specializationModalOpen} onOpenChange={setSpecializationModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-200">
                  Manage Specialisation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl border border-cyan-500/30 bg-background">
                <DialogHeader>
                  <DialogTitle>Choose Colony Specialisation</DialogTitle>
                  <DialogDescription>
                    Specialisations unlock unique bonuses and edicts. Choose wisely.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 md:grid-cols-2">
                  {profile?.specialization_options?.map((option) => (
                    <Card
                      key={option.slug}
                      className={cn(
                        'border border-cyan-500/20 bg-black/20',
                        option.slug === profile.specialization && 'border-cyan-400/40 bg-cyan-500/10',
                      )}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-cyan-200">{option.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs text-muted-foreground">
                        <p>{option.description}</p>
                        {option.effects?.length ? (
                          <ul className="space-y-1">
                            {option.effects.map((effect) => (
                              <li key={effect.slug} className="flex items-start gap-2 text-cyan-200">
                                <Sparkles className="mt-0.5 h-3 w-3" />
                                <span>{effect.value}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <Button
                          size="sm"
                          className="w-full bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
                          disabled={isSelectingSpecialization}
                          onClick={() => handleSelectSpecialization(option.slug)}
                        >
                          {option.slug === profile?.specialization ? 'Active Specialisation' : 'Set Specialisation'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <DialogFooter className="pt-2">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setSpecializationModalOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="uppercase tracking-[0.24em] text-muted-foreground/80">Population</span>
              <div className="mt-1 text-lg font-semibold text-cyan-100">
                {profile?.total.toLocaleString() ?? '—'}
              </div>
            </div>
            <div>
              <span className="uppercase tracking-[0.24em] text-muted-foreground/80">Growth</span>
              <div className="mt-1 text-lg font-semibold text-emerald-200">
                {profile ? `${(profile.growth_rate * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
            <div>
              <span className="uppercase tracking-[0.24em] text-muted-foreground/80">Unrest</span>
              <div
                className={cn(
                  'mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm',
                  unrestState === 'critical'
                    ? 'border-red-500/40 bg-red-500/10 text-red-200'
                    : unrestState === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100',
                )}
              >
                <Flame className="h-3.5 w-3.5" />
                {profile?.unrest ?? '—'}%
              </div>
            </div>
            <div>
              <span className="uppercase tracking-[0.24em] text-muted-foreground/80">Status</span>
              <div className="mt-1 flex items-center gap-2 text-sm text-cyan-100">
                <Gauge className="h-4 w-4" />
                {isFetchingPopulation || isFetchingDraft ? 'Refreshing…' : 'Stable'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile?.stage && <PopulationStageCard stage={profile.stage} />}

      {strata.length > 0 && <StrataBar strata={strata} />}

      {draft && (
        <DraftWidget
          current={draft.current}
          capacity={draft.capacity}
          ratio={draft.ratio}
          overdraft={draft.overdraft}
          onOpenBarracks={handleOpenBarracks}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Edicts
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-cyan-200"
            onClick={() => {
              refetchPopulation()
              refetchDraft()
            }}
          >
            Refresh
          </Button>
        </div>

        <div className="space-y-2">
          {edicts?.active?.length ? (
            <>
              <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200">Active</div>
              <div className="space-y-2">
                {edicts.active.map((edict) => (
                  <EdictCard key={edict.slug} edict={edict} isActive />
                ))}
              </div>
            </>
          ) : null}
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Available</div>
          <div className="space-y-2">
            {edicts?.available?.length ? (
              edicts.available.map((edict) => (
                <EdictCard
                  key={edict.slug}
                  edict={edict}
                  disabled={isApplyingEdict && selectedEdict === edict.slug}
                  onApply={() => handleApplyEdict(edict)}
                />
              ))
            ) : (
              <div className="rounded-md border border-border/30 bg-black/30 px-3 py-4 text-xs text-muted-foreground">
                No edicts available. Advance your colony stage or adjust specialisation for new options.
              </div>
            )}
          </div>
        </div>
      </div>

      <EventsFeed events={events} />
    </div>
  )
}

