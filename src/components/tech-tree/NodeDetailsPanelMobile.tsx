import { NodeDetailsPanel } from './NodeDetailsPanel'
import { TechNodeData } from '@/types/tech-tree.types'

interface NodeDetailsPanelMobileProps {
  node: TechNodeData | null
  onClose: () => void
  onQueue?: (nodeId: string) => void
  onViewPath?: (nodeId: string) => void
  onJumpToNode?: (nodeId: string) => void
}

/**
 * Mobile-optimized bottom sheet variant of NodeDetailsPanel
 */
export function NodeDetailsPanelMobile({
  node,
  onClose,
  onQueue,
  onViewPath,
  onJumpToNode,
}: NodeDetailsPanelMobileProps) {
  return (
    <>
      {/* Backdrop */}
      {node && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Bottom Sheet */}
      <NodeDetailsPanel
        node={node}
        onClose={onClose}
        onQueue={onQueue}
        onViewPath={onViewPath}
        onJumpToNode={onJumpToNode}
        isMobile={true}
        className="bottom-0 top-auto rounded-t-xl border-t border-b-0"
      />
    </>
  )
}
