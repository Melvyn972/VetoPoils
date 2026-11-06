import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { Flip } from 'gsap/Flip'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { SplitText } from 'gsap/SplitText'
import { TextPlugin } from 'gsap/TextPlugin'
import type { RefObject } from 'react'

import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../../../lib/motion'

gsap.registerPlugin(DrawSVGPlugin, Flip, ScrambleTextPlugin, SplitText, TextPlugin)

export { Flip, SplitText }

export const DESKTOP_PIN = '(prefers-reduced-motion: no-preference) and (min-width: 1024px)'
export const FINE_POINTER = '(prefers-reduced-motion: no-preference) and (pointer: fine)'

/** Page-wide motion: heading line reveals, block reveals, counters, parallax, progress bar and pointer effects. */
export function useLandingMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>('[data-split]', root).forEach((heading) => {
          SplitText.create(heading, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 118,
                duration: 1.15,
                ease: 'expo.out',
                stagger: 0.1,
                scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
              }),
          })
        })

        const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', root)
        if (reveals.length > 0) {
          gsap.set(reveals, { autoAlpha: 0, y: 40 })
          ScrollTrigger.batch(reveals, {
            start: 'top 90%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.05, ease: 'power3.out', stagger: 0.1, overwrite: true }),
          })
        }

        gsap.utils.toArray<HTMLElement>('[data-count]', root).forEach((counter) => {
          gsap.from(counter, {
            textContent: 0,
            duration: 1.8,
            ease: 'power2.out',
            snap: { textContent: 1 },
            scrollTrigger: { trigger: counter, start: 'top 94%', once: true },
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-speed]', root).forEach((layer) => {
          const distance = Number(layer.dataset.speed) || 40
          gsap.fromTo(
            layer,
            { y: distance },
            { y: -distance, ease: 'none', scrollTrigger: { trigger: layer, start: 'top bottom', end: 'bottom top', scrub: true } },
          )
        })

        gsap.fromTo(
          gsap.utils.toArray('[data-progress]', root),
          { scaleX: 0 },
          { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.25 } },
        )
      })

      mm.add(FINE_POINTER, () => {
        const cleanups: Array<() => void> = []
        const listen = <K extends keyof HTMLElementEventMap>(
          target: HTMLElement,
          type: K,
          handler: (event: HTMLElementEventMap[K]) => void,
        ) => {
          target.addEventListener(type, handler)
          cleanups.push(() => target.removeEventListener(type, handler))
        }

        gsap.utils.toArray<HTMLElement>('[data-magnetic]', root).forEach((element) => {
          const xTo = gsap.quickTo(element, 'x', { duration: 0.6, ease: 'power3' })
          const yTo = gsap.quickTo(element, 'y', { duration: 0.6, ease: 'power3' })
          let rect = element.getBoundingClientRect()
          listen(element, 'pointerenter', () => {
            rect = element.getBoundingClientRect()
          })
          listen(element, 'pointermove', (event) => {
            xTo((event.clientX - rect.left - rect.width / 2) * 0.28)
            yTo((event.clientY - rect.top - rect.height / 2) * 0.38)
          })
          listen(element, 'pointerleave', () => {
            xTo(0)
            yTo(0)
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-tilt]', root).forEach((element) => {
          gsap.set(element, { transformPerspective: 1100 })
          const rxTo = gsap.quickTo(element, 'rotationX', { duration: 0.9, ease: 'power3' })
          const ryTo = gsap.quickTo(element, 'rotationY', { duration: 0.9, ease: 'power3' })
          let rect = element.getBoundingClientRect()
          listen(element, 'pointerenter', () => {
            rect = element.getBoundingClientRect()
          })
          listen(element, 'pointermove', (event) => {
            ryTo(((event.clientX - rect.left) / rect.width - 0.5) * 10)
            rxTo(-((event.clientY - rect.top) / rect.height - 0.5) * 8)
          })
          listen(element, 'pointerleave', () => {
            rxTo(0)
            ryTo(0)
          })
        })

        const cursor = root.querySelector<HTMLElement>('[data-cursor]')
        const dot = root.querySelector<HTMLElement>('[data-cursor-dot]')
        if (cursor && dot) {
          const xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' })
          const yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' })
          let visible = false
          let grown = false
          const onMove = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse') return
            if (!visible) {
              visible = true
              gsap.set(cursor, { x: event.clientX, y: event.clientY })
              gsap.to(cursor, { autoAlpha: 1, duration: 0.3 })
            }
            xTo(event.clientX)
            yTo(event.clientY)
          }
          const onOver = (event: PointerEvent) => {
            const target = event.target as Element | null
            const interactive = Boolean(target?.closest?.('a, button, summary, [role="tab"], [role="switch"], [data-cursor-grow]'))
            if (interactive === grown) return
            grown = interactive
            gsap.to(cursor, { scale: interactive ? 1.85 : 1, duration: 0.4, ease: 'power3.out' })
            gsap.to(dot, { autoAlpha: interactive ? 0 : 1, duration: 0.2 })
          }
          const onLeave = () => {
            visible = false
            gsap.to(cursor, { autoAlpha: 0, duration: 0.3 })
          }
          window.addEventListener('pointermove', onMove, { passive: true })
          document.addEventListener('pointerover', onOver)
          document.documentElement.addEventListener('pointerleave', onLeave)
          cleanups.push(() => {
            window.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerover', onOver)
            document.documentElement.removeEventListener('pointerleave', onLeave)
          })
        }

        return () => cleanups.forEach((cleanup) => cleanup())
      })

      return () => mm.revert()
    },
    { scope },
  )
}
