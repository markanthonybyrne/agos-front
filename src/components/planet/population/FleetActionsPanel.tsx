import { useEffect, useMemo, useState } from 'react'
import { usePanel } from '@/components/common/PanelManager'
import { PanelSize, PanelType } from '@/app/slices/panelSlice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Target,
  Swords,
  Rocket,
  AlertTriangle,
  Ship,
  Minus,
  Plus,
  Loader2,
} from 'lucide-react'
import { Planet } from '@/types/api.types'
import { cn } from '@/lib/utils'
import { useGetPlanetShipsQuery, useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useCreateFleetMutation } from '@/api/endpoints/fleetsApi'
import { useColonizePlanetMutation } from '@/api/endpoints/planetsApi'
import { getShipImage } from '@/lib/shipImages'
import { parseCoordinate, getPlanetXY, formatCoordinate } from '@/lib/coordinates'
import { getGalaxyXyRange, getSystemXyRange, hierarchicalToXy } from '@/lib/coordinateUtils'
import { toast } from 'sonner'
import { formatResource } from '@/lib/formatters'

interface FleetActionsPanelProps {
  planet: Planet
  className?: string
}

type FleetActionKey = 'defend' | 'attack' | 'reinforce' | 'colonize' | 'transport'

interface AvailableShip {
  definitionId: number
  slug: string
  name: string
  quantity: number
  image?: string
}

interface DestinationPayload {
  x: number
  y: number
  quadrant?: number
  sector?: number
  galaxy?: number
  system?: number
  planet?: number
}

const ACTION_CONFIG: Record<
  FleetActionKey,
  {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    variant: 'primary' | 'danger' | 'neutral'
    orderType: 'defend' | 'attack' | 'station' | 'transport' | 'colonize'
    requireCoordinate?: boolean
    requireResources?: boolean
    requireColonyName?: boolean
    showAutoReturn?: boolean
    successMessage: string
  }
> = {
  defend: {
    title: 'Defend Orbit',
    description: 'Deploy fleets here to intercept incoming threats or hold position.',
    icon: Shield,
    variant: 'primary',
    orderType: 'defend',
    successMessage: 'Fleet deployed to defend orbit',
  },
  attack: {
    title: 'Launch Offensive',
    description: 'Select a target world and send strike forces or invasions.',
    icon: Swords,
    variant: 'danger',
    orderType: 'attack',
    requireCoordinate: true,
    successMessage: 'Offensive fleet launched',
  },
  reinforce: {
    title: 'Reinforce Ally',
    description: 'Station fleets at allied colonies to bolster defenses.',
    icon: Target,
    variant: 'primary',
    orderType: 'defend',
    requireCoordinate: true,
    showAutoReturn: true,
    successMessage: 'Reinforcement fleet in transit',
  },
  colonize: {
    title: 'Colonize Frontier',
    description: 'Send colony ships to establish new settlements.',
    icon: Rocket,
    variant: 'primary',
    orderType: 'colonize',
    requireCoordinate: true,
    requireColonyName: true,
    successMessage: 'Colonization mission launched',
  },
  transport: {
    title: 'Resource Transport',
    description: 'Move Tellerium and Krypton between your colonies.',
    icon: AlertTriangle,
    variant: 'neutral',
    orderType: 'transport',
    requireCoordinate: true,
    requireResources: true,
    successMessage: 'Resource convoy launched',
  },
}

const ACTION_ORDER: FleetActionKey[] = ['defend', 'attack', 'reinforce', 'transport', 'colonize']

export function FleetActionsPanel({ planet, className }: FleetActionsPanelProps) {
  const { openPanel } = usePanel()
  const [expandedActions, setExpandedActions] = useState<Record<FleetActionKey, boolean>>({
    defend: true,
    attack: false,
    reinforce: false,
    transport: false,
    colonize: false,
  })
  const [shipSelections, setShipSelections] = useState<Record<FleetActionKey, Record<string, number>>>(
    {
      defend: {},
      attack: {},
      reinforce: {},
      transport: {},
      colonize: {},
    },
  )
  const [coordinateInputs, setCoordinateInputs] = useState<
    Record<'attack' | 'reinforce' | 'transport' | 'colonize', string>
  >({
    attack: '',
    reinforce: '',
    transport: '',
    colonize: '',
  })
  const [transportResources, setTransportResources] = useState<{ tellerium: string; krypton: string }>(
    { tellerium: '', krypton: '' },
  )
  const [colonyName, setColonyName] = useState('New Colony')
  const [autoReturnFlags, setAutoReturnFlags] = useState<{ reinforce: boolean }>({ reinforce: true })
  const [actionErrors, setActionErrors] = useState<Record<FleetActionKey, string | null>>({
    defend: null,
    attack: null,
    reinforce: null,
    transport: null,
    colonize: null,
  })
  const [loadingAction, setLoadingAction] = useState<FleetActionKey | null>(null)

  const { data: shipDefinitions, isLoading: isLoadingShipDefinitions } = useGetShipDefinitionsQuery()
  const { data: planetShipsData, isLoading: isLoadingPlanetShips } = useGetPlanetShipsQuery(planet.id, {
    skip: !planet?.id,
  })
  const [createFleet, { isLoading: isCreatingFleet }] = useCreateFleetMutation()
  const [colonizePlanet, { isLoading: isColonizing }] = useColonizePlanetMutation()

  const availableShips = useMemo<AvailableShip[]>(() => {
    const shipList =
      (planetShipsData as any)?.ships ?? (planetShipsData as any)?.data?.ships ?? []
    if (!Array.isArray(shipList) || shipList.length === 0) {
      return []
    }

    const definitionMap = new Map<number, any>()
    shipDefinitions?.ships?.forEach((def) => definitionMap.set(def.id, def))

    return shipList
      .map((ship: any) => {
        const def = definitionMap.get(ship.definition_id)
        const slug = def?.slug || ship.slug || ship.definition?.slug || `ship_${ship.definition_id}`
        return {
          definitionId: ship.definition_id,
          slug,
          name: def?.name || ship.definition?.name || slug.replace(/_/g, ' '),
          quantity: ship.quantity ?? ship.available ?? 0,
          image: slug ? getShipImage(slug) : undefined,
        } as AvailableShip
      })
      .filter((ship) => ship.quantity > 0)
  }, [planetShipsData, shipDefinitions])

  const hasColonyShips = useMemo(
    () => availableShips.some((ship) => ship.slug === 'colony_ship' || ship.slug.includes('colony')),
    [availableShips],
  )

  const isDataLoading = isLoadingShipDefinitions || isLoadingPlanetShips
  const isGlobalLoading = isCreatingFleet || isColonizing

  useEffect(() => {
    setShipSelections({
      defend: {},
      attack: {},
      reinforce: {},
      transport: {},
      colonize: {},
    })
    setCoordinateInputs({ attack: '', reinforce: '', transport: '', colonize: '' })
    setTransportResources({ tellerium: '', krypton: '' })
    setColonyName('New Colony')
    setAutoReturnFlags({ reinforce: true })
    setActionErrors({ defend: null, attack: null, reinforce: null, transport: null, colonize: null })
    setLoadingAction(null)
  }, [planet.id])

  const toggleActionDetails = (action: FleetActionKey) => {
    setExpandedActions((prev) => ({
      ...prev,
      [action]: !prev[action],
    }))
  }

  const updateShipSelection = (actionKey: FleetActionKey, slug: string, quantity: number) => {
    const available = availableShips.find((ship) => ship.slug === slug)?.quantity ?? 0
    const clamped = Math.max(0, Math.min(available, quantity))

    setShipSelections((prev) => {
      const next = { ...prev[actionKey] }
      if (clamped === 0) {
        delete next[slug]
      } else {
        next[slug] = clamped
      }
      return {
        ...prev,
        [actionKey]: next,
      }
    })
  }

  const handleShipDelta = (actionKey: FleetActionKey, slug: string, delta: number) => {
    const current = shipSelections[actionKey][slug] || 0
    updateShipSelection(actionKey, slug, current + delta)
  }

  const totalSelected = (actionKey: FleetActionKey) =>
    Object.values(shipSelections[actionKey]).reduce((sum, qty) => sum + qty, 0)

  const ensureShipsSelected = (actionKey: FleetActionKey) => {
    const ships = shipSelections[actionKey]
    const total = totalSelected(actionKey)
    if (total === 0) {
      throw new Error('Select at least one ship to launch this command.')
    }
    return ships
  }

  const ensurePlanetDestination = (): DestinationPayload => {
    const xy = getPlanetXY(planet)
    if (!xy) {
      throw new Error('Planet coordinates are unavailable. Try refreshing the page.')
    }
    const coord = parseCoordinate(planet.coordinate)
    return {
      x: xy.x,
      y: xy.y,
      quadrant: coord?.quadrant,
      sector: coord?.sector,
      galaxy: coord?.galaxy,
      system: coord?.system,
      planet: coord?.planet,
    }
  }

  const resolveDestinationFromInput = (
    rawValue: string,
    options?: { requirePlanet?: boolean }
  ): DestinationPayload => {
    const value = rawValue.trim()
    if (!value) {
      throw new Error('Enter a destination coordinate in Q:S:G:SY:P format.')
    }

    const parsed = parseCoordinate(value)
    if (!parsed || !parsed.quadrant || !parsed.sector || !parsed.galaxy) {
      throw new Error('Coordinate must include Quadrant:Sector:Galaxy values.')
    }

    if (options?.requirePlanet) {
      if (typeof parsed.system !== 'number' || typeof parsed.planet !== 'number') {
        throw new Error('Include system and planet (Q:S:G:SY:P) for this action.')
      }
    }

    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return {
        x: Math.round(parsed.x),
        y: Math.round(parsed.y),
        quadrant: parsed.quadrant,
        sector: parsed.sector,
        galaxy: parsed.galaxy,
        system: parsed.system,
        planet: parsed.planet,
      }
    }

    let x: number | undefined
    let y: number | undefined

    if (typeof parsed.system === 'number') {
      const range = getSystemXyRange(parsed.quadrant, parsed.sector, parsed.galaxy, parsed.system)
      if (typeof parsed.planet === 'number') {
        const width = range.x_max - range.x_min
        const height = range.y_max - range.y_min
        const index = Math.max(0, parsed.planet - 1)
        const columns = 5
        const rows = 3
        const col = index % columns
        const row = Math.floor(index / columns)
        const planetWidth = width / columns
        const planetHeight = height / rows
        x = range.x_min + planetWidth * col + planetWidth / 2
        y = range.y_min + planetHeight * row + planetHeight / 2
      } else {
        x = (range.x_min + range.x_max) / 2
        y = (range.y_min + range.y_max) / 2
      }
    } else if (typeof parsed.planet === 'number') {
      const xy = hierarchicalToXy(parsed.quadrant, parsed.sector, parsed.galaxy, parsed.planet)
      x = xy.x
      y = xy.y
    } else {
      const range = getGalaxyXyRange(parsed.quadrant, parsed.sector, parsed.galaxy)
      x = (range.x_min + range.x_max) / 2
      y = (range.y_min + range.y_max) / 2
    }

    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('Unable to resolve coordinate to map position.')
    }

    return {
      x: Math.round(x),
      y: Math.round(y),
      quadrant: parsed.quadrant,
      sector: parsed.sector,
      galaxy: parsed.galaxy,
      system: parsed.system,
      planet: parsed.planet,
    }
  }

  const executeQuickAction = async (actionKey: FleetActionKey) => {
    setActionErrors((prev) => ({ ...prev, [actionKey]: null }))

    try {
      const ships = ensureShipsSelected(actionKey)
      const config = ACTION_CONFIG[actionKey]
      let executor: (() => Promise<unknown>) | null = null

      switch (actionKey) {
        case 'defend': {
          const destination = ensurePlanetDestination()
          executor = () =>
            createFleet({
              ships,
              origin_planet_id: planet.id,
              destination_x: destination.x,
              destination_y: destination.y,
              destination_quadrant: destination.quadrant,
              destination_sector: destination.sector,
              destination_galaxy: destination.galaxy,
              destination_planet: destination.planet,
              order_type: config.orderType,
            }).unwrap()
          break
        }
        case 'attack':
        case 'reinforce': {
          const destination = resolveDestinationFromInput(
            coordinateInputs[actionKey],
            { requirePlanet: true },
          )
          executor = () =>
            createFleet({
              ships,
              origin_planet_id: planet.id,
              destination_x: destination.x,
              destination_y: destination.y,
              destination_quadrant: destination.quadrant,
              destination_sector: destination.sector,
              destination_galaxy: destination.galaxy,
              destination_planet: destination.planet,
              order_type: config.orderType,
              auto_return_on_failure: actionKey === 'reinforce' ? autoReturnFlags.reinforce : undefined,
            }).unwrap()
          break
        }
        case 'transport': {
          const destination = resolveDestinationFromInput(
            coordinateInputs.transport,
            { requirePlanet: true },
          )
          const tellerium = Number(transportResources.tellerium || 0)
          const krypton = Number(transportResources.krypton || 0)

          if ((isNaN(tellerium) || tellerium < 0) || (isNaN(krypton) || krypton < 0)) {
            throw new Error('Resource quantities must be positive numbers.')
          }

          if (tellerium === 0 && krypton === 0) {
            throw new Error('Specify the Tellerium and/or Krypton to transport.')
          }

          if (tellerium > (planet.tellerium_balance ?? 0) || krypton > (planet.krypton_balance ?? 0)) {
            throw new Error('Requested resources exceed this planet’s available balance.')
          }

          const freighterCount = Object.entries(ships).reduce((acc, [slug, qty]) => (
            slug.includes('freighter') ? acc + qty : acc
          ), 0)

          if (freighterCount === 0) {
            throw new Error('Add at least one resource freighter to carry cargo.')
          }

          const capacity = freighterCount * 50000
          if (tellerium + krypton > capacity) {
            throw new Error(`Freighter capacity exceeded (${capacity.toLocaleString()} max).`)
          }

          executor = () =>
            createFleet({
              ships,
              origin_planet_id: planet.id,
              destination_x: destination.x,
              destination_y: destination.y,
              destination_quadrant: destination.quadrant,
              destination_sector: destination.sector,
              destination_galaxy: destination.galaxy,
              destination_planet: destination.planet,
              order_type: config.orderType,
              resources: {
                tellerium: tellerium || undefined,
                krypton: krypton || undefined,
              },
            }).unwrap()
          break
        }
        case 'colonize': {
          const destination = resolveDestinationFromInput(
            coordinateInputs.colonize,
            { requirePlanet: true },
          )

          if (!hasColonyShips) {
            throw new Error('Colony ships are required to establish a new settlement.')
          }

          const hasColonyShipSelected = Object.keys(ships).some((slug) => slug.includes('colony'))
          if (!hasColonyShipSelected) {
            throw new Error('Select at least one colony ship for the mission.')
          }

          if (
            destination.quadrant == null ||
            destination.sector == null ||
            destination.galaxy == null ||
            destination.planet == null
          ) {
            throw new Error('Colonisation requires a full Q:S:G:SY:P coordinate.')
          }

          const trimmedName = colonyName.trim() || 'New Colony'

          executor = () =>
            colonizePlanet({
              origin_planet_id: planet.id,
              ships,
              quadrant: destination.quadrant,
              sector: destination.sector,
              galaxy: destination.galaxy,
              system: destination.system,
              planet: destination.planet,
              x: destination.x,
              y: destination.y,
              name: trimmedName,
            }).unwrap()
          break
        }
        default:
          break
      }

      if (!executor) {
        throw new Error('Unsupported action. Please use the advanced fleet planner.')
      }

      setLoadingAction(actionKey)
      await executor()

      toast.success(config.successMessage)

      setShipSelections((prev) => ({
        ...prev,
        [actionKey]: {},
      }))

      if (actionKey === 'transport') {
        setTransportResources({ tellerium: '', krypton: '' })
      }

      if (actionKey === 'attack' || actionKey === 'reinforce' || actionKey === 'transport' || actionKey === 'colonize') {
        setCoordinateInputs((prev) => ({
          ...prev,
          [actionKey]: '',
        }))
      }

      if (actionKey === 'colonize') {
        setColonyName('New Colony')
      }
    } catch (error: any) {
      const message = error?.message || error?.data?.message || 'Unable to launch this command right now.'
      setActionErrors((prev) => ({ ...prev, [actionKey]: message }))
      toast.error('Fleet command failed', { description: message })
    } finally {
      setLoadingAction(null)
    }
  }

  const openAdvancedAction = (actionKey: FleetActionKey) => {
    const config = ACTION_CONFIG[actionKey]
    openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
      planetId: planet.id,
      orderType: config.orderType,
      originPlanetId: planet.id,
      origin: planet,
    })
  }

  const renderShipSelector = (actionKey: FleetActionKey) => {
    if (isDataLoading) {
      return (
        <div className="flex items-center gap-2 rounded-md border border-border/40 bg-black/30 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading fleet assets…
        </div>
      )
    }

    if (availableShips.length === 0) {
      return (
        <div className="rounded-md border border-border/40 bg-black/30 px-3 py-3 text-[11px] text-muted-foreground">
          No ships are currently stationed on this planet.
        </div>
      )
    }

    const total = totalSelected(actionKey)

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.3em] text-cyan-200">
            Fleet Composition
          </span>
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
            {total} ships
          </Badge>
        </div>

        <div className="space-y-2">
          {availableShips.map((ship) => {
            const selected = shipSelections[actionKey][ship.slug] || 0
            return (
              <div
                key={`${actionKey}-${ship.slug}`}
                className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-black/30 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  {ship.image ? (
                    <img
                      src={ship.image}
                      alt={ship.name}
                      className="h-10 w-10 rounded object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded border border-cyan-500/20 bg-black/40">
                      <Ship className="h-5 w-5 text-cyan-300" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-cyan-100">{ship.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Available: {ship.quantity.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleShipDelta(actionKey, ship.slug, -1)}
                    disabled={selected === 0 || isGlobalLoading}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-10 text-center font-mono text-sm">{selected}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleShipDelta(actionKey, ship.slug, 1)}
                    disabled={selected >= ship.quantity || isGlobalLoading}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {ACTION_ORDER.map((actionKey) => {
        const config = ACTION_CONFIG[actionKey]
        const Icon = config.icon
        const isExpanded = expandedActions[actionKey]
        const isActionLoading = loadingAction === actionKey && isGlobalLoading
        const quickDisabledBase =
          isGlobalLoading ||
          (actionKey === 'colonize' && !hasColonyShips) ||
          (actionKey === 'transport' && (planet?.tellerium_balance ?? 0) <= 0 && (planet?.krypton_balance ?? 0) <= 0)
        const coordinateKey = (['attack', 'reinforce', 'transport', 'colonize'] as const).includes(actionKey as any)
          ? (actionKey as keyof typeof coordinateInputs)
          : null

        return (
          <div
            key={actionKey}
            className={cn(
              'rounded-xl border px-3 py-2 transition-colors',
              config.variant === 'danger'
                ? 'border-red-500/40 bg-red-500/10'
                : config.variant === 'primary'
                  ? 'border-cyan-500/40 bg-cyan-500/10'
                  : 'border-border/30 bg-black/40',
            )}
          >
            <button
              type="button"
              onClick={() => toggleActionDetails(actionKey)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2 text-xs text-cyan-100">
                <Icon className="h-4 w-4" />
                <span className="font-semibold tracking-[0.22em] uppercase">
                  {config.title}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-cyan-200" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-cyan-200" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-3 text-xs text-muted-foreground">
                <p>{config.description}</p>

                <div className="flex flex-wrap gap-2">
                  {actionKey === 'defend' && (
                    <>
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                        Hold Position
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                        Intercept Threats
                      </Badge>
                    </>
                  )}
                  {actionKey === 'attack' && (
                    <>
                      <Badge variant="outline" className="border-red-500/40 text-red-200">
                        Strike Target
                      </Badge>
                      <Badge variant="outline" className="border-red-500/40 text-red-200">
                        Choose Destination
                      </Badge>
                    </>
                  )}
                  {actionKey === 'reinforce' && (
                    <>
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                        Shield Allies
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                        Station Fleet
                      </Badge>
                    </>
                  )}
                  {actionKey === 'transport' && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-200">
                      Tellerium / Krypton
                    </Badge>
                  )}
                  {actionKey === 'colonize' && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-200">
                      Colony Ships Required
                    </Badge>
                  )}
                </div>

                {renderShipSelector(actionKey)}

                {config.requireCoordinate && coordinateKey && (
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.3em] text-cyan-200">
                      Destination Coordinate
                    </Label>
                    <Input
                      type="text"
                      placeholder="Q:S:G:SY:P"
                      value={coordinateInputs[coordinateKey]}
                      onChange={(event) =>
                        setCoordinateInputs((prev) => ({
                          ...prev,
                          [coordinateKey]: event.target.value,
                        }))
                      }
                      disabled={isGlobalLoading}
                      className="bg-black/40 font-mono text-[12px]"
                    />
                  </div>
                )}

                {config.showAutoReturn && (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-black/30 px-3 py-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-200">
                        Auto-return on failure
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Fleet falls back if the ally world becomes unreachable.
                      </p>
                    </div>
                    <Switch
                      checked={autoReturnFlags.reinforce}
                      onCheckedChange={(checked) =>
                        setAutoReturnFlags({ reinforce: checked })
                      }
                      disabled={isGlobalLoading}
                    />
                  </div>
                )}

                {config.requireResources && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.3em] text-cyan-200">
                          Tellerium to send
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          value={transportResources.tellerium}
                          onChange={(event) =>
                            setTransportResources((prev) => ({
                              ...prev,
                              tellerium: event.target.value,
                            }))
                          }
                          disabled={isGlobalLoading}
                          className="bg-black/40 font-mono text-[12px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-[0.3em] text-cyan-200">
                          Krypton to send
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          value={transportResources.krypton}
                          onChange={(event) =>
                            setTransportResources((prev) => ({
                              ...prev,
                              krypton: event.target.value,
                            }))
                          }
                          disabled={isGlobalLoading}
                          className="bg-black/40 font-mono text-[12px]"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Available • Tellerium: {formatResource(planet.tellerium_balance ?? 0)} · Krypton: {formatResource(planet.krypton_balance ?? 0)}
                    </p>
                  </div>
                )}

                {config.requireColonyName && (
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.3em] text-cyan-200">
                      Colony name
                    </Label>
                    <Input
                      type="text"
                      value={colonyName}
                      onChange={(event) => setColonyName(event.target.value)}
                      disabled={isGlobalLoading}
                      className="bg-black/40 text-[12px]"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    className={cn(
                      'flex-1',
                      config.variant === 'danger'
                        ? 'bg-red-500/30 text-red-100 hover:bg-red-500/40'
                        : 'bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30',
                    )}
                    onClick={() => executeQuickAction(actionKey)}
                    disabled={quickDisabledBase || isActionLoading}
                  >
                    {isActionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Launching…
                      </>
                    ) : (
                      'Launch Quick Command'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="sm:w-auto"
                    onClick={() => openAdvancedAction(actionKey)}
                    disabled={isGlobalLoading}
                  >
                    Open Fleet Planner
                  </Button>
                </div>

                {actionErrors[actionKey] && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                    {actionErrors[actionKey]}
                  </div>
                )}

                {actionKey === 'colonize' && !hasColonyShips && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                    Build or transfer colony ships to this world before launching a frontier mission.
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

