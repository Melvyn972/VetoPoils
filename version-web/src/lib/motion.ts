import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { RefObject } from 'react'

gsap.registerPlugin(useGSAP, ScrollTrigger)
gsap.defaults({ ease: 'power3.out', duration: 0.7 })

export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const DESKTOP_MOTION = '(prefers-reduced-motion: no-preference) and (min-width: 1024px)'

export { gsap, ScrollTrigger, useGSAP }

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fades and lifts every `[data-reveal]` descendant as it scrolls into view.
 * `data-reveal-delay` (seconds) offsets an element inside its batch.
 */
export function useScrollReveal(scope: RefObject<HTMLElement | null>, dependencies: unknown[] = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope.current)
        if (items.length === 0) return
        gsap.set(items, { autoAlpha: 0, y: 28 })
        ScrollTrigger.batch(items, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              stagger: 0.09,
              delay: (_index, target: Element) => Number((target as HTMLElement).dataset.revealDelay ?? 0),
              overwrite: true,
              clearProps: 'transform',
            }),
        })
      })
      return () => mm.revert()
    },
    { scope, dependencies, revertOnUpdate: true },
  )
}

/**
 * Staggers `[data-enter]` descendants in on mount (app screens: no scroll dependency,
 * so content that is already on screen never waits for a scroll event).
 */
export function useEnterStagger(scope: RefObject<HTMLElement | null>, dependencies: unknown[] = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-enter]', scope.current)
        if (items.length === 0) return
        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.05, clearProps: 'transform,opacity,visibility' },
        )
      })
      return () => mm.revert()
    },
    { scope, dependencies, revertOnUpdate: true },
  )
}
