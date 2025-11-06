import { useState } from 'react'
import { Incident, FleetDetails } from '@/types/api.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface WormholeTravelDialogProps {
  incident: Incident
  fleets: FleetDetails[]
  onConfirm: (fleetId: number) => void
  onCancel: () => void
}

/**
 * WormholeTravelDialog - Dialog for selecting a fleet to enter a wormhole
 */
export function WormholeTravelDialog({
  incident,
  fleets,
  onConfirm,
  onCancel,
}: WormholeTravelDialogProps) {
  const [selectedFleetId, setSelectedFleetId] = useState<number | null>(null)

  // Filter fleets that are available (stationed or can be moved)
  const availableFleets = fleets.filter(
    fleet => fleet.status === 'stationed' || fleet.status === 'in_transit'
  )

  const successChance = incident.wormhole?.success_chance || 0.7
  const failureChance = 1 - successChance

  const handleConfirm = () => {
    if (selectedFleetId) {
      onConfirm(selectedFleetId)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Wormhole</DialogTitle>
          <DialogDescription>
            Select a fleet to enter the wormhole. There is a {failureChance * 100}% chance of
            failure!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Warning:</strong> Entering this wormhole has a {failureChance * 100}% chance
              of failure. Your fleet may be lost!
            </AlertDescription>
          </Alert>

          {incident.wormhole && (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Destination Region:</span>{' '}
                {incident.wormhole.destination_region}
              </div>
              <div>
                <span className="font-semibold">Success Chance:</span>{' '}
                {(successChance * 100).toFixed(0)}%
              </div>
              <div>
                <span className="font-semibold">Uses Remaining:</span>{' '}
                {incident.wormhole.max_uses - incident.wormhole.uses} /{' '}
                {incident.wormhole.max_uses}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fleet-select">Select Fleet</Label>
            <Select
              value={selectedFleetId?.toString() || ''}
              onValueChange={value => setSelectedFleetId(parseInt(value, 10))}
            >
              <SelectTrigger id="fleet-select">
                <SelectValue placeholder="Choose a fleet..." />
              </SelectTrigger>
              <SelectContent>
                {availableFleets.length === 0 ? (
                  <SelectItem value="" disabled>
                    No available fleets
                  </SelectItem>
                ) : (
                  availableFleets.map(fleet => (
                    <SelectItem key={fleet.id} value={fleet.id.toString()}>
                      {fleet.name || `Fleet ${fleet.id}`} ({fleet.ships.length} ships)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedFleetId || availableFleets.length === 0}
            variant="destructive"
          >
            Enter Wormhole
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

