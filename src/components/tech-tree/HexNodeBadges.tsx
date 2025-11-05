import { motion } from 'framer-motion'
import { TechNodeData } from '@/types/tech-tree.types'
import { cn } from '@/lib/utils'

interface HexNodeBadgesProps {
  node: TechNodeData
  size: number
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
function formatCost(cost: number): string {
  if (cost >= 1000000000) {
    return `${(cost / 1000000000).toFixed(1)}B`
  }
  if (cost >= 1000000) {
    return `${(cost / 1000000).toFixed(1)}M`
  }
  if (cost >= 1000) {
    return `${(cost / 1000).toFixed(1)}K`
  }
  return cost.toString()
}

export function HexNodeBadges({ node, size }: HexNodeBadgesProps) {
  const badgeSize = Math.max(16, size * 0.2)
  const badgeOffset = size * 0.35 // Distance from center
  
  return (
    <>
      {/* Era Badge - Top */}
      {node.era && (
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className={cn(
              'rounded-full bg-primary/80 text-primary-foreground text-xs font-bold',
              'flex items-center justify-center border border-primary/50',
              'shadow-[0_0_8px_rgba(6,182,212,0.6)]'
            )}
            style={{ width: badgeSize, height: badgeSize }}
          >
            {node.era}
          </div>
        </motion.div>
      )}
      
      {/* Cost Badges - Bottom corners */}
      {node.costs && (
        <>
          {/* Tellerium Cost - Bottom Left */}
          {node.costs.tellerium !== undefined && node.costs.tellerium > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 z-30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className={cn(
                  'rounded-full bg-tellerium/80 text-white text-[10px] font-bold',
                  'flex items-center justify-center border border-tellerium/50',
                  'shadow-[0_0_6px_rgba(235,94,156,0.6)]',
                  'px-1'
                )}
                style={{ minWidth: badgeSize, height: badgeSize }}
                title={`${node.costs.tellerium.toLocaleString()} Tellerium`}
              >
                {formatCost(node.costs.tellerium)}T
              </div>
            </motion.div>
          )}
          
          {/* Krypton Cost - Bottom Right */}
          {node.costs.krypton !== undefined && node.costs.krypton > 0 && (
            <motion.div
              className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 z-30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div
                className={cn(
                  'rounded-full bg-krypton/80 text-white text-[10px] font-bold',
                  'flex items-center justify-center border border-krypton/50',
                  'shadow-[0_0_6px_rgba(122,20,140,0.6)]',
                  'px-1'
                )}
                style={{ minWidth: badgeSize, height: badgeSize }}
                title={`${node.costs.krypton.toLocaleString()} Krypton`}
              >
                {formatCost(node.costs.krypton)}K
              </div>
            </motion.div>
          )}
          
          {/* Research Points - Top Left (if applicable) */}
          {node.costs.research_points !== undefined && node.costs.research_points > 0 && (
            <motion.div
              className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div
                className={cn(
                  'rounded-full bg-purple-600/80 text-white text-[10px] font-bold',
                  'flex items-center justify-center border border-purple-400/50',
                  'shadow-[0_0_6px_rgba(147,51,234,0.6)]',
                  'px-1'
                )}
                style={{ minWidth: badgeSize, height: badgeSize }}
                title={`${node.costs.research_points.toLocaleString()} Research Points`}
              >
                {formatCost(node.costs.research_points)}RP
              </div>
            </motion.div>
          )}
        </>
      )}
      
      {/* Queue Position - Top Right (if queued) */}
      {node.queuePosition !== undefined && node.queuePosition > 0 && (
        <motion.div
          className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 z-30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div
            className={cn(
              'rounded-full bg-yellow-500/80 text-yellow-900 text-xs font-bold',
              'flex items-center justify-center border border-yellow-400/50',
              'shadow-[0_0_6px_rgba(234,179,8,0.6)]'
            )}
            style={{ width: badgeSize, height: badgeSize }}
            title={`Queue position: ${node.queuePosition}`}
          >
            #{node.queuePosition}
          </div>
        </motion.div>
      )}
      
      {/* Specialization Icon - Side (if not general) */}
      {node.specialization && node.specialization !== 'general' && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div
            className={cn(
              'rounded-full bg-background/80 text-foreground text-xs',
              'flex items-center justify-center border border-cyan-500/50',
              'shadow-[0_0_6px_rgba(6,182,212,0.4)]'
            )}
            style={{ width: badgeSize * 0.9, height: badgeSize * 0.9 }}
            title={node.specialization}
          >
            <span className="text-[10px] font-bold uppercase">
              {node.specialization.charAt(0)}
            </span>
          </div>
        </motion.div>
      )}
    </>
  )
}
