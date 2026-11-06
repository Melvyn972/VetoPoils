import { useEffect, useId, useRef, type ReactNode } from 'react'

import { gsap, MOTION_OK, useGSAP } from '../../lib/motion'
import { IconAlert } from '../icons/Icons'
import { Button } from './Button'
import { FormAlert } from './FormAlert'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  tone = 'danger',
  busy = false,
  error,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useGSAP(
    () => {
      if (!open) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          panelRef.current,
          { autoAlpha: 0, y: 18, scale: 0.97 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out', clearProps: 'transform' },
        )
      })
      return () => mm.revert()
    },
    { dependencies: [open], scope: dialogRef },
  )

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !busy) onClose()
      }}
      className="m-auto w-[min(92vw,440px)] overflow-visible bg-transparent p-0 backdrop:bg-transparent"
    >
      <div ref={panelRef} className="rounded-[24px] bg-white p-6 shadow-pop">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            tone === 'danger' ? 'bg-red-soft text-red-ink' : 'bg-mint text-primary'
          }`}
        >
          <IconAlert className="h-5 w-5" />
        </span>
        <h2 id={titleId} className="mt-4 font-title text-lg font-semibold text-ink">
          {title}
        </h2>
        <div className="mt-1.5 font-body text-sm leading-relaxed text-muted">{description}</div>
        {children}
        {error ? (
          <div className="mt-4">
            <FormAlert>{error}</FormAlert>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" fullWidth={false} onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            fullWidth={false}
            loading={busy}
            onClick={onConfirm}
            className={tone === 'danger' ? '!bg-red-ink !text-white hover:!bg-[#962920]' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
