import { ReactNode } from 'react'
import { TutorialStep } from '@/config/tutorialSteps'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { cn } from '@/lib/utils'

interface TutorialStepContentProps {
  step: TutorialStep
  className?: string
}

export function TutorialStepContent({ step, className }: TutorialStepContentProps) {
  const Icon = step.icon
  
  const renderContent = (): ReactNode => {
    if (Array.isArray(step.content)) {
      return (
        <div className="space-y-3">
          {step.content.map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      )
    }
    
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        {step.content}
      </p>
    )
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {Icon && (
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <Icon className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {renderContent()}
      </div>
      
      {/* Resource examples for relevant steps */}
      {(step.id.includes('resource') || step.id.includes('building')) && (
        <div className="pt-4 border-t border-border/50 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <img src={getTelleriumImage()} alt="Tellerium" className="w-6 h-6" style={{ imageRendering: 'auto' }} />
            <span className="text-xs font-medium text-tellerium">Tellerium</span>
          </div>
          <div className="flex items-center gap-2">
            <img src={getKryptonImage()} alt="Krypton" className="w-6 h-6" style={{ imageRendering: 'auto' }} />
            <span className="text-xs font-medium text-krypton">Krypton</span>
          </div>
        </div>
      )}
    </div>
  )
}

