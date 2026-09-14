import { useState } from 'react'

export function HelpFab() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
      {open ? (
        <div
          role="dialog"
          aria-label="Aide Vet'OPoil"
          className="w-72 rounded-14 border border-fg-tertiary/20 bg-surface p-4 shadow-md"
        >
          <p className="font-title text-sm font-semibold text-fg-primary">Comment ça marche ?</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 font-body text-xs leading-relaxed text-fg-secondary">
            <li>Le propriétaire génère un QR / code 6 caractères dans l’app.</li>
            <li>Saisissez le code (sans 0, 1, I, O). Un code expiré, révoqué ou déjà servi est refusé.</li>
            <li>Enregistrez la consultation : elle apparaît en attente chez le propriétaire.</li>
          </ol>
          <button
            type="button"
            className="mt-3 font-body text-xs font-semibold text-primary underline"
            onClick={() => setOpen(false)}
          >
            Fermer
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Fermer l’aide' : 'Ouvrir l’aide'}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-fg-primary font-body text-lg font-semibold text-surface shadow-md"
      >
        {open ? '×' : '?'}
      </button>
    </div>
  )
}
