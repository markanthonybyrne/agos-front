import { useState } from 'react'
import { useListCombatsQuery, useDeleteCombatMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { AdminCombat } from '@/types/api.types'
import { Trash2, Eye, Sword, Shield } from 'lucide-react'
import { formatDate, formatDateTime, formatNumber } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'

export function CombatManagement() {
  const [page, setPage] = useState(1)
  const [tickFilter, setTickFilter] = useState<number | undefined>(undefined)
  const [selectedCombat, setSelectedCombat] = useState<AdminCombat | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const { data, isLoading } = useListCombatsQuery({
    page,
    per_page: 25,
    tick_number: tickFilter,
  })

  const [deleteCombat] = useDeleteCombatMutation()

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this combat log?')) return
    try {
      await deleteCombat(id).unwrap()
      toast.success('Combat log deleted')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed')
    }
  }

  const handleView = (combat: AdminCombat) => {
    setSelectedCombat(combat)
    setDetailDialogOpen(true)
  }

  // Helper to get participant info
  const getParticipantInfo = (combat: AdminCombat) => {
    const attacker = combat.participants.find(p => p.type === 'fleet')
    const defender = combat.participants.find(p => p.type === 'planet')
    const planetParticipant = combat.participants.find(p => p.type === 'planet')
    
    return {
      attacker: attacker ? { empire_id: attacker.empire_id, fleet_id: attacker.fleet_id } : null,
      defender: defender || planetParticipant ? { empire_id: (defender || planetParticipant)?.empire_id, planet_id: planetParticipant?.planet_id } : null,
      attackerShips: attacker?.ships || {},
      defenderDefences: defender?.defences || (Array.isArray(planetParticipant?.defences) ? {} : planetParticipant?.defences || {}),
      winnerId: combat.result.winner_empire_id,
    }
  }

  const columns: Column<AdminCombat>[] = [
    { key: 'id', header: 'ID', accessor: (c) => <span className="font-mono">{c.id}</span> },
    { key: 'tick', header: 'Tick', accessor: (c) => <span className="font-mono font-bold">{c.tick_number}</span> },
    {
      key: 'location',
      header: 'Location',
      accessor: (c) => (
        <div>
          <div className="font-mono text-sm">{formatCoordinate(`${c.location_quadrant}:${c.location_sector}:${c.location_galaxy}:${c.location_planet}`)}</div>
        </div>
      ),
    },
    {
      key: 'participants',
      header: 'Participants',
      accessor: (c) => {
        const info = getParticipantInfo(c)
        const attackerEmp = info.attacker
        const defenderEmp = info.defender
        return (
          <div className="space-y-1">
            {attackerEmp && (
              <div className="text-sm">
                <span className="text-orange-400">Attacker:</span> Empire {attackerEmp.empire_id}
              </div>
            )}
            {defenderEmp && (
              <div className="text-sm">
                <span className="text-blue-400">Defender:</span> Empire {defenderEmp.empire_id}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'result',
      header: 'Result',
      accessor: (c) => {
        const info = getParticipantInfo(c)
        const attackerWon = info.attacker && info.winnerId === info.attacker.empire_id
        return (
          <div className="space-y-1">
            <Badge variant={attackerWon ? 'default' : 'destructive'}>
              {attackerWon ? 'Attacker Won' : 'Defender Won'}
            </Badge>
            {c.result.planets_captured && c.result.planets_captured.length > 0 && (
              <Badge variant="outline" className="block mt-1">Planet Captured</Badge>
            )}
          </div>
        )
      },
    },
    { key: 'date', header: 'Date', accessor: (c) => <span className="text-sm">{formatDate(c.created_at)}</span> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Combat Management</h2>
        <p className="text-muted-foreground">View and manage combat logs</p>
      </div>

      <Input
        type="number"
        placeholder="Filter by Tick Number (leave empty for all)"
        value={tickFilter || ''}
        onChange={(e) => {
          setTickFilter(e.target.value ? Number(e.target.value) : undefined)
          setPage(1)
        }}
        className="max-w-md"
      />

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyMessage="No combat logs found"
        rowActions={(combat) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleView(combat)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(combat.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      />

      {/* Combat Detail Dialog */}
      {selectedCombat && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Combat Report #{selectedCombat.id}</DialogTitle>
              <DialogDescription>
                Tick {selectedCombat.tick_number} • {formatDateTime(selectedCombat.created_at)}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="forces">Forces</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedCombat.participants.filter(p => p.type === 'fleet').map((attacker, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sword className="w-5 h-5 text-orange-400" />
                          Attacker (Empire {attacker.empire_id})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm text-muted-foreground">Fleet ID</div>
                            <div className="font-medium">{attacker.fleet_id}</div>
                          </div>
                          {selectedCombat.result.winner_empire_id === attacker.empire_id && (
                            <Badge variant="default">Winner</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {selectedCombat.participants.filter(p => p.type === 'planet').map((defender, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Shield className="w-5 h-5 text-blue-400" />
                          Defender (Empire {defender.empire_id})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm text-muted-foreground">Planet ID</div>
                            <div className="font-medium">{defender.planet_id}</div>
                          </div>
                          {selectedCombat.result.winner_empire_id === defender.empire_id && (
                            <Badge variant="default">Winner</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Battle Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Coordinate</div>
                        <div className="font-mono font-medium">
                          {formatCoordinate(`${selectedCombat.location_quadrant}:${selectedCombat.location_sector}:${selectedCombat.location_galaxy}:${selectedCombat.location_planet}`)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="forces" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedCombat.participants.filter(p => p.type === 'fleet').map((attacker, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle>Attacker Forces</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {attacker.ships && Object.keys(attacker.ships).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(attacker.ships).map(([ship, count]) => (
                              <div key={ship} className="flex justify-between text-sm">
                                <span className="capitalize">{ship.replace(/_/g, ' ')}</span>
                                <span className="font-mono">{count}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No ships recorded</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {selectedCombat.participants.filter(p => p.type === 'planet').map((defender, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle>Defender Forces</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {defender.defences && 
                         !Array.isArray(defender.defences) && 
                         Object.keys(defender.defences).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(defender.defences).map(([defence, count]) => (
                              <div key={defence} className="flex justify-between text-sm">
                                <span className="capitalize">{defence.replace(/_/g, ' ')}</span>
                                <span className="font-mono">{count}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No defences</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="results" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Battle Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Winner</div>
                      <div className="font-medium">Empire {selectedCombat.result.winner_empire_id}</div>
                    </div>

                    {selectedCombat.result.planets_captured && selectedCombat.result.planets_captured.length > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Planets Captured</div>
                        <div className="space-y-1">
                          {selectedCombat.result.planets_captured.map((capture: any, idx: number) => (
                            <Badge key={idx} variant="default" className="mr-2">
                              Planet {capture}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCombat.result.ships_lost && selectedCombat.result.ships_lost.length > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Ships Lost</div>
                        <div className="space-y-1">
                          {selectedCombat.result.ships_lost.map((loss: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              {JSON.stringify(loss)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCombat.result.facilities_destroyed && selectedCombat.result.facilities_destroyed.length > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Facilities Destroyed</div>
                        <div className="space-y-1">
                          {selectedCombat.result.facilities_destroyed.map((facility: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              {JSON.stringify(facility)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
