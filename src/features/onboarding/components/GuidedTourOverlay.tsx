import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { GuidedTourStep } from '../types'

interface GuidedTourOverlayProps {
  step: GuidedTourStep
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  allowPrevious: boolean
}

type AnnotationPosition = 'top' | 'bottom' | 'left' | 'right' | 'center'

const EDGE_MARGIN = 24
const ESTIMATED_CARD_HEIGHT = 260
const ESTIMATED_CARD_WIDTH = 360

function computeAnnotationPosition(rect: DOMRect | null): AnnotationPosition {
  if (!rect) return 'center'
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const spaceRight = viewportWidth - rect.right
  const spaceLeft = rect.left
  const isWideTarget = rect.width > viewportWidth * 0.6
  const isTallTarget = rect.height > viewportHeight * 0.6

  if (isWideTarget && isTallTarget) {
    return 'center'
  }

  if (isWideTarget) {
    if (spaceBelow >= ESTIMATED_CARD_HEIGHT + EDGE_MARGIN) return 'bottom'
    if (spaceAbove >= ESTIMATED_CARD_HEIGHT + EDGE_MARGIN) return 'top'
  }

  if (spaceBelow >= ESTIMATED_CARD_HEIGHT + EDGE_MARGIN) return 'bottom'
  if (spaceAbove >= ESTIMATED_CARD_HEIGHT + EDGE_MARGIN) return 'top'
  if (spaceRight >= ESTIMATED_CARD_WIDTH + EDGE_MARGIN) return 'right'
  if (spaceLeft >= ESTIMATED_CARD_WIDTH + EDGE_MARGIN) return 'left'
  return spaceBelow >= spaceAbove ? 'bottom' : 'top'
}

const overlayRoot = typeof window !== 'undefined' ? document.body : null

export function GuidedTourOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  allowPrevious,
}: GuidedTourOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [annotationPosition, setAnnotationPosition] = useState<AnnotationPosition>('bottom')
  const rafRef = useRef(0)
  const observerRef = useRef<MutationObserver | null>(null)

  const findTarget = useMemo(() => {
    if (typeof step.focusElement === 'function') {
      return () => step.focusElement?.() ?? null
    }
    if (typeof step.targetSelector === 'string') {
      const selector = step.targetSelector
      return () => document.querySelector(selector) as HTMLElement | null
    }
    return () => null
  }, [step])

useEffect(() => {
  let isActive = true
  let detachCurrent: (() => void) | null = null
  let retryTimer: number | null = null

  const detach = () => {
    if (detachCurrent) {
      detachCurrent()
      detachCurrent = null
    }
  }

  const cleanupRetries = () => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (retryTimer !== null) {
      window.clearInterval(retryTimer)
      retryTimer = null
    }
  }

  const attachToElement = (element: HTMLElement) => {
    detach()

    setTargetElement(element)

    const updatePosition = () => {
      if (!isActive) return
      rafRef.current = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect()
        setTargetRect(rect)
        setAnnotationPosition(computeAnnotationPosition(rect))
      })
    }

    element.classList.add('onboarding-spotlight-target')
    updatePosition()

    const resizeObserver = new ResizeObserver(updatePosition)
    resizeObserver.observe(element)

    const handleWindowUpdate = () => updatePosition()
    window.addEventListener('scroll', handleWindowUpdate, true)
    window.addEventListener('resize', handleWindowUpdate)

    const bodyObserver = new MutationObserver(updatePosition)
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })

    detachCurrent = () => {
      element.classList.remove('onboarding-spotlight-target')
      resizeObserver.disconnect()
      window.removeEventListener('scroll', handleWindowUpdate, true)
      window.removeEventListener('resize', handleWindowUpdate)
      bodyObserver.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }

  const attemptAttach = () => {
    if (!isActive) return false
    const element = findTarget()
    if (element) {
      cleanupRetries()
      attachToElement(element)
      return true
    }

    setTargetElement(null)
    setTargetRect(null)
    setAnnotationPosition('center')
    return false
  }

  if (!attemptAttach()) {
    cleanupRetries()
    observerRef.current = new MutationObserver(() => {
      attemptAttach()
    })
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    retryTimer = window.setInterval(() => {
      if (attemptAttach()) {
        cleanupRetries()
      }
    }, 250)
  }

  return () => {
    isActive = false
    cleanupRetries()
    detach()
  }
}, [findTarget])

  const annotationCoordinates = useMemo(() => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      } as React.CSSProperties
    }

    if (typeof window === 'undefined') {
      return {
        top: targetRect.top,
        left: targetRect.left,
      } as React.CSSProperties
    }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const margin = EDGE_MARGIN
    const softEdge = 140

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

    const maxLeft = viewportWidth - margin - ESTIMATED_CARD_WIDTH
    const maxTop = viewportHeight - margin - ESTIMATED_CARD_HEIGHT

    switch (annotationPosition) {
      case 'center':
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
      case 'bottom':
        {
          const centerX = targetRect.left + targetRect.width / 2
          const rawLeft = clamp(centerX - ESTIMATED_CARD_WIDTH / 2, margin, maxLeft)
          const top = clamp(targetRect.bottom + 16, margin, maxTop)
          let transform = 'translateX(-50%)'
          let left = rawLeft + ESTIMATED_CARD_WIDTH / 2
          if (rawLeft <= margin + 1) {
            transform = 'translateX(0)'
            left = rawLeft
          } else if (rawLeft >= maxLeft - 1) {
            transform = 'translateX(-100%)'
            left = rawLeft + ESTIMATED_CARD_WIDTH
          }
          return { top, left, transform }
        }
      case 'top':
        {
          const centerX = targetRect.left + targetRect.width / 2
          const rawLeft = clamp(centerX - ESTIMATED_CARD_WIDTH / 2, margin, maxLeft)
          const rawTop = targetRect.top - 16 - ESTIMATED_CARD_HEIGHT
          const top = clamp(rawTop, margin, maxTop)
          let transform = 'translate(-50%, -100%)'
          let left = rawLeft + ESTIMATED_CARD_WIDTH / 2
          if (rawLeft <= margin + 1) {
            transform = 'translate(0, -100%)'
            left = rawLeft
          } else if (rawLeft >= maxLeft - 1) {
            transform = 'translate(-100%, -100%)'
            left = rawLeft + ESTIMATED_CARD_WIDTH
          }
          return { top, left, transform }
        }
      case 'right':
        {
          const top = clamp(targetRect.top + targetRect.height / 2, margin + ESTIMATED_CARD_HEIGHT / 2, maxTop + ESTIMATED_CARD_HEIGHT / 2)
          let left = clamp(targetRect.right + 20, margin + ESTIMATED_CARD_WIDTH / 2, maxLeft + ESTIMATED_CARD_WIDTH / 2)
          let transform = 'translateY(-50%)'
          if (left >= maxLeft + ESTIMATED_CARD_WIDTH / 2) {
            transform = 'translate(-100%, -50%)'
            left = clamp(targetRect.right + 20, margin + ESTIMATED_CARD_WIDTH, maxLeft + ESTIMATED_CARD_WIDTH)
          }
          return { top, left, transform }
        }
      case 'left':
      default:
        {
          const top = clamp(targetRect.top + targetRect.height / 2, margin + ESTIMATED_CARD_HEIGHT / 2, maxTop + ESTIMATED_CARD_HEIGHT / 2)
          let leftEdge = clamp(targetRect.left - 20, margin + ESTIMATED_CARD_WIDTH / 2, maxLeft + ESTIMATED_CARD_WIDTH / 2)
          let transform = 'translate(-100%, -50%)'
          if (leftEdge <= margin + ESTIMATED_CARD_WIDTH / 2) {
            transform = 'translateY(-50%)'
            leftEdge = clamp(targetRect.left - 20, margin, maxLeft)
          }
          return { top, left: leftEdge, transform }
        }
    }
  }, [annotationPosition, targetRect])

  if (!overlayRoot) return null

  const progressPercent = ((stepIndex + 1) / totalSteps) * 100

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none fixed inset-0 z-[1000001]"
        aria-live="polite"
        role="region"
        aria-label="Astralus guided tour"
      >
        {/* Dimming backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
          style={
            targetRect
              ? {
                  maskImage: `radial-gradient(ellipse ${targetRect.width + 120}px ${targetRect.height + 120}px at ${
                    targetRect.left + targetRect.width / 2
                  }px ${targetRect.top + targetRect.height / 2}px, transparent 0%, transparent 60%, black 100%)`,
                  WebkitMaskImage: `radial-gradient(ellipse ${targetRect.width + 120}px ${targetRect.height + 120}px at ${
                    targetRect.left + targetRect.width / 2
                  }px ${targetRect.top + targetRect.height / 2}px, transparent 0%, transparent 60%, black 100%)`,
                }
              : undefined
          }
        />

        {/* Highlight outline */}
        {targetRect && (
          <div
            className="absolute rounded-2xl border border-cyan-400/80 shadow-[0_0_60px_rgba(34,211,238,0.45)] transition-all duration-200"
            style={{
              left: targetRect.left - 12,
              top: targetRect.top - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
            }}
          />
        )}

        {/* Annotation */}
        <div
          className="pointer-events-auto absolute max-w-sm rounded-3xl border border-cyan-400/30 bg-slate-900/95 p-5 text-left shadow-2xl shadow-cyan-500/30 backdrop-blur-xl"
          style={annotationCoordinates}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                {`Step ${stepIndex + 1} · Orientation`}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
            </div>

            <button
              type="button"
              aria-label="Skip guided tour"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70 hover:border-white/30 hover:text-white"
              onClick={onSkip}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/80">
            {step.render ? step.render() : <p>{step.description}</p>}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.4em] text-white/45">
              <span>Explore</span>
              <span>
                {stepIndex + 1}/{totalSteps}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white disabled:opacity-40"
                onClick={onPrevious}
                disabled={!allowPrevious}
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 hover:bg-white/90"
                onClick={onNext}
              >
                {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    overlayRoot,
  )
}


