const ANIMAL_PROFILE = {
  name: 'Luna',
  species: 'Chien',
  breed: 'Golden Retriever',
  age: 3,
  weight: '28 kg',
  lastConsultation: {
    date: '12 février 2026',
    veterinarian: 'Dr. Martin',
    clinic: 'Clinique du Parc',
    diagnosis: 'Contrôle annuel — RAS',
  },
  nextAppointment: '15 août 2026',
}

export function AnimalSummary() {
  const { name, species, breed, age, weight, lastConsultation, nextAppointment } =
    ANIMAL_PROFILE

  return (
    <section className="flex flex-col gap-4 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-15 font-title text-2xl font-bold text-primary"
          aria-hidden="true"
        >
          {name.charAt(0)}
        </div>

        <div className="flex flex-col gap-0.5">
          <h2 className="font-title text-xl font-bold text-fg-primary">{name}</h2>
          <p className="font-body text-sm text-fg-secondary">
            {species} · {breed}
          </p>
          <p className="font-body text-sm text-fg-tertiary">
            {age} ans · {weight}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-fg-tertiary/20 pt-4">
        <div>
          <p className="font-body text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            Dernière consultation
          </p>
          <p className="mt-1 font-body text-sm font-medium text-fg-primary">
            {lastConsultation.date}
          </p>
          <p className="font-body text-sm text-fg-secondary">
            {lastConsultation.veterinarian} — {lastConsultation.clinic}
          </p>
          <p className="mt-1 font-body text-sm text-fg-secondary">
            {lastConsultation.diagnosis}
          </p>
        </div>

        <div>
          <p className="font-body text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            Prochain rendez-vous
          </p>
          <p className="mt-1 font-body text-sm font-medium text-fg-primary">
            {nextAppointment}
          </p>
        </div>
      </div>
    </section>
  )
}
