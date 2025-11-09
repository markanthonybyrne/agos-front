import { useMemo, useCallback } from 'react'
import { Planet } from '@/types/api.types'
import { getPlanetImage, getRandomAsteroidImageForPlanet } from '@/lib/planetImages'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { X, Eye, Rocket, Home, Send, ExternalLink, User, Scan, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface PlanetZoomViewProps {
  planet: Planet
  onClose: () => void
}

/**
 * PlanetZoomView - Shows a zoomed-in view of a planet with circular action buttons and glass tooltip
 * 
 * Features:
 * - Glass blur overlay on background (system visible behind)
 * - Planet zooms in to center of viewport
 * - Action buttons arranged in a circle around the planet
 * - Glass tooltip panel below planet with details
 */
export function PlanetZoomView({ planet, onClose }: PlanetZoomViewProps) {
  const { openPanel } = usePanel()
  const { empire } = useAuth()
  const navigate = useNavigate()

  let planetSlug = planet.type?.slug
  if (planetSlug === 'sol' || planetSlug === 'sol_angry' || planetSlug === 'sol-angry' || 
      planetSlug === 'sol_massive' || planetSlug === 'sol-massive') {
    planetSlug = undefined
  }

  const planetImage =
    planetSlug === 'asteroid' || planetSlug === 'asteroid_belt' || planetSlug === 'asteroid-belt'
      ? getRandomAsteroidImageForPlanet(planet.coordinate)
      : getPlanetImage(planetSlug)

  const isOwned = planet.owner_empire_id === empire?.id
  const isUnsettled = planet.state === 'unsettled'
  const formattedCoordinate = formatCoordinate(planet.coordinate)
  const parsedCoordinate = parseCoordinate(planet.coordinate)

  const handleViewDetails = useCallback(() => {
    if (planet.id) {
      navigate(`/planets/${planet.id}`)
      onClose()
    }
  }, [navigate, onClose, planet.id])

  const handleColonize = useCallback(() => {
    openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
      destinationPlanet: planet,
      orderType: 'colonize',
    })
    onClose()
  }, [openPanel, planet, onClose])

  const handleSendFleet = useCallback(() => {
    openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
      destinationPlanet: planet,
    })
    onClose()
  }, [openPanel, planet, onClose])

  const handleOpenIntelPanel = useCallback(() => {
    openPanel(PanelType.PLANET_INTERACTION, PanelSize.LARGE, { planet })
    onClose()
  }, [openPanel, planet, onClose])

  const handleLaunchSignal = useCallback(() => {
    const initialTarget: Record<string, any> = {
      coordinate: formattedCoordinate,
      type: 'planetary',
      planet: parsedCoordinate?.planet,
    }
    if (parsedCoordinate) {
      if ('quadrant' in parsedCoordinate) initialTarget.quadrant = parsedCoordinate.quadrant
      if ('sector' in parsedCoordinate) initialTarget.sector = parsedCoordinate.sector
      if ('galaxy' in parsedCoordinate) initialTarget.galaxy = parsedCoordinate.galaxy
      if ('system' in parsedCoordinate) initialTarget.system = parsedCoordinate.system
      if ('region' in parsedCoordinate) initialTarget.region = parsedCoordinate.region
    }
    openPanel(PanelType.SIGNALS, PanelSize.LARGE, {
      initialTarget,
    })
    onClose()
  }, [formattedCoordinate, onClose, openPanel, parsedCoordinate])

  const actionButtons = useMemo(() => {
    const actions = [
      {
        id: 'signals',
        icon: Scan,
        label: 'Launch Tachyon Signal',
        description: 'Open the Signals console with this coordinate preloaded for recon.',
        onClick: handleLaunchSignal,
      },
      {
        id: 'sendFleet',
        icon: Send,
        label: 'Send Fleet',
        description: 'Jump straight to Fleet Command with this world targeted.',
        onClick: handleSendFleet,
      },
      {
        id: 'intelPanel',
        icon: ExternalLink,
        label: 'Open Planet Intel Panel',
        description: 'Review incidents and lore using the desktop-style intel console.',
        onClick: handleOpenIntelPanel,
      },
    ]

    if (planet.id) {
      actions.push({
        id: 'viewDetails',
        icon: Eye,
        label: 'Open Planet Sheet',
        description: 'Switch to the detailed planet record for deeper intel.',
        onClick: handleViewDetails,
      })
    }

    if (isUnsettled) {
      actions.unshift({
        id: 'colonize',
        icon: Rocket,
        label: 'Launch Colonization Mission',
        description: 'Queue a colonization fleet targeting this unsettled world.',
        onClick: handleColonize,
      })
    }

    return actions
  }, [handleColonize, handleLaunchSignal, handleOpenIntelPanel, handleSendFleet, handleViewDetails, isUnsettled, planet.id])

  const intelSnapshot = useMemo(() => {
    return [
      {
        label: 'Status',
        content: (
          <>
            {planet.state === 'homeworld' && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <Home className="w-3 h-3 mr-1" />
                Homeworld
              </Badge>
            )}
            {planet.state === 'colony' && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                Colony
              </Badge>
            )}
            {planet.state === 'unsettled' && (
              <Badge variant="outline" className="text-white/70 border-white/30">
                Unsettled
              </Badge>
            )}
          </>
        ),
      },
      planet.type?.name
        ? {
            label: 'Planet Type',
            content: <span className="text-sm text-white/80 font-semibold uppercase">{planet.type.name}</span>,
          }
        : null,
      planet.owner_empire_id
        ? {
            label: 'Current Owner',
            content: (
              <span className="flex items-center gap-2 text-sm text-white/80">
                <User className="w-3 h-3" />
                {isOwned ? 'You' : `Empire #${planet.owner_empire_id}`}
              </span>
            ),
          }
        : null,
      planet.visibility?.discovery_method
        ? {
            label: 'Discovery Method',
            content: (
              <span className="text-sm text-white/70 capitalize">
                {planet.visibility.discovery_method.replace(/_/g, ' ')}
              </span>
            ),
          }
        : null,
    ].filter(Boolean) as { label: string; content: React.ReactNode }[]
  }, [isOwned, planet.owner_empire_id, planet.state, planet.type?.name, planet.visibility?.discovery_method])

  const resourceLines = useMemo(() => {
    const lines: { label: string; value: string; accentClass: string }[] = []
    if (typeof planet.tellerium_balance === 'number') {
      lines.push({
        label: 'Tellerium Stores',
        value: planet.tellerium_balance.toLocaleString(),
        accentClass: 'text-cyan-400',
      })
    }
    if (typeof planet.krypton_balance === 'number') {
      lines.push({
        label: 'Krypton Stores',
        value: planet.krypton_balance.toLocaleString(),
        accentClass: 'text-purple-400',
      })
    }
    return lines
  }, [planet.krypton_balance, planet.tellerium_balance])

  const productionLines = useMemo(() => {
    const lines: { label: string; value: string; accentClass: string }[] = []
    if (planet.production?.tellerium_per_tick) {
      lines.push({
        label: 'Tellerium / Tick',
        value: `+${planet.production.tellerium_per_tick.toLocaleString()}`,
        accentClass: 'text-cyan-300',
      })
    }
    if (planet.production?.krypton_per_tick) {
      lines.push({
        label: 'Krypton / Tick',
        value: `+${planet.production.krypton_per_tick.toLocaleString()}`,
        accentClass: 'text-purple-300',
      })
    }
    return lines
  }, [planet.production?.krypton_per_tick, planet.production?.tellerium_per_tick])

  const secondaryReserves = useMemo(() => {
    return (planet.secondary_reserves ?? []).map((reserve) => ({
      label: reserve.name ?? reserve.slug,
      amount: reserve.remaining.toLocaleString(),
      rarity: reserve.rarity ?? 'common',
    }))
  }, [planet.secondary_reserves])

  return (
    <>
      <div
        className="fixed inset-0 z-[10001] bg-black/50 backdrop-blur-md pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
        <div
          className="relative flex w-full max-w-6xl flex-col gap-6 lg:flex-row xl:gap-10 pointer-events-auto"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="absolute right-0 top-0 z-10 translate-y-[-160%] translate-x-[20%] bg-black/70 text-white hover:bg-black/90"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 min-w-0 items-center justify-center">
            <div className="relative w-[min(320px,75vw)] sm:w-[360px] md:w-[420px] aspect-square">
              <div className="absolute inset-0 rounded-full bg-cyan-500/5 shadow-[0_0_70px_rgba(56,189,248,0.35)]" />
              {planetImage ? (
                <img
                  src={planetImage}
                  alt={planet.type?.name || 'Planet'}
                  className="h-full w-full rounded-full object-contain drop-shadow-[0_0_40px_rgba(148,233,255,0.35)]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-black/50 text-white/60">
                  Unknown Planet
                </div>
              )}
              <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2">
                <Badge className="bg-black/60 border-white/20 text-xs font-semibold tracking-[0.3em] uppercase text-white/70">
                  {formattedCoordinate}
                </Badge>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[400px] xl:w-[420px]">
            <div className="panel-glass surface-gradient border border-cyan-500/35 card-glow h-full max-h-[80vh] overflow-hidden backdrop-blur-xl">
              <div className="border-b border-cyan-500/20 px-6 py-5">
                <h3 className="text-xl font-semibold text-cyan-100">
                  {planet.name || `Planet ${formattedCoordinate}`}
                </h3>
                <p className="text-xs text-cyan-200/70 uppercase tracking-[0.35em]">
                  Deep Space Recon
                </p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 pr-4">
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50 mb-3">
                    Intel Snapshot
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {intelSnapshot.map((item) => (
                      <div key={item.label}>
                        <div className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-1">{item.label}</div>
                        <div>{item.content}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {(resourceLines.length > 0 || productionLines.length > 0) && (
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50 mb-3">
                      Resource Outlook
                    </h4>
                    <div className="space-y-2">
                      {resourceLines.map((line) => (
                        <div key={line.label} className="flex items-center justify-between text-sm text-white/80">
                          <span>{line.label}</span>
                          <span className={cn('font-mono', line.accentClass)}>{line.value}</span>
                        </div>
                      ))}
                      {productionLines.length > 0 && (
                        <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                          {productionLines.map((line) => (
                            <div key={line.label} className="flex items-center justify-between text-xs text-white/75">
                              <span>{line.label}</span>
                              <span className={cn('font-mono', line.accentClass)}>{line.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {secondaryReserves.length > 0 && (
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50 mb-3">
                      Secondary Reserves
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {secondaryReserves.map((reserve) => (
                        <Badge
                          key={reserve.label}
                          className="border-cyan-500/25 bg-cyan-500/10 text-xs text-cyan-100"
                        >
                          {reserve.label} · {reserve.amount}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {(planet.mines > 0 ||
                  planet.probes > 0 ||
                  (planet.facilities && Object.keys(planet.facilities).length > 0) ||
                  (planet.defence_grid && Object.keys(planet.defence_grid).length > 0)) && (
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50 mb-3">
                      Known Infrastructure
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white/75">
                      {planet.mines > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Mines</span>
                          <span className="font-mono text-cyan-300">{planet.mines}</span>
                        </div>
                      )}
                      {planet.probes > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Probes</span>
                          <span className="font-mono text-cyan-300">{planet.probes}</span>
                        </div>
                      )}
                      {planet.facilities && Object.keys(planet.facilities).length > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Facilities</span>
                          <span className="font-mono text-cyan-300">
                            {Object.values(planet.facilities).reduce((a, b) => a + b, 0)}
                          </span>
                        </div>
                      )}
                      {planet.defence_grid && Object.keys(planet.defence_grid).length > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Defence Grid</span>
                          <span className="font-mono text-cyan-300">
                            {Object.values(planet.defence_grid).reduce((a, b) => a + b, 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {planet.type?.description && (
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50 mb-3">
                      Surface Notes
                    </h4>
                    <p className="text-sm leading-relaxed text-white/70">{planet.type.description}</p>
                  </section>
                )}
              </div>

              <div className="border-t border-cyan-500/20 px-6 py-5">
                <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50 mb-3">
                  Available Actions
                </h4>
                <div className="space-y-3">
                  {actionButtons.map((action) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.id}
                        onClick={() => action.onClick()}
                        className="w-full rounded-xl border border-cyan-500/25 bg-white/5 px-4 py-3 text-left transition hover:border-cyan-400/50 hover:bg-cyan-500/10"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-cyan-500/40 bg-black/50">
                            <Icon className="h-4 w-4 text-cyan-200" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-white">{action.label}</span>
                              <ChevronRight className="h-4 w-4 text-cyan-200/60" />
                            </div>
                            {action.description && (
                              <p className="mt-1 text-xs text-white/60 leading-relaxed">{action.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
