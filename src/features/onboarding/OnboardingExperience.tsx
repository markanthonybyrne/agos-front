import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { OnboardingProvider, useOnboardingContext } from './OnboardingContext'
import { FadeThemeOptions, OnboardingExperienceProps, PlayThemeOptions } from './types'
import { CinematicIntro } from './components/CinematicIntro'
import { GuidedTourOverlay } from './components/GuidedTourOverlay'

const introThemeSrc = new URL('../../../assets/audio/intro.mp3', import.meta.url).href

function OnboardingContent({ autoStart = true }: { autoStart?: boolean }) {
  const { state, dispatch, closeOnboarding, cinematic, tour, fadeTheme } = useOnboardingContext()
  const planetsState = useAppSelector((root) => root.planets)
  const navigate = useNavigate()
  const location = useLocation()
  const fadeTimeoutRef = useRef<number | null>(null)

  // Keep loading progress in sync with data loader slice
  useEffect(() => {
    const loaderComplete =
      planetsState.isLoaded ||
      (!planetsState.isLoading && (planetsState.loadingProgress ?? 0) >= 99)

    dispatch({
      type: 'UPDATE_LOADING',
      payload: {
        progress: planetsState.loadingProgress ?? 0,
        phaseLabel: planetsState.loadingPhase ?? undefined,
        dataReady: loaderComplete,
      },
    })
  }, [
    dispatch,
    planetsState.isLoaded,
    planetsState.isLoading,
    planetsState.loadingPhase,
    planetsState.loadingProgress,
  ])

  // Auto start intro when onboarding opens
  useEffect(() => {
    if (autoStart && !state.intro.started) {
      dispatch({ type: 'START_INTRO' })
    }
  }, [autoStart, dispatch, state.intro.started])

  // Toggle body attribute to signal onboarding overlay
  useEffect(() => {
    if (state.phase === 'completed') {
      document.body.removeAttribute('data-onboarding-active')
    } else {
      document.body.setAttribute('data-onboarding-active', 'true')
    }
    return () => {
      document.body.removeAttribute('data-onboarding-active')
    }
  }, [state.phase])

  useEffect(() => {
    if (state.phase === 'completed') {
      fadeTheme({ durationMs: 45000 }).catch(() => undefined)
    }
  }, [fadeTheme, state.phase])

  // Begin tour when intro done & data ready
  useEffect(() => {
    const introComplete = state.intro.completed || state.intro.skipped
    if (
      introComplete &&
      state.loading.dataReady &&
      !state.tour.skipped &&
      !state.hasMarkedComplete &&
      state.phase !== 'tour'
    ) {
      dispatch({ type: 'BEGIN_TOUR' })
    }
  }, [dispatch, state.hasMarkedComplete, state.intro.completed, state.intro.skipped, state.loading.dataReady, state.phase, state.tour.skipped])

  // Finish onboarding automatically once tour completes & data ready
  useEffect(() => {
    if (state.hasMarkedComplete) return
    if (!state.loading.dataReady) return
    const tourDone = !state.tour.active && (state.tour.skipped || state.tour.completedSteps.size > 0)
    if ((state.intro.completed || state.intro.skipped) && tourDone) {
      dispatch({ type: 'MARK_COMPLETE' })
      void closeOnboarding({ markComplete: true })
    }
  }, [
    closeOnboarding,
    dispatch,
    state.hasMarkedComplete,
    state.intro.completed,
    state.intro.skipped,
    state.loading.dataReady,
    state.tour.active,
    state.tour.completedSteps.size,
    state.tour.skipped,
  ])

  // Ensure we are on correct route when a step specifies it
  useEffect(() => {
    if (state.phase !== 'tour') return
    const currentStep = tour.steps[state.tour.currentIndex]
    if (!currentStep?.route) return
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route, { replace: true })
    }
  }, [location.pathname, navigate, state.phase, state.tour.currentIndex, tour.steps])

  const currentTourStep = state.phase === 'tour' ? tour.steps[state.tour.currentIndex] : null
  const totalTourSteps = tour.steps.length

  const handleSkipAll = useCallback(() => {
    dispatch({ type: 'SKIP_INTRO' })
    dispatch({ type: 'SKIP_TOUR' })
    closeOnboarding({ markComplete: true }).catch(() => undefined)
  }, [closeOnboarding, dispatch])

  useEffect(() => {
    if (state.phase !== 'tour' || !currentTourStep) return
    window.dispatchEvent(
      new CustomEvent('astralus:onboarding-tour-step', {
        detail: { stepId: currentTourStep.id, index: state.tour.currentIndex },
      }),
    )
  }, [currentTourStep, state.phase, state.tour.currentIndex])

  useEffect(() => {
    if (state.phase !== 'tour') {
      if (fadeTimeoutRef.current !== null) {
        window.clearTimeout(fadeTimeoutRef.current)
        fadeTimeoutRef.current = null
      }
      return
    }

    fadeTimeoutRef.current = window.setTimeout(() => {
      fadeTheme({ durationMs: 45000 }).catch(() => undefined)
      fadeTimeoutRef.current = null
    }, 5000)

    return () => {
      if (fadeTimeoutRef.current !== null) {
        window.clearTimeout(fadeTimeoutRef.current)
        fadeTimeoutRef.current = null
      }
    }
  }, [fadeTheme, state.phase])

  return (
    <>
      <AnimatePresence>
        {state.phase === 'intro' && (
          <motion.div
            key="astralus-onboarding-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-[1000000]"
          >
            <CinematicIntro
              config={cinematic}
              onComplete={() => dispatch({ type: 'COMPLETE_INTRO' })}
              onSkip={handleSkipAll}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.phase === 'loading' && (
          <motion.div
            key="astralus-onboarding-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-[1000000] flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(36,68,112,0.6),rgba(3,6,12,0.95))]"
          >
            <div className="flex w-full max-w-3xl flex-col items-center gap-8 px-6 text-center text-white/80">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-2xl font-semibold uppercase tracking-[0.4em] text-white/60"
              >
                Initializing Astralus
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                className="text-balance text-lg text-white/70"
              >
                Strategic datasets, planetary telemetry, and fleet matrices are loading in the background.
              </motion.p>
              <div className="flex w-full max-w-xl flex-col gap-3">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500"
                    animate={{
                      width: `${Math.min(100, Math.max(0, state.loading.progress))}%`,
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-xs uppercase tracking-[0.35em] text-white/45">
                  {state.loading.phaseLabel ?? 'Preparing...'} · {Math.round(state.loading.progress)}%
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium uppercase tracking-[0.35em] text-white/70 transition hover:border-white/40 hover:text-white"
                onClick={handleSkipAll}
              >
                Skip Remaining Onboarding
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state.phase === 'tour' && currentTourStep && (
        <GuidedTourOverlay
          step={currentTourStep}
          stepIndex={state.tour.currentIndex}
          totalSteps={totalTourSteps}
          allowPrevious={state.tour.currentIndex > 0}
          onPrevious={() => dispatch({ type: 'PREVIOUS_TOUR_STEP' })}
          onNext={() => {
            if (state.tour.currentIndex >= totalTourSteps - 1) {
              dispatch({ type: 'COMPLETE_TOUR', payload: { completedStepId: currentTourStep.id } })
            } else {
              dispatch({ type: 'ADVANCE_TOUR', payload: { completedStepId: currentTourStep.id } })
            }
          }}
          onSkip={() => dispatch({ type: 'SKIP_TOUR' })}
        />
      )}
    </>
  )
}

export function OnboardingExperience({ isOpen, onClose, cinematic, tour, autoStart }: OnboardingExperienceProps) {
  const themeAudioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRafRef = useRef<number | null>(null)

  const cancelThemeFade = useCallback(() => {
    if (fadeRafRef.current !== null) {
      cancelAnimationFrame(fadeRafRef.current)
      fadeRafRef.current = null
    }
  }, [])

  const playTheme = useCallback(
    async ({ volume = 0.22 }: PlayThemeOptions = {}) => {
      const audio = themeAudioRef.current
      if (!audio) return false

      cancelThemeFade()
      audio.pause()
      try {
        audio.currentTime = 0
      } catch {
        // Some browsers disallow seeking before metadata is available; ignore.
      }
      audio.loop = true
      audio.volume = Math.min(Math.max(volume, 0), 1)

      try {
        const playPromise = audio.play()
        if (playPromise) {
          await playPromise
        }
        return true
      } catch (error) {
        console.warn('[Onboarding] Failed to start intro theme audio', error)
        return false
      }
    },
    [cancelThemeFade],
  )

  const fadeTheme = useCallback(
    async ({ durationMs = 2000 }: FadeThemeOptions = {}) => {
      const audio = themeAudioRef.current
      if (!audio || audio.paused) return

      cancelThemeFade()

      if (durationMs <= 0) {
        audio.pause()
        audio.currentTime = 0
        return
      }

      const startVolume = audio.volume
      const startTime = performance.now()

      await new Promise<void>((resolve) => {
        const step = (now: number) => {
          const elapsed = now - startTime
          const progress = Math.min(1, elapsed / durationMs)
          audio.volume = startVolume * (1 - progress)

          if (progress < 1) {
            fadeRafRef.current = requestAnimationFrame(step)
          } else {
            audio.pause()
            try {
              audio.currentTime = 0
            } catch {
              // Ignore seek errors.
            }
            fadeRafRef.current = null
            resolve()
          }
        }

        fadeRafRef.current = requestAnimationFrame(step)
      })
    },
    [cancelThemeFade],
  )

  const stopTheme = useCallback(() => {
    cancelThemeFade()
    const audio = themeAudioRef.current
    if (!audio) return
    audio.pause()
    try {
      audio.currentTime = 0
    } catch {
      // Ignore seek errors.
    }
  }, [cancelThemeFade])

  useEffect(() => stopTheme, [stopTheme])

  useEffect(() => {
    if (!isOpen) {
      fadeTheme({ durationMs: 45000 })
        .catch(() => undefined)
        .finally(() => {
          stopTheme()
        })
    }
  }, [fadeTheme, isOpen, stopTheme])

  if (!isOpen) {
    return null
  }

  return (
    <OnboardingProvider
      cinematic={cinematic}
      tour={tour}
      onClose={onClose}
      themeControls={{ playTheme, fadeTheme, stopTheme }}
    >
      <audio ref={themeAudioRef} src={introThemeSrc} preload="auto" className="hidden" />
      <OnboardingContent autoStart={autoStart} />
    </OnboardingProvider>
  )
}


