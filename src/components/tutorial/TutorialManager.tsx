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
  
  // Mark body with tutorial active flag for other components to check
  // This must be called before any conditional returns to satisfy React hooks rules
  useEffect(() => {
    if (isActive) {
      document.body.setAttribute('data-tutorial-active', 'true')
    } else {
      document.body.removeAttribute('data-tutorial-active')
    }
    return () => {
      document.body.removeAttribute('data-tutorial-active')
    }
  }, [isActive])
  
  // Handle route requirements - must call before any conditional returns
  useEffect(() => {
    if (!isActive || !currentStepData) {
      return
    }
    
    if (currentStepData.targetRoute) {
      const currentPath = window.location.pathname
      if (currentPath !== currentStepData.targetRoute) {
        console.log('[Tutorial] Navigating to required route:', currentStepData.targetRoute)
        navigate(currentStepData.targetRoute, { replace: true })
      }
    }
  }, [isActive, currentStepData, navigate])
  
  // Don't render if tutorial is not active
  // Note: We allow rendering even if previously completed, since user might have manually restarted
  if (!isActive) {
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

