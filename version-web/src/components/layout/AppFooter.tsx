export function AppFooter({ wide = false }: { wide?: boolean }) {
  return (
    <footer className={`mx-auto py-6 text-center ${wide ? 'max-w-6xl' : 'max-w-md'}`}>
      <p className="font-body text-xs text-fg-tertiary">
        Vetopoils — Données chiffrées de bout en bout
      </p>
    </footer>
  )
}
