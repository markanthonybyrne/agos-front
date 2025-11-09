import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CinematicConfig, OnboardingCopySegment } from '../types'
import { useOnboardingContext } from '../OnboardingContext'

interface CinematicIntroProps {
  config: CinematicConfig
  onComplete: () => void
  onSkip: () => void
}

type PlaybackState = 'idle' | 'preparing' | 'playing' | 'blocked' | 'completed'

const playbackLabel: Record<PlaybackState, string> = {
  idle: 'Commence Briefing',
  preparing: 'Preparing…',
  playing: 'Playing',
  blocked: 'Enable Audio',
  completed: 'Replay Briefing',
}

function resolveActiveSegment(timeMs: number, segments: OnboardingCopySegment[]) {
  return segments.find((segment, index) => {
    const startOk = timeMs >= segment.startTimeMs
    const endBoundary =
      segment.endTimeMs ??
      (index < segments.length - 1 ? segments[index + 1].startTimeMs : Number.POSITIVE_INFINITY)
    const endOk = timeMs < endBoundary
    return startOk && endOk
  })
}

export function CinematicIntro({ config, onComplete, onSkip }: CinematicIntroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const themeLeadTimeoutRef = useRef<number | null>(null)
  const { playTheme, fadeTheme } = useOnboardingContext()
  const [playback, setPlayback] = useState<PlaybackState>('idle')
  const [currentTimeMs, setCurrentTimeMs] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [totalDurationMs, setTotalDurationMs] = useState(1)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const themeStartedRef = useRef(false)

  const activeSegment = useMemo(
    () => resolveActiveSegment(currentTimeMs, config.copy),
    [config.copy, currentTimeMs]
  )

  useEffect(() => {
    let frame: number
    const audioEl = audioRef.current

    const step = () => {
      if (audioEl && playback === 'playing') {
        setCurrentTimeMs(audioEl.currentTime * 1000)
      }
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [playback])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return

    const handleEnded = () => {
      setPlayback('completed')
      setHasCompleted(true)
      onComplete()
    }
    const handleLoadedMeta = () => {
      if (Number.isFinite(audioEl.duration)) {
        setTotalDurationMs(Math.max(1, audioEl.duration * 1000))
      }
    }
    const handleCanPlay = () => {
      if (Number.isFinite(audioEl.duration)) {
        setTotalDurationMs(Math.max(1, audioEl.duration * 1000))
      }
    }

    audioEl.addEventListener('ended', handleEnded)
    audioEl.addEventListener('loadedmetadata', handleLoadedMeta)
    audioEl.addEventListener('canplay', handleCanPlay)

    return () => {
      audioEl.removeEventListener('ended', handleEnded)
      audioEl.removeEventListener('loadedmetadata', handleLoadedMeta)
      audioEl.removeEventListener('canplay', handleCanPlay)
    }
  }, [onComplete])

  const attemptPlayback = async () => {
    const videoEl = videoRef.current
    const audioEl = audioRef.current
    if (!videoEl || !audioEl) return

    setPlayback('preparing')
    setHasInteracted(true)
    setMediaError(null)
    themeStartedRef.current = false

    if (themeLeadTimeoutRef.current !== null) {
      window.clearTimeout(themeLeadTimeoutRef.current)
      themeLeadTimeoutRef.current = null
    }

    const startVoicePlayback = async () => {
      try {
        videoEl.currentTime = 0
        audioEl.currentTime = 0
        videoEl.load()
        audioEl.load()
        const playPromises = [videoEl.play(), audioEl.play()]
        await Promise.all(playPromises)
        setPlayback('playing')
        setCurrentTimeMs(0)
        if (!themeStartedRef.current) {
          playTheme({ volume: 0.22 })
            .then((started) => {
              themeStartedRef.current = started
            })
            .catch((err) => {
              console.warn('[Onboarding] Unable to start intro theme after voice playback began.', err)
            })
        }
      } catch (error) {
        console.warn('[Onboarding] Unable to autoplay cinematic intro. Awaiting user interaction.', error)
        setPlayback('blocked')
        setMediaError(
          `${error instanceof Error && error.message.includes('NotSupported')
            ? 'Briefing media could not be loaded.'
            : 'Commander, we could not initialise playback.'} Tap Enable Briefing to try again.`
        )
        await fadeTheme({ durationMs: 600 })
      }
    }

    try {
      const started = await playTheme({ volume: 0.22 })
      themeStartedRef.current = started
    } catch (error) {
      console.warn('[Onboarding] Intro theme could not be started automatically.', error)
    }

    themeLeadTimeoutRef.current = window.setTimeout(() => {
      themeLeadTimeoutRef.current = null
      void startVoicePlayback()
    }, 6000)
  }

  const handlePrimaryAction = async () => {
    if (playback === 'playing') {
      return
    }
    if (playback === 'completed') {
      setHasCompleted(false)
    }
    setMediaError(null)
    await attemptPlayback()
  }

  const handleSkip = () => {
    const audioEl = audioRef.current
    const videoEl = videoRef.current
    audioEl?.pause()
    videoEl?.pause()
    if (themeLeadTimeoutRef.current !== null) {
      window.clearTimeout(themeLeadTimeoutRef.current)
      themeLeadTimeoutRef.current = null
    }
    void fadeTheme({ durationMs: 45000 })
    setPlayback('completed')
    setHasCompleted(true)
    onSkip()
  }

  const renderCopy = () => {
    if (!activeSegment) return null
    return (
      <motion.p
        key={activeSegment.id}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
        className="text-balance text-3xl font-light leading-snug tracking-wide text-white/90 md:text-4xl"
      >
        {activeSegment.content}
      </motion.p>
    )
  }

  useEffect(() => {
    return () => {
      if (themeLeadTimeoutRef.current !== null) {
        window.clearTimeout(themeLeadTimeoutRef.current)
        themeLeadTimeoutRef.current = null
      }
      void fadeTheme({ durationMs: 45000 })
    }
  }, [fadeTheme])

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={config.videoSrc}
        preload="auto"
        playsInline
        muted
        onError={() => {
          console.error('[Onboarding] Cinematic video source failed to load.')
          setPlayback('blocked')
          setMediaError('Briefing video is unavailable. Tap Enable Briefing to retry.')
        }}
        onLoadedData={() => {
          if (!hasInteracted) {
            void attemptPlayback()
          }
        }}
      />

      <audio
        ref={audioRef}
        src={config.audioSrc}
        preload="auto"
        onError={() => {
          console.error('[Onboarding] Cinematic audio source failed to load.')
          setPlayback('blocked')
          setMediaError('Briefing audio is unavailable. Tap Enable Briefing to retry.')
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/65 to-black/85" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center md:px-14">
        <div className="flex flex-col items-center gap-6">
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.5em' }}
            animate={{ opacity: 0.45, letterSpacing: '1.2em' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="text-xs uppercase tracking-[1.2em] text-white/60"
          >
            ASTRALUS COMMAND
          </motion.span>

          <AnimatePresence mode="wait">{renderCopy()}</AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={playback === 'playing'}
            className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {playbackLabel[playback]}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs uppercase tracking-[0.4em] text-white/50 transition hover:text-white/80"
          >
            Skip
          </button>
        </div>

        {mediaError && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-xl rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white/60 backdrop-blur"
          >
            {mediaError}
          </motion.div>
        )}

        <div className="h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{
              width: hasCompleted
                ? '100%'
                : `${Math.min(100, Math.max(0, (currentTimeMs / totalDurationMs) * 100))}%`,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}


