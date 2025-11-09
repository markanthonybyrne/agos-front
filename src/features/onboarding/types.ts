import { ReactNode } from 'react'

export type OnboardingPhase = 'idle' | 'intro' | 'loading' | 'tour' | 'completed'

export interface OnboardingCopySegment {
  id: string
  content: string
  startTimeMs: number
  endTimeMs?: number
}

export interface CinematicConfig {
  videoSrc: string
  audioSrc: string
  copy: OnboardingCopySegment[]
}

export interface GuidedTourStep {
  id: string
  title: string
  description: string
  targetSelector?: string
  render?: () => ReactNode
  requiresAction?: boolean
  route?: string
  focusElement?: () => HTMLElement | null
}

export interface GuidedTourConfig {
  steps: GuidedTourStep[]
  allowSkip: boolean
  resumeEnabled: boolean
}

export interface PlayThemeOptions {
  volume?: number
}

export interface FadeThemeOptions {
  durationMs?: number
}

export interface OnboardingState {
  phase: OnboardingPhase
  intro: {
    started: boolean
    completed: boolean
    skipped: boolean
  }
  loading: {
    progress: number
    phaseLabel?: string
    dataReady: boolean
  }
  tour: {
    active: boolean
    currentIndex: number
    completedSteps: Set<string>
    skipped: boolean
  }
  hasMarkedComplete: boolean
}

export type OnboardingAction =
  | { type: 'START_INTRO' }
  | { type: 'COMPLETE_INTRO' }
  | { type: 'SKIP_INTRO' }
  | { type: 'UPDATE_LOADING'; payload: { progress: number; phaseLabel?: string; dataReady: boolean } }
  | { type: 'BEGIN_TOUR' }
  | { type: 'ADVANCE_TOUR'; payload?: { completedStepId?: string } }
  | { type: 'PREVIOUS_TOUR_STEP' }
  | { type: 'SKIP_TOUR' }
  | { type: 'COMPLETE_TOUR'; payload?: { completedStepId?: string } }
  | { type: 'MARK_COMPLETE' }
  | { type: 'RESET' }

export interface OnboardingContextValue {
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
  cinematic: CinematicConfig
  tour: GuidedTourConfig
  closeOnboarding: (options?: { markComplete?: boolean }) => Promise<void>
  playTheme: (options?: PlayThemeOptions) => Promise<boolean>
  fadeTheme: (options?: FadeThemeOptions) => Promise<void>
  stopTheme: () => void
}

export interface OnboardingExperienceProps {
  isOpen: boolean
  onClose: (options?: { markComplete?: boolean }) => Promise<void> | void
  cinematic: CinematicConfig
  tour: GuidedTourConfig
  autoStart?: boolean
}


