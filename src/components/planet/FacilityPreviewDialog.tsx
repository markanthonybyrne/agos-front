import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { usePreviewFacilityQuery } from '@/api/endpoints/facilitiesApi'
import { formatNumber } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { FacilityDefinition } from '@/types/api.types'

interface FacilityPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planetId: number
  facility: FacilityDefinition | null
}

export function FacilityPreviewDialog({
  open,
  onOpenChange,
  planetId,
  facility,
}: FacilityPreviewDialogProps) {
  const { data: preview, isLoading, error } = usePreviewFacilityQuery(
    {
      planetId,
      facilitySlug: facility?.slug || '',
    },
    {
      skip: !open || !facility?.slug,
    }
  )

  if (!facility) return null

  const hasUpkeep = preview?.projected_upkeep && (
    preview.projected_upkeep.tellerium_per_tick > 0 ||
    preview.projected_upkeep.krypton_per_tick > 0
  )

  const hasNegativeNet = preview?.net_production && (
    preview.net_production.tellerium_per_tick < 0 ||
    preview.net_production.krypton_per_tick < 0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="panel-glass surface-gradient card-glow border-cyan/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Facility Preview: {facility.name}</DialogTitle>
          <DialogDescription>
            Preview projected production and upkeep with research multipliers applied
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">
              Failed to load preview data
            </span>
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            {/* Applied Multipliers */}
            {Object.keys(preview.applied_multipliers).length > 0 && (
              <Card className="border-cyan/20">
                <CardContent className="pt-4">
                  <h4 className="text-sm font-semibold mb-2">Applied Research Multipliers:</h4>
                  <div className="space-y-1">
                    {Object.entries(preview.applied_multipliers).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                        </span>
                        <Badge variant="outline" className="text-green-400 border-green-500/30">
                          {value > 1 ? '+' : ''}{((value - 1) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projected Production */}
            <Card className="border-green/20">
              <CardContent className="pt-4">
                <h4 className="text-sm font-semibold mb-2 text-green-400">Projected Production:</h4>
                <div className="space-y-2">
                  {preview.projected_production.tellerium_per_tick > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={getTelleriumImage()}
                          alt="T"
                          className="w-4 h-4 object-contain"
                          style={{ imageRendering: 'auto' }}
                        />
                        <span className="text-tellerium">Tellerium:</span>
                      </div>
                      <span className="text-tellerium font-semibold">
                        +{formatNumber(preview.projected_production.tellerium_per_tick)}/tick
                      </span>
                    </div>
                  )}
                  {preview.projected_production.krypton_per_tick > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={getKryptonImage()}
                          alt="K"
                          className="w-4 h-4 object-contain"
                          style={{ imageRendering: 'auto' }}
                        />
                        <span className="text-krypton">Krypton:</span>
                      </div>
                      <span className="text-krypton font-semibold">
                        +{formatNumber(preview.projected_production.krypton_per_tick)}/tick
                      </span>
                    </div>
                  )}
                  {preview.projected_production.dark_matter_per_tick !== undefined &&
                    preview.projected_production.dark_matter_per_tick > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Dark Matter:</span>
                      <span className="text-purple-400 font-semibold">
                        +{formatNumber(preview.projected_production.dark_matter_per_tick)}/tick
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Projected Upkeep */}
            {hasUpkeep && (
              <Card className="border-yellow/20">
                <CardContent className="pt-4">
                  <h4 className="text-sm font-semibold mb-2 text-yellow-400">Projected Upkeep:</h4>
                  <div className="space-y-2">
                    {preview.projected_upkeep.tellerium_per_tick > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={getTelleriumImage()}
                            alt="T"
                            className="w-4 h-4 object-contain"
                            style={{ imageRendering: 'auto' }}
                          />
                          <span className="text-tellerium">Tellerium:</span>
                        </div>
                        <span className="text-yellow-400 font-semibold">
                          -{formatNumber(preview.projected_upkeep.tellerium_per_tick)}/tick
                        </span>
                      </div>
                    )}
                    {preview.projected_upkeep.krypton_per_tick > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={getKryptonImage()}
                            alt="K"
                            className="w-4 h-4 object-contain"
                            style={{ imageRendering: 'auto' }}
                          />
                          <span className="text-krypton">Krypton:</span>
                        </div>
                        <span className="text-yellow-400 font-semibold">
                          -{formatNumber(preview.projected_upkeep.krypton_per_tick)}/tick
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Net Production */}
            <Card className={`border-${hasNegativeNet ? 'destructive' : 'cyan'}/20`}>
              <CardContent className="pt-4">
                <h4 className="text-sm font-semibold mb-2">Net Production:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTelleriumImage()}
                        alt="T"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-tellerium">Tellerium:</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        preview.net_production.tellerium_per_tick >= 0
                          ? 'text-tellerium'
                          : 'text-destructive'
                      }`}
                    >
                      {preview.net_production.tellerium_per_tick >= 0 ? '+' : ''}
                      {formatNumber(preview.net_production.tellerium_per_tick)}/tick
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getKryptonImage()}
                        alt="K"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-krypton">Krypton:</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        preview.net_production.krypton_per_tick >= 0
                          ? 'text-krypton'
                          : 'text-destructive'
                      }`}
                    >
                      {preview.net_production.krypton_per_tick >= 0 ? '+' : ''}
                      {formatNumber(preview.net_production.krypton_per_tick)}/tick
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warnings */}
            {hasNegativeNet && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Warning: Upkeep Exceeds Production
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This facility will consume more resources than it produces. If your planet
                    cannot afford the upkeep, all facilities on this planet will be deactivated.
                  </p>
                </div>
              </div>
            )}

            {!hasNegativeNet && hasUpkeep && (
              <div className="flex items-start gap-2 p-3 bg-yellow/10 border border-yellow/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-400">
                  This facility has upkeep costs. Ensure your planet can maintain the resource balance.
                </p>
              </div>
            )}

            {!hasUpkeep && !hasNegativeNet && (
              <div className="flex items-start gap-2 p-3 bg-green/10 border border-green/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-400">
                  This facility will provide positive net production with no upkeep costs.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

