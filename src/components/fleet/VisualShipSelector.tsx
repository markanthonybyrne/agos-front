import { useState } from 'react'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useGetPlanetShipsQuery } from '@/api/endpoints/shipsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ship, Plus, Minus, Zap } from 'lucide-react'
import { getShipImage } from '@/lib/shipImages'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { formatResource } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'

interface VisualShipSelectorProps {
  planetId: number
  selectedShips: Record<string, number>
  onChange: (ships: Record<string, number>) => void
}

export function VisualShipSelector({
  planetId,
  selectedShips,
  onChange,
}: VisualShipSelectorProps) {
  const { data: shipDefinitions, isLoading: isLoadingDefs } =
    useGetShipDefinitionsQuery()
  const { data: planetShipsData, isLoading: isLoadingShips } =
    useGetPlanetShipsQuery(planetId, { skip: !planetId })

  // Get available ships on this planet
  const availableShips =
    planetShipsData && (planetShipsData as any)?.ships
      ? ((planetShipsData as any).ships as any[])
          .map((ship: any) => {
            const shipDef = shipDefinitions?.ships?.find(
              (s) => s.id === ship.definition_id
            )
            return {
              id: ship.definition_id,
              slug: shipDef?.slug || `ship_${ship.definition_id}`,
              name: shipDef?.name || `Ship #${ship.definition_id}`,
              quantity: ship.quantity || 0,
              image: shipDef?.slug ? getShipImage(shipDef.slug) : undefined,
            }
          })
          .filter((ship) => ship.quantity > 0)
      : []

  const handleQuantityChange = (shipSlug: string, delta: number) => {
    const currentQty = selectedShips[shipSlug] || 0
    const availableQty = availableShips.find((s) => s.slug === shipSlug)?.quantity || 0
    const newQty = Math.max(0, Math.min(availableQty, currentQty + delta))
    
    const updated = { ...selectedShips }
    if (newQty === 0) {
      delete updated[shipSlug]
    } else {
      updated[shipSlug] = newQty
    }
    onChange(updated)
  }

  const totalSelected = Object.values(selectedShips).reduce((sum, qty) => sum + qty, 0)

  if (isLoadingDefs || isLoadingShips) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-cyan-400" />
              Fleet Composition
            </div>
            <Badge variant="outline" className="text-xl font-mono px-4 py-1">
              {totalSelected} ships
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Ship grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableShips.map((ship) => {
          const selected = selectedShips[ship.slug] || 0
          const available = ship.quantity
          const shipDef = shipDefinitions?.ships?.find((s) => s.slug === ship.slug)
          const telleriumCost = (shipDef as any)?.tellerium_cost || (shipDef as any)?.cost_tellerium || 0
          const kryptonCost = (shipDef as any)?.krypton_cost || (shipDef as any)?.cost_krypton || 0

          return (
            <Card
              key={ship.id}
              className={`panel-glass border-blue/20 transition-all hover:border-primary/50 ${
                selected > 0 ? 'ring-2 ring-primary/30' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Ship image */}
                  {ship.image ? (
                    <img
                      src={ship.image}
                      alt={ship.name}
                      className="w-24 h-24 object-contain flex-shrink-0"
                      style={{ imageRendering: 'auto' }}
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-blue/10 rounded-lg border border-blue/20">
                      <Ship className="w-12 h-12 text-blue-400" />
                    </div>
                  )}

                  {/* Ship info and controls */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg truncate">{ship.name}</h4>
                    </div>

                    {/* Available badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        Available: {available}
                      </Badge>
                      {(telleriumCost > 0 || kryptonCost > 0) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <img src={getTelleriumImage()} alt="T" className="w-3 h-3" />
                          <span>{formatResource(telleriumCost)}</span>
                          {kryptonCost > 0 && (
                            <>
                              <span className="mx-1">/</span>
                              <img src={getKryptonImage()} alt="K" className="w-3 h-3" />
                              <span>{formatResource(kryptonCost)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(ship.slug, -1)}
                        disabled={selected === 0}
                        className="h-8 w-8"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center font-mono text-xl">
                        {selected}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(ship.slug, 1)}
                        disabled={selected >= available}
                        className="h-8 w-8"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {availableShips.length === 0 && (
        <Card className="panel-glass border-muted/20">
          <CardContent className="pt-6 text-center">
            <Ship className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No Ships Available</p>
            <p className="text-sm text-muted-foreground">
              Build ships on this planet first
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

