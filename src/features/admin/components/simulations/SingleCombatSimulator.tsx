import { useState } from 'react'
import { useSimulateCombatMutation } from '@/api/endpoints/adminCombatSimulationApi'
import { useListFleetsQuery } from '@/api/endpoints/adminApi'
import { useListPlanetsQuery } from '@/api/endpoints/adminApi'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useGetDefenceDefinitionsQuery } from '@/api/endpoints/defencesApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { SimulationResults } from './SimulationResults'
import { CombatSimulationResult } from '@/types/api.types'

type FleetMode = 'existing' | 'custom'
type PlanetMode = 'existing' | 'custom'

export function SingleCombatSimulator() {
  const [fleetMode, setFleetMode] = useState<FleetMode>('existing')
  const [planetMode, setPlanetMode] = useState<PlanetMode>('existing')
  
  const [selectedFleetId, setSelectedFleetId] = useState<string>('')
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>('')
  
  const [customShips, setCustomShips] = useState<Record<string, number>>({})
  const [customDefences, setCustomDefences] = useState<Array<{ defence_slug: string; quantity: number }>>([])
  
  const [detailedLogs, setDetailedLogs] = useState(false)
  const [overrideSeed, setOverrideSeed] = useState('')
  const [tickNumber, setTickNumber] = useState('')
  
  const [result, setResult] = useState<CombatSimulationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const [simulateCombat] = useSimulateCombatMutation()
  
  // Fetch data for dropdowns
  const { data: fleetsData } = useListFleetsQuery({ page: 1, per_page: 100 })
  const { data: planetsData } = useListPlanetsQuery({ page: 1, per_page: 100 })
  const { data: shipsData } = useGetShipDefinitionsQuery()
  const { data: defencesData } = useGetDefenceDefinitionsQuery()

  const handleSimulate = async () => {
    setLoading(true)
    try {
      const request: any = {
        detailed_logs: detailedLogs,
      }

      if (fleetMode === 'existing') {
        if (!selectedFleetId) {
          toast.error('Please select a fleet')
          return
        }
        request.fleet_id = parseInt(selectedFleetId)
      } else {
        if (Object.keys(customShips).length === 0) {
          toast.error('Please configure custom fleet')
          return
        }
        request.custom_fleet_ships = customShips
      }

      if (planetMode === 'existing') {
        if (!selectedPlanetId) {
          toast.error('Please select a planet')
          return
        }
        request.planet_id = parseInt(selectedPlanetId)
      } else {
        if (customDefences.length === 0) {
          toast.error('Please configure custom defences')
          return
        }
        request.custom_planet_defences = customDefences
      }

      if (overrideSeed) {
        request.override_seed = overrideSeed
      }

      if (tickNumber) {
        request.tick_number = parseInt(tickNumber)
      }

      const response = await simulateCombat(request).unwrap()
      setResult(response.simulation)
      toast.success('Combat simulated successfully')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to simulate combat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Single Combat Simulation</CardTitle>
          <CardDescription>
            Simulate a single combat scenario between a fleet and planet defences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fleet Configuration */}
          <div className="space-y-4">
            <div>
              <Label>Fleet Source</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={fleetMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFleetMode('existing')}
                >
                  Existing Fleet
                </Button>
                <Button
                  variant={fleetMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFleetMode('custom')}
                >
                  Custom Fleet
                </Button>
              </div>
            </div>

            {fleetMode === 'existing' ? (
              <div>
                <Label htmlFor="fleet-select">Select Fleet</Label>
                <Select value={selectedFleetId} onValueChange={setSelectedFleetId}>
                  <SelectTrigger id="fleet-select">
                    <SelectValue placeholder="Choose a fleet" />
                  </SelectTrigger>
                  <SelectContent>
                    {fleetsData?.data?.map((fleet) => (
                      <SelectItem key={fleet.id} value={String(fleet.id)}>
                        Fleet {fleet.id} - Empire {fleet.owner_empire_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Custom Fleet Composition</Label>
                {shipsData?.ships?.map((ship) => (
                  <div key={ship.slug} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder={ship.name}
                      value={customShips[ship.slug] || ''}
                      onChange={(e) => setCustomShips({
                        ...customShips,
                        [ship.slug]: parseInt(e.target.value) || 0
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">{ship.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Planet Configuration */}
          <div className="space-y-4">
            <div>
              <Label>Defence Source</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={planetMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPlanetMode('existing')}
                >
                  Existing Planet
                </Button>
                <Button
                  variant={planetMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPlanetMode('custom')}
                >
                  Custom Defences
                </Button>
              </div>
            </div>

            {planetMode === 'existing' ? (
              <div>
                <Label htmlFor="planet-select">Select Planet</Label>
                <Select value={selectedPlanetId} onValueChange={setSelectedPlanetId}>
                  <SelectTrigger id="planet-select">
                    <SelectValue placeholder="Choose a planet" />
                  </SelectTrigger>
                  <SelectContent>
                    {planetsData?.data?.map((planet) => (
                      <SelectItem key={planet.id} value={String(planet.id)}>
                        Planet {planet.id} - {planet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Custom Defence Composition</Label>
                {defencesData?.defences?.map((defence) => (
                  <div key={defence.slug} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder={defence.name}
                      value={customDefences.find(d => d.defence_slug === defence.slug)?.quantity || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setCustomDefences(
                          customDefences.filter(d => d.defence_slug !== defence.slug).concat(
                            value > 0 ? [{ defence_slug: defence.slug, quantity: value }] : []
                          )
                        )
                      }}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">{defence.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="detailed-logs">Detailed Logs</Label>
              <Switch
                id="detailed-logs"
                checked={detailedLogs}
                onCheckedChange={setDetailedLogs}
              />
            </div>

            <div>
              <Label htmlFor="seed">Override Seed (Optional)</Label>
              <Input
                id="seed"
                value={overrideSeed}
                onChange={(e) => setOverrideSeed(e.target.value)}
                placeholder="Leave empty for random"
              />
            </div>

            <div>
              <Label htmlFor="tick">Tick Number (Optional)</Label>
              <Input
                id="tick"
                type="number"
                value={tickNumber}
                onChange={(e) => setTickNumber(e.target.value)}
                placeholder="Leave empty for current tick"
              />
            </div>
          </div>

          <Button onClick={handleSimulate} disabled={loading} className="w-full">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Run Simulation
          </Button>
        </CardContent>
      </Card>

      {result && (
        <SimulationResults result={result} name="Single Combat" />
      )}
    </div>
  )
}

