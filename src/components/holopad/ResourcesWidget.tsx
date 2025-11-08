import { useMemo } from 'react'
import { Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatResource, formatNumber } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { useNavigate } from 'react-router-dom'
import { WidgetWindow } from './WidgetWindow'
import { SecondaryLedgerCard } from '@/components/resources/SecondaryLedgerCard'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'
import { useAppSelector } from '@/app/hooks'
import { selectEmpireSecondaryCapacity, selectEmpireSecondaryCapacityBonus, selectEmpireSecondaryCapacityUsed } from '@/app/selectors/resourceSelectors'
import { usePanel } from '@/components/common/PanelManager'
import { PanelSize, PanelType } from '@/app/slices/panelSlice'
import { cn } from '@/lib/utils'

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
  const { openPanel } = usePanel()
  const { ledger } = useResourcesCatalog()
  const secondaryCapacity = useAppSelector(selectEmpireSecondaryCapacity)
  const secondaryUsed = useAppSelector(selectEmpireSecondaryCapacityUsed)
  const capacityBonus = useAppSelector(selectEmpireSecondaryCapacityBonus)
  const recentDelta = useAppSelector((state) => state.game.secondaryResourceDelta)
  const activeBoosters = useAppSelector((state) => state.auth.empire?.active_boosters || [])

  const hasSecondaryBooster = useMemo(() => {
    if (!activeBoosters) return false
    return activeBoosters.some(
      (booster: any) =>
        booster?.type === 'secondary_extraction' || booster?.booster_type === 'secondary_extraction',
    )
  }, [activeBoosters])

  const totalSecondaryStored = useMemo(() => {
    return ledger.reduce((sum, entry) => sum + (entry.quantity || 0), 0)
  }, [ledger])

  const showSecondaryCard = secondaryCapacity > 0 || totalSecondaryStored > 0

  return (
    <WidgetWindow
      title="Resource Overview"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-yellow/20"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResourceSummaryCard
            label="Tellerium"
            total={totalTellerium}
            production={productionTellerium}
            badgeClass="text-tellerium border-tellerium"
            textClass="text-tellerium"
            imageSrc={getTelleriumImage()}
          />
          <ResourceSummaryCard
            label="Krypton"
            total={totalKrypton}
            production={productionKrypton}
            badgeClass="text-krypton border-krypton"
            textClass="text-krypton"
            imageSrc={getKryptonImage()}
          />
        </div>

        {showSecondaryCard && (
          <SecondaryLedgerCard
            ledger={ledger}
            totalCapacity={secondaryCapacity}
            usedCapacity={secondaryUsed}
            capacityBonusPercent={capacityBonus}
            recentDelta={recentDelta}
            isBoosted={hasSecondaryBooster}
            onUpgradeClick={() => openPanel(PanelType.BOOSTERS, PanelSize.MEDIUM)}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="text-xs text-muted-foreground">
            Total Primary Stocks:{' '}
            <span className="font-semibold text-foreground">
              {formatNumber(totalTellerium + totalKrypton)}
            </span>
          </div>
          {showSecondaryCard && (
            <div className="text-xs text-muted-foreground">
              Materials Stored:{' '}
              <span className="font-semibold text-foreground">
                {formatNumber(totalSecondaryStored)}
              </span>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/planets')} className="w-full">
          Manage <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </WidgetWindow>
  )
}

interface ResourceSummaryCardProps {
  label: string
  total: number
  production: number
  badgeClass: string
  textClass: string
  imageSrc: string
}

function ResourceSummaryCard({
  label,
  total,
  production,
  badgeClass,
  textClass,
  imageSrc,
}: ResourceSummaryCardProps) {
  return (
    <div className="glass-section border-border/50 p-4 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-sm', textClass)}>{label}</span>
          <Badge variant="outline" className={badgeClass}>
            {formatResource(total)}
          </Badge>
        </div>
        <p className={cn('text-xl font-bold', textClass)}>{formatResource(total)}</p>
        <p className="text-xs text-muted-foreground mt-1">+{formatResource(production)}/tick</p>
      </div>
      <img
        src={imageSrc}
        alt={label}
        className="w-16 h-16 object-contain flex-shrink-0"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  )
}


