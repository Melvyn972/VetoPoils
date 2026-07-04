export type AnimalHubView =
  | 'overview'
  | 'evenement'
  | 'rappel'
  | 'historique'
  | 'documents'
  | 'rappels'

interface ActionCardProps {
  title: string
  description: string
  badge?: string
  onClick: () => void
}

function ActionCard({ title, description, badge, onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 rounded-14 border border-fg-tertiary/20 bg-surface p-4 text-left transition-all hover:border-primary/35 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-title text-base font-semibold text-fg-primary">{title}</p>
        {badge ? (
          <span className="rounded-10 bg-primary-15 px-2 py-0.5 font-body text-xs font-medium text-primary">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="font-body text-sm leading-relaxed text-fg-secondary">{description}</p>
    </button>
  )
}

interface AnimalActionHubProps {
  remindersCount: number
  documentsCount: number
  eventsCount: number
  onSelect: (view: AnimalHubView) => void
}

export function AnimalActionHub({
  remindersCount,
  documentsCount,
  eventsCount,
  onSelect,
}: AnimalActionHubProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="font-title text-base font-semibold text-fg-primary">Que souhaitez-vous faire ?</h3>
        <p className="mt-1 font-body text-sm text-fg-secondary">
          Choisissez une action pour ce patient.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          title="Nouvel événement médical"
          description="Consultation, vaccination, analyse, ordonnance, chirurgie..."
          onClick={() => onSelect('evenement')}
        />
        <ActionCard
          title="Créer un rappel"
          description="Programmer une alerte pour le propriétaire (vaccin, RDV, traitement...)."
          onClick={() => onSelect('rappel')}
        />
        <ActionCard
          title="Historique du carnet"
          description="Consulter tous les événements médicaux validés."
          badge={eventsCount > 0 ? String(eventsCount) : undefined}
          onClick={() => onSelect('historique')}
        />
        <ActionCard
          title="Documents"
          description="Ordonnances, analyses, radios et pièces jointes."
          badge={documentsCount > 0 ? String(documentsCount) : undefined}
          onClick={() => onSelect('documents')}
        />
        <ActionCard
          title="Rappels actifs"
          description="Voir les alertes déjà programmées pour ce propriétaire."
          badge={remindersCount > 0 ? String(remindersCount) : undefined}
          onClick={() => onSelect('rappels')}
        />
      </div>
    </section>
  )
}

export function viewTitle(view: AnimalHubView): string {
  switch (view) {
    case 'evenement':
      return 'Nouvel événement médical'
    case 'rappel':
      return 'Créer un rappel'
    case 'historique':
      return 'Historique du carnet'
    case 'documents':
      return 'Documents'
    case 'rappels':
      return 'Rappels actifs'
    default:
      return 'Dossier patient'
  }
}
