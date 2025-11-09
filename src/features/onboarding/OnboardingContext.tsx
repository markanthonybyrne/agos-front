import { createContext, useContext, useMemo, useReducer } from 'react'
import {
  CinematicConfig,
  FadeThemeOptions,
  GuidedTourConfig,
  OnboardingAction,
  OnboardingContextValue,
  OnboardingExperienceProps,
  OnboardingPhase,
  OnboardingState,
  PlayThemeOptions,
} from './types'

const INITIAL_STATE: OnboardingState = {
  phase: 'idle',
  intro: {
    started: false,
    completed: false,
    skipped: false,
  },
  loading: {
    progress: 0,
    dataReady: false,
  },
  tour: {
    active: false,
    currentIndex: 0,
    completedSteps: new Set(),
    skipped: false,
  },
  hasMarkedComplete: false,
}

function derivePhase(state: OnboardingState): OnboardingPhase {
  if (state.hasMarkedComplete) return 'completed'
  if (state.tour.active) return 'tour'
  if (state.intro.started && !state.intro.completed && !state.intro.skipped) return 'intro'
  if (!state.loading.dataReady) return 'loading'
  if (state.intro.completed || state.intro.skipped) {
    if (!state.tour.skipped && state.tour.completedSteps.size === 0) {
      return 'tour'
    }
  }
  return state.phase
}

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'START_INTRO': {
      const next: OnboardingState = {
        ...state,
        phase: 'intro',
        intro: {
          started: true,
          completed: false,
          skipped: false,
        },
      }
      return next
    }
    case 'COMPLETE_INTRO': {
      const next: OnboardingState = {
        ...state,
        intro: {
          started: true,
          completed: true,
          skipped: false,
        },
      }
      next.phase = derivePhase(next)
      return next
    }
    case 'SKIP_INTRO': {
      const next: OnboardingState = {
        ...state,
        intro: {
          started: state.intro.started || true,
          completed: false,
          skipped: true,
        },
      }
      next.phase = derivePhase(next)
      return next
    }
    case 'UPDATE_LOADING': {
      const next: OnboardingState = {
        ...state,
        loading: {
          progress: action.payload.progress,
          phaseLabel: action.payload.phaseLabel,
          dataReady: action.payload.dataReady,
        },
      }
      next.phase = next.loading.dataReady ? derivePhase(next) : 'loading'
      return next
    }
    case 'BEGIN_TOUR': {
      const next: OnboardingState = {
        ...state,
        phase: 'tour',
        tour: {
          ...state.tour,
          currentIndex: 0,
          active: true,
          skipped: false,
        },
      }
      return next
    }
    case 'ADVANCE_TOUR': {
      const completedSteps = new Set(state.tour.completedSteps)
      if (action.payload?.completedStepId) {
        completedSteps.add(action.payload.completedStepId)
      }
      const nextIndex = state.tour.currentIndex + 1
      const next: OnboardingState = {
        ...state,
        tour: {
          ...state.tour,
          currentIndex: nextIndex,
          completedSteps,
        },
      }
      return next
    }
    case 'PREVIOUS_TOUR_STEP': {
      const prevIndex = Math.max(0, state.tour.currentIndex - 1)
      return {
        ...state,
        tour: {
          ...state.tour,
          currentIndex: prevIndex,
        },
      }
    }
    case 'SKIP_TOUR': {
      const completedSteps = new Set(state.tour.completedSteps)
      completedSteps.add('__skipped__')
      return {
        ...state,
        phase: state.loading.dataReady ? 'completed' : 'loading',
        tour: {
          ...state.tour,
          active: false,
          skipped: true,
          completedSteps,
        },
      }
    }
    case 'COMPLETE_TOUR': {
      const completedSteps = new Set(state.tour.completedSteps)
      if (action.payload?.completedStepId) {
        completedSteps.add(action.payload.completedStepId)
      }
      completedSteps.add('__completed__')
      return {
        ...state,
        phase: 'completed',
        tour: {
          ...state.tour,
          active: false,
          completedSteps,
        },
      }
    }
    case 'MARK_COMPLETE': {
      return {
        ...state,
        phase: 'completed',
        hasMarkedComplete: true,
      }
    }
    case 'RESET': {
      return { ...INITIAL_STATE }
    }
    default:
      return state
  }
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

interface OnboardingProviderProps
  extends Pick<OnboardingExperienceProps, 'cinematic' | 'tour' | 'onClose'> {
  children: React.ReactNode
  themeControls?: {
    playTheme: (options?: PlayThemeOptions) => Promise<boolean>
    fadeTheme: (options?: FadeThemeOptions) => Promise<void>
    stopTheme: () => void
  }
}

export function OnboardingProvider({
  children,
  cinematic,
  tour,
  onClose,
  themeControls,
}: OnboardingProviderProps) {
  const [state, dispatch] = useReducer(onboardingReducer, INITIAL_STATE)

  const value = useMemo<OnboardingContextValue>(() => {
    const normalizedPhase = derivePhase(state)
    return {
      state: { ...state, phase: normalizedPhase },
      dispatch,
      cinematic,
      tour,
      closeOnboarding: async (options) => {
        dispatch({ type: 'MARK_COMPLETE' })
        await onClose({ markComplete: options?.markComplete ?? true })
      },
      playTheme: themeControls?.playTheme ?? (async () => false),
      fadeTheme: themeControls?.fadeTheme ?? (async () => undefined),
      stopTheme: themeControls?.stopTheme ?? (() => {}),
    }
  }, [cinematic, onClose, state, themeControls, tour])

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider')
  }
  return context
}


