import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { useNavigate } from 'react-router-dom'
import { nextStep, previousStep, skipTutorial, completeTutorial } from '@/app/slices/tutorialSlice'
import { getAllSteps, getStepByOrder, getTotalSteps, TutorialStep } from '@/config/tutorialSteps'
import { TutorialModal } from './TutorialModal'
import { TutorialSpotlight } from './TutorialSpotlight'

export function TutorialManager() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isActive = useAppSelector((state) => state.tutorial.isActive)
  const currentStep = useAppSelector((state) => state.tutorial.currentStep)
  const isTutorialCompleted = useAppSelector((state) => state.tutorial.isTutorialCompleted)
  
  const steps = getAllSteps()
  const totalSteps = getTotalSteps()
  const currentStepData = getStepByOrder(currentStep)
  
  // Handle route requirements - must call before any conditional returns
  useEffect(() => {
    if (!isActive || isTutorialCompleted || !currentStepData) {
      return
    }
    
    if (currentStepData.targetRoute) {
      const currentPath = window.location.pathname
      if (currentPath !== currentStepData.targetRoute) {
        navigate(currentStepData.targetRoute, { replace: true })
      }
    }
  }, [isActive, isTutorialCompleted, currentStepData, navigate])
  
  // Don't render if tutorial is not active or already completed
  if (!isActive || isTutorialCompleted) {
    return null
  }
  
  if (!currentStepData) {
    // Invalid step, complete tutorial
    dispatch(completeTutorial())
    return null
  }
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      dispatch(nextStep())
    } else {
      dispatch(completeTutorial())
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      dispatch(previousStep())
    }
  }
  
  const handleSkip = () => {
    dispatch(skipTutorial())
  }
  
  const handleClose = () => {
    dispatch(skipTutorial())
  }
  
  // Render appropriate component based on step type
  if (currentStepData.type === 'highlight') {
    return (
      <TutorialSpotlight
        isActive={isActive}
        step={currentStepData}
        currentStepIndex={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onSkip={handleSkip}
        onClose={handleClose}
      />
    )
  }
  
  return (
    <TutorialModal
      isOpen={isActive}
      step={currentStepData}
      currentStepIndex={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      onClose={handleClose}
    />
  )
}

