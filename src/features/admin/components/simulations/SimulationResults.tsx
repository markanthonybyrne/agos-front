import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Trophy } from 'lucide-react'
import { CombatSimulationResult } from '@/types/api.types'
import { exportToJSON, exportToCSV, formatShipLosses, formatDefenceLosses, getWinnerColor } from '@/lib/simulationHelpers'
import { downloadFile } from '@/lib/simulationHelpers'

interface SimulationResultsProps {
  result: CombatSimulationResult
  name: string
}

export function SimulationResults({ result, name }: SimulationResultsProps) {
  const handleExportJSON = () => {
    const json = exportToJSON(result)
    downloadFile(json, `simulation-${name.toLowerCase().replace(/\s+/g, '-')}.json`, 'application/json')
  }

  const handleExportCSV = () => {
    const csv = exportToCSV(result, name)
    downloadFile(csv, `simulation-${name.toLowerCase().replace(/\s+/g, '-')}.csv`, 'text/csv')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Simulation Results</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="casualties">Casualties</TabsTrigger>
            {result.round_logs && <TabsTrigger value="logs">Round Logs</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Trophy className={`w-8 h-8 ${getWinnerColor(result.winner_empire_id, result.winner_empire_id)}`} />
              <div>
                <div className="text-sm text-muted-foreground">Winner</div>
                <div className="text-2xl font-bold text-cyan-400">
                  Empire {result.winner_empire_id}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Battle ID</div>
                <div className="font-mono">{result.battle_id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Seed</div>
                <div className="font-mono">{result.seed}</div>
              </div>
            </div>

            {result.final_participants && result.final_participants.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Final Participants</div>
                <div className="space-y-2">
                  {result.final_participants.map((participant, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <div className="font-medium">
                          {participant.type === 'fleet' ? 'Fleet' : 'Planet'} - Empire {participant.empire_id}
                        </div>
                        {participant.ships && (
                          <div className="text-sm text-muted-foreground">
                            {Object.entries(participant.ships).map(([ship, count]) => (
                              <Badge key={ship} variant="outline" className="mr-1">
                                {ship}: {count}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {participant.defences && Array.isArray(participant.defences) && (
                          <div className="text-sm text-muted-foreground">
                            {participant.defences.map((def, idx) => (
                              <Badge key={idx} variant="outline" className="mr-1">
                                {def.defence_slug}: {def.quantity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {participant.empire_id === result.winner_empire_id && (
                        <Badge variant="default">Winner</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="casualties" className="space-y-4 mt-4">
            <div>
              <div className="text-sm font-medium mb-2">Ships Lost</div>
              <div className="p-3 bg-muted rounded text-sm">
                {formatShipLosses(result.ships_lost)}
              </div>
            </div>

            {result.defences_destroyed && result.defences_destroyed.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Defences Destroyed</div>
                <div className="p-3 bg-muted rounded text-sm">
                  {formatDefenceLosses(result.defences_destroyed)}
                </div>
              </div>
            )}
          </TabsContent>

          {result.round_logs && (
            <TabsContent value="logs" className="space-y-4 mt-4">
              <div className="space-y-2">
                {result.round_logs.map((round, idx) => (
                  <Card key={idx} className="bg-muted">
                    <CardHeader>
                      <CardTitle className="text-lg">Round {round.round}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Actions</div>
                        <div className="space-y-2">
                          {round.actions.map((action, actionIdx) => (
                            <div key={actionIdx} className="text-sm">
                              <div className="font-medium">
                                Empire {action.attacker.empire_id} → Empire {action.target.empire_id}
                              </div>
                              <div className="text-muted-foreground">
                                Damage Dealt: {action.damage_dealt}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}

