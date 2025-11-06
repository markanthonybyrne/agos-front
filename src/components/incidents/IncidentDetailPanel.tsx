import { useState } from 'react'
import { Incident } from '@/types/api.types'
import { useInteractIncidentMutation } from '@/api/endpoints/incidentsApi'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { IncidentIcon } from './IncidentIcon'
import { WormholeTravelDialog } from './WormholeTravelDialog'
import { toast } from 'sonner'
import { useTick } from '@/hooks/useTick'

interface IncidentDetailPanelProps {
  incident: Incident
  onClose: () => void
}

/**
 * IncidentDetailPanel - Shows detailed information about an incident
 */
export function IncidentDetailPanel({ incident, onClose }: IncidentDetailPanelProps) {
  const { currentTick } = useTick()
  const [showWormholeDialog, setShowWormholeDialog] = useState(false)
  const [interactIncident] = useInteractIncidentMutation()
  const { data: fleetsData } = useGetFleetsQuery()

  // Calculate time remaining
  const ticksRemaining = incident.expires_at_tick
    ? Math.max(0, incident.expires_at_tick - (currentTick || 0))
    : null

  const handleInteract = async (fleetId?: number) => {
    try {
      const result = await interactIncident({
        id: incident.id,
        data: { fleet_id: fleetId },
      }).unwrap()

      if (result.status === 'success') {
        toast.success(result.message)
        if (result.data?.destination) {
          toast.info(`Destination: Region ${result.data.destination.region}`)
        }
        onClose()
      } else {
        toast.error(result.message || 'Failed to interact with incident')
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to interact with incident')
    }
  }

  const renderIncidentDetails = () => {
    switch (incident.type) {
      case 'wormhole':
        return (
          <>
            {incident.wormhole && (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Destination Region:</span>{' '}
                  {incident.wormhole.destination_region}
                </div>
                <div>
                  <span className="font-semibold">Success Chance:</span>{' '}
                  {(incident.wormhole.success_chance * 100).toFixed(0)}%
                </div>
                <div>
                  <span className="font-semibold">Uses:</span>{' '}
                  {incident.wormhole.uses} / {incident.wormhole.max_uses}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Warning: 30% failure chance. Fleet may be lost!
                </div>
              </div>
            )}
            <Button
              onClick={() => setShowWormholeDialog(true)}
              className="w-full"
              disabled={!incident.wormhole || incident.wormhole.uses >= incident.wormhole.max_uses}
            >
              Enter Wormhole
            </Button>
          </>
        )

      case 'asteroid_storm':
        return (
          incident.asteroid_storm && (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Damage per Tick:</span>{' '}
                {incident.asteroid_storm.damage_per_tick}
              </div>
              <div>
                <span className="font-semibold">Threat Level:</span>{' '}
                <Badge
                  variant={
                    incident.asteroid_storm.threat_level === 'high'
                      ? 'destructive'
                      : incident.asteroid_storm.threat_level === 'medium'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {incident.asteroid_storm.threat_level.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Fleets passing through will take damage
              </div>
            </div>
          )
        )

      case 'resource_rush':
        return (
          incident.resource_rush && (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Resource Type:</span>{' '}
                {incident.resource_rush.resource_type}
              </div>
              <div>
                <span className="font-semibold">Bonus Multiplier:</span>{' '}
                {incident.resource_rush.bonus_multiplier}x
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                ✅ All planets in radius gain production bonus
              </div>
            </div>
          )
        )

      case 'pirate_raid':
        return (
          incident.pirate_raid && (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Threat Level:</span>{' '}
                <Badge
                  variant={
                    incident.pirate_raid.threat_level === 'high'
                      ? 'destructive'
                      : incident.pirate_raid.threat_level === 'medium'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {incident.pirate_raid.threat_level.toUpperCase()}
                </Badge>
              </div>
              {incident.pirate_raid.target_planet_id && (
                <div>
                  <span className="font-semibold">Target Planet:</span>{' '}
                  {incident.pirate_raid.target_planet_id}
                </div>
              )}
              <div className="text-sm text-red-600 dark:text-red-400">
                ⚠️ NPC fleet will attack target planet
              </div>
            </div>
          )
        )

      case 'anomaly':
        return (
          incident.anomaly && (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Discovered:</span>{' '}
                {incident.anomaly.discovered ? 'Yes' : 'No'}
              </div>
              {incident.anomaly.discovered_by_you && (
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  ✅ Discovered by you!
                </div>
              )}
              {incident.anomaly.research_bonus && (
                <div>
                  <span className="font-semibold">Research Bonus:</span>{' '}
                  +{(incident.anomaly.research_bonus * 100).toFixed(0)}%
                </div>
              )}
              {!incident.anomaly.discovered && (
                <>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    ✨ First player to discover gains research bonus
                  </div>
                  <Button onClick={() => handleInteract()} className="w-full">
                    Discover Anomaly
                  </Button>
                </>
              )}
            </div>
          )
        )

      default:
        return null
    }
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <IncidentIcon incident={incident} size={32} />
            <div>
              <CardTitle>{incident.name}</CardTitle>
              <CardDescription>
                {incident.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{incident.description}</p>
          </div>

          <div>
            <span className="font-semibold">Location:</span>{' '}
            Region {incident.location.region}, System {incident.location.system} (
            {incident.location.x}, {incident.location.y})
          </div>

          <div>
            <span className="font-semibold">Radius:</span> {incident.radius}
          </div>

          {ticksRemaining !== null && (
            <div>
              <span className="font-semibold">Time Remaining:</span> {ticksRemaining} ticks
            </div>
          )}

          <div className="border-t pt-4">{renderIncidentDetails()}</div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>

      {showWormholeDialog && (
        <WormholeTravelDialog
          incident={incident}
          fleets={fleetsData?.fleets || []}
          onConfirm={handleInteract}
          onCancel={() => setShowWormholeDialog(false)}
        />
      )}
    </>
  )
}

