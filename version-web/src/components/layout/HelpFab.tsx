import { useEffect, useId, useRef, useState } from 'react'

export function HelpFab() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      triggerRef.current?.focus()
    }
  }, [open])

  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="w-72 rounded-[18px] border border-line bg-surface p-4"
        >
          <p id={titleId} className="font-title text-sm font-semibold text-ink">Comment ça marche ?</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 font-body text-sm leading-relaxed text-muted">
            <li>Le propriétaire génère un QR ou un code à 6 caractères.</li>
            <li>Saisissez le code, sans 0, 1, I ni O. Un code expiré, révoqué ou déjà servi est refusé.</li>
            <li>Enregistrez la consultation. Elle apparaît en attente chez le propriétaire.</li>
          </ol>
          <button
            ref={closeRef}
            type="button"
            className="mt-3 inline-flex min-h-11 items-center font-body text-sm font-semibold text-primary"
            onClick={() => setOpen(false)}
          >
            Fermer l’aide
          </button>
        </div>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Fermer l’aide' : 'Ouvrir l’aide'}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-body text-lg font-semibold text-surface"
      >
        {open ? '×' : '?'}
      </button>
    </div>
  )
}
