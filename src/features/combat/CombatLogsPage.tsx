import { useAppSelector } from '@/app/hooks'
import { useGetCombatLogsQuery } from '@/api/endpoints/empiresApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CombatLog } from '@/types/api.types'
import { formatDate } from '@/lib/formatters'
import { Sword, Shield, Trophy, XCircle, AlertCircle } from 'lucide-react'

export function CombatLogsPage() {
  const empire = useAppSelector((state) => state.auth.empire)
  const { data, isLoading, error } = useGetCombatLogsQuery(empire?.id || 0, {
    skip: !empire?.id,
    refetchOnMountOrArgChange: true,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Error loading combat logs</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const combatLogs = data?.combat_logs || []

  if (combatLogs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Sword className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No combat logs found</p>
            <p className="text-sm mt-2">Battle reports will appear here after combat is resolved.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading glow-cyan">Battle Reports</h1>
        <p className="text-muted-foreground">Combat logs from your empire's battles</p>
      </div>

      <div className="space-y-4">
        {combatLogs.map((log: CombatLog) => {
          const isAttacker = log.attacker_empire_id === empire?.id
          const isWinner = (isAttacker && log.attacker_won) || (!isAttacker && !log.attacker_won)
          
          return (
            <Card key={log.id} className={isWinner ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isWinner ? (
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {isWinner ? 'Victory' : 'Defeat'} at {log.planet_coordinate}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>Tick {log.tick_number}</span>
                        <span>•</span>
                        <span>{formatDate(log.created_at)}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={isWinner ? 'default' : 'destructive'}>
                    {isWinner ? 'Victory' : 'Defeat'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Combatants */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sword className="w-4 h-4 text-orange-400" />
                      <h4 className="font-medium">Attacker</h4>
                      {isAttacker && <Badge variant="outline" className="text-xs">You</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{log.attacker_empire_name}</p>
                    {Object.keys(log.attacker_ships).length > 0 && (
                      <div className="text-xs space-y-1 mt-2">
                        <p className="font-medium">Ships:</p>
                        {Object.entries(log.attacker_ships).map(([ship, count]) => (
                          <p key={ship} className="text-muted-foreground">
                            {ship.replace(/_/g, ' ')}: {count}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <h4 className="font-medium">Defender</h4>
                      {!isAttacker && <Badge variant="outline" className="text-xs">You</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{log.defender_empire_name}</p>
                    {Object.keys(log.defender_ships).length > 0 && (
                      <div className="text-xs space-y-1 mt-2">
                        <p className="font-medium">Ships:</p>
                        {Object.entries(log.defender_ships).map(([ship, count]) => (
                          <p key={ship} className="text-muted-foreground">
                            {ship.replace(/_/g, ' ')}: {count}
                          </p>
                        ))}
                      </div>
                    )}
                    {Object.keys(log.defender_defences).length > 0 && (
                      <div className="text-xs space-y-1 mt-2">
                        <p className="font-medium">Defences:</p>
                        {Object.entries(log.defender_defences).map(([defence, count]) => (
                          <p key={defence} className="text-muted-foreground">
                            {defence.replace(/_/g, ' ')}: {count}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Losses */}
                {(Object.keys(log.attacker_losses).length > 0 || Object.keys(log.defender_losses).length > 0) && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium mb-3">Losses</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-orange-400">Attacker Losses:</p>
                        {Object.keys(log.attacker_losses).length > 0 ? (
                          Object.entries(log.attacker_losses).map(([ship, count]) => (
                            <p key={ship} className="text-xs text-muted-foreground">
                              {ship.replace(/_/g, ' ')}: {count}
                            </p>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">None</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-400">Defender Losses:</p>
                        {Object.keys(log.defender_losses).length > 0 ? (
                          <>
                            {Object.entries(log.defender_losses).map(([ship, count]) => (
                              <p key={ship} className="text-xs text-muted-foreground">
                                {ship.replace(/_/g, ' ')}: {count}
                              </p>
                            ))}
                            {Object.keys(log.defender_defence_losses).length > 0 && (
                              <>
                                <p className="text-xs font-medium mt-2">Defences:</p>
                                {Object.entries(log.defender_defence_losses).map(([defence, count]) => (
                                  <p key={defence} className="text-xs text-muted-foreground">
                                    {defence.replace(/_/g, ' ')}: {count}
                                  </p>
                                ))}
                              </>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">None</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                <div className="pt-4 border-t border-border space-y-2">
                  {log.resources_stolen && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Resources Stolen:</span>
                      <span className="text-sm text-muted-foreground">
                        {log.resources_stolen.tellerium.toLocaleString()} Tellerium, {log.resources_stolen.krypton.toLocaleString()} Krypton
                      </span>
                    </div>
                  )}
                  {log.planet_captured && (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-purple-500">
                        Planet Captured
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.attacker_empire_name} captured {log.planet_coordinate}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Combat Duration:</span>
                    <span className="text-sm text-muted-foreground">{log.rounds} round{log.rounds !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

