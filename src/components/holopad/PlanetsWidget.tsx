import { Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatResource } from '@/lib/formatters'
import { getPlanetImage } from '@/lib/planetImages'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { useNavigate } from 'react-router-dom'
import { WidgetWindow } from './WidgetWindow'

interface Planet {
  id: number
  name: string
  type?: {
    slug?: string
    name?: string
  }
  tellerium_balance: number
  krypton_balance: number
}

interface PlanetsWidgetProps {
  planets: Planet[]
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function PlanetsWidget({ planets, onMinimize, onClose, isMinimized }: PlanetsWidgetProps) {
  const navigate = useNavigate()

  return (
    <WidgetWindow
      title="Planets"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-green/20"
    >
        <div className="space-y-2">
          {planets.slice(0, 5).map((planet) => (
            <div key={planet.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
              <div className="flex items-center gap-2">
                <img
                  src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
                  alt={planet?.type?.name || 'Planet'}
                  className="w-6 h-6 object-contain flex-shrink-0"
                  style={{ imageRendering: 'auto', display: 'block' }}
                />
                <span>{planet.name}</span>
              </div>
              <div className="flex gap-4 font-mono text-xs items-center">
                <div className="flex items-center gap-1">
                  <img
                    src={getTelleriumImage()}
                    alt="T"
                    className="w-4 h-4 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  <span className="text-tellerium">{formatResource(planet.tellerium_balance || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <img
                    src={getKryptonImage()}
                    alt="K"
                    className="w-4 h-4 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  <span className="text-krypton">{formatResource(planet.krypton_balance || 0)}</span>
                </div>
              </div>
            </div>
          ))}
          {planets.length > 5 && (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/planets')}>
              View {planets.length - 5} more planets... <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
        {planets.length > 0 && (
          <div className="pt-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/planets')} className="w-full">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
    </WidgetWindow>
  )
}

