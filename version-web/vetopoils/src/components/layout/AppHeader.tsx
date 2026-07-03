export function AppHeader() {
  return (
    <header className="border-b border-fg-tertiary/20 bg-surface">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-title text-sm font-bold text-white">
            P
          </div>
          <span className="font-title text-sm font-semibold text-fg-primary">
            Vetopoils — Accès Vétérinaire
          </span>
        </div>
        <span className="font-body text-xs text-fg-tertiary">Portail sécurisé</span>
      </div>
    </header>
  )
}
