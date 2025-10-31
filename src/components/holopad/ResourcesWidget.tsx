import { Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatResource } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { useNavigate } from 'react-router-dom'
import { WidgetWindow } from './WidgetWindow'

interface ResourcesWidgetProps {
  totalTellerium: number
  totalKrypton: number
  productionTellerium: number
  productionKrypton: number
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function ResourcesWidget({
  totalTellerium,
  totalKrypton,
  productionTellerium,
  productionKrypton,
  onMinimize,
  onClose,
  isMinimized
}: ResourcesWidgetProps) {
  const navigate = useNavigate()

  return (
    <WidgetWindow
      title="Resource Overview"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-yellow/20"
    >
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-card rounded-lg border border-border flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-tellerium">Tellerium</span>
                <Badge variant="outline" className="text-tellerium border-tellerium">
                  {formatResource(totalTellerium)}
                </Badge>
              </div>
              <p className="text-xl font-bold text-tellerium">
                {formatResource(totalTellerium)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{formatResource(productionTellerium)}/tick
              </p>
            </div>
            <img
              src={getTelleriumImage()}
              alt="Tellerium"
              className="w-16 h-16 object-contain flex-shrink-0"
              style={{ imageRendering: 'auto' }}
            />
          </div>
          <div className="p-4 bg-card rounded-lg border border-border flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-krypton">Krypton</span>
                <Badge variant="outline" className="text-krypton border-krypton">
                  {formatResource(totalKrypton)}
                </Badge>
              </div>
              <p className="text-xl font-bold text-krypton">
                {formatResource(totalKrypton)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{formatResource(productionKrypton)}/tick
              </p>
            </div>
            <img
              src={getKryptonImage()}
              alt="Krypton"
              className="w-16 h-16 object-contain flex-shrink-0"
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </div>
        <div className="pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/planets')} className="w-full">
            Manage <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
    </WidgetWindow>
  )
}

