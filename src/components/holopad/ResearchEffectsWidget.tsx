import { WidgetWindow } from './WidgetWindow'
import { ResearchEffectsSummary } from '@/components/research/ResearchEffectsSummary'
import { useGetResearchEffectsQuery } from '@/api/endpoints/researchApi'
import { Skeleton } from '@/components/ui/skeleton'

interface ResearchEffectsWidgetProps {
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function ResearchEffectsWidget({
  onMinimize,
  onClose,
  isMinimized,
}: ResearchEffectsWidgetProps) {
  const { data: effectsSummary, isLoading } = useGetResearchEffectsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  if (isMinimized) {
    return (
      <WidgetWindow
        title="Research Effects"
        onMinimize={onMinimize}
        onClose={onClose}
        isMinimized={isMinimized}
        className="border-green/20"
      >
        <div className="h-16" />
      </WidgetWindow>
    )
  }

  if (isLoading) {
    return (
      <WidgetWindow
        title="Research Effects"
        onMinimize={onMinimize}
        onClose={onClose}
        isMinimized={isMinimized}
        className="border-green/20"
      >
        <Skeleton className="h-32" />
      </WidgetWindow>
    )
  }

  if (!effectsSummary) {
    return null
  }

  return (
    <WidgetWindow
      title="Research Effects"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-green/20"
    >
      <ResearchEffectsSummary effectsSummary={effectsSummary} className="border-0 shadow-none" />
    </WidgetWindow>
  )
}

