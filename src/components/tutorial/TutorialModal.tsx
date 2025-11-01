import { ReactNode } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomModal } from '@/components/ui/custom-modal'
import { TutorialStep } from '@/config/tutorialSteps'
import { TutorialStepContent } from './TutorialStepContent'
import { cn } from '@/lib/utils'

interface TutorialModalProps {
  isOpen: boolean
  step: TutorialStep
  currentStepIndex: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onClose: () => void
}

export function TutorialModal({
  isOpen,
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onClose,
}: TutorialModalProps) {
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1
  const progress = ((currentStepIndex + 1) / totalSteps) * 100
  
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={step.title}
      description={step.description}
      preventClose={true} // Prevent closing via backdrop/ESC - only via buttons
      zIndex={10000}
      className="p-0"
    >
      {/* Progress bar */}
      <div className="px-6 pt-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground min-w-[60px] text-right">
            {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
        <TutorialStepContent step={step} />
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between gap-3 mt-auto">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Skip Tutorial
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={isLastStep ? onClose : onNext}
            className="gap-2 bg-cyan-600 hover:bg-cyan-700"
          >
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}

