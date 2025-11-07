import { useMemo } from 'react'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
import { useGetMyResearchQuery, useGetResearchDefinitionsQuery } from '@/api/endpoints/researchApi'
import { calculateTechTreeProgress, TechTreeProgress } from '@/lib/techTreeUtils'
import { cn } from '@/lib/utils'

interface PlanetTechProgressGaugeProps {
  planetId: number
  size?: number
  className?: string
}

export function PlanetTechProgressGauge({
  planetId,
  size = 200,
  className,
}: PlanetTechProgressGaugeProps) {
  const { data: buildableItems } = useGetBuildableItemsQuery(planetId, { skip: !planetId })
  const { data: empireResearchData } = useGetMyResearchQuery() // Empire-wide completed research
  const { data: researchDefinitions } = useGetResearchDefinitionsQuery() // All research definitions

  const progress = useMemo(() => {
    // Use empire-wide completed research for progress calculation
    const completedResearchSlugs = empireResearchData?.completed_research || []
    const allResearch = researchDefinitions?.research || []
    
    // Map research definitions with empire-wide completion status
    const researchWithCompletion = allResearch.map(research => ({
      slug: research.slug,
      completed: completedResearchSlugs.includes(research.slug),
      unlocked: true, // All definitions are "unlocked" (available to see)
    }))

    // Create research data structure for calculation
    const researchData = {
      research: researchWithCompletion,
    }

    return calculateTechTreeProgress(buildableItems, researchData)
  }, [buildableItems, empireResearchData, researchDefinitions])

  const radius = size / 2 - 20
  const strokeWidth = 8
  const centerX = size / 2
  const centerY = size / 2 + 10 // Offset down slightly for semi-circle
  const startAngle = -180 // Start from left
  const endAngle = 0 // End at right (semi-circle)
  
  // Convert angles to radians
  const startAngleRad = (startAngle * Math.PI) / 180
  const endAngleRad = (endAngle * Math.PI) / 180
  
  // Calculate path for full semi-circle
  const x1 = centerX + radius * Math.cos(startAngleRad)
  const y1 = centerY + radius * Math.sin(startAngleRad)
  const x2 = centerX + radius * Math.cos(endAngleRad)
  const y2 = centerY + radius * Math.sin(endAngleRad)
  
  // Calculate path for progress arc
  const progressAngle = startAngle + (endAngle - startAngle) * (progress.overall.percentage / 100)
  const progressAngleRad = (progressAngle * Math.PI) / 180
  const x3 = centerX + radius * Math.cos(progressAngleRad)
  const y3 = centerY + radius * Math.sin(progressAngleRad)
  
  const largeArcFlag = progress.overall.percentage > 50 ? 1 : 0
  
  return (
    <div className={cn('relative', className)} style={{ width: size, height: size / 2 + 20 }}>
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`progress-gradient-${planetId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.7)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 1)" />
          </linearGradient>
        </defs>
        
        {/* Background arc */}
        <path
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Progress arc */}
        {progress.overall.percentage > 0 && (
          <path
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x3} ${y3}`}
            fill="none"
            stroke={`url(#progress-gradient-${planetId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))',
            }}
          />
        )}
      </svg>
      
      {/* Percentage text */}
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center"
        style={{ bottom: '4px' }}
      >
        <div className="text-2xl font-bold text-cyan-400 glow-cyan">
          {Math.round(progress.overall.percentage)}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {progress.overall.unlocked}/{progress.overall.total}
        </div>
      </div>
    </div>
  )
}

