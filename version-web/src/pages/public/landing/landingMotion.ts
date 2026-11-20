import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { SplitText } from 'gsap/SplitText'
import type { RefObject } from 'react'

import { gsap, MOTION_OK, useGSAP } from '../../../lib/motion'

gsap.registerPlugin(DrawSVGPlugin, SplitText)

export { SplitText }

export const DESKTOP_PIN = '(prefers-reduced-motion: no-preference) and (min-width: 1024px)'

/** Compteurs hero + barre de progression de page. Pas de reveals hors hero. */
export function useLandingMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        // Compteurs du hero uniquement
        gsap.utils.toArray<HTMLElement>('[data-count]', root).forEach((counter) => {
          gsap.from(counter, {
            textContent: 0,
            duration: 1.8,
            ease: 'power2.out',
            snap: { textContent: 1 },
            scrollTrigger: { trigger: counter, start: 'top 94%', once: true },
          })
        })

        gsap.fromTo(
          gsap.utils.toArray('[data-progress]', root),
          { scaleX: 0 },
          { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.25 } },
        )
      })

      return () => mm.revert()
    },
    { scope },
  )
}
