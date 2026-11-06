import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PageHeading } from '../../components/layout/WorkspaceShell'
import { PartnerSuggestions } from '../../components/partners/PartnerSuggestions'
import { Button } from '../../components/ui/Button'
import { FormAlert } from '../../components/ui/FormAlert'
import { Input } from '../../components/ui/Input'
import { SelectField } from '../../components/ui/SelectField'
import { useAuth } from '../../context/AuthContext'
import {
  acceptShare,
  createAnimal,
  deleteAccount,
  exportAccountData,
  fetchAnimals,
  fetchPendingInvitations,
  fetchRecentEvents,
  fetchReminders,
  refuseShare,
  updateOwnerProfile,
} from '../../features/owner/api'
import { storeConsent, getStoredConsent } from '../../lib/analytics'
import { downloadText } from '../../lib/download'
import { getErrorMessage } from '../../lib/errors'
import { ageLabel, daysUntil, formatShortDate } from '../../lib/format'
import { getMedicalEventTypeLabel } from '../../lib/medicalLabels'
import { rememberAnimal } from '../../lib/routes'
import { requireSupabase } from '../../lib/supabase'
import type { Animal, Reminder } from '../../types/owner'
import { OwnerLayout } from './OwnerLayout'

function useAsync<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loader()
      .then((value) => {
        if (!cancelled) setData(value)
      })
      .catch((loadError) => {
        if (!cancelled) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // Chargement unique au montage de la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, error, loading, setData }
}

export function DashboardPage() {
  const animals = useAsync(fetchAnimals)
  const events = useAsync(() => fetchRecentEvents(6))
  const reminders = useAsync(() => fetchReminders())
  const pending = (events.data ?? []).filter((event) => event.status === 'pending')
  const soon = (reminders.data ?? []).filter((reminder) => reminder.statut === 'actif').slice(0, 4)

  return (
    <OwnerLayout>
      <PageHeading title="Tableau de bord" subtitle="Vos animaux, les validations en attente et les rappels proches." />
      {animals.error ? <FormAlert>{animals.error}</FormAlert> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Animaux" value={String(animals.data?.length ?? '—')} />
        <Stat label="À valider" value={String(pending.length)} />
        <Stat label="Rappels actifs" value={String(soon.length)} />
      </div>
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-title text-lg font-semibold">Mes animaux</h2>
          <Link to="/espace/animaux/nouveau" className="font-body text-sm font-semibold text-primary">Ajouter</Link>
        </div>
        {animals.loading ? <p className="font-body text-sm text-muted">Chargement…</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {(animals.data ?? []).map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
        {!animals.loading && (animals.data?.length ?? 0) === 0 ? (
          <p className="font-body text-sm text-muted">Aucun animal pour le moment.</p>
        ) : null}
      </section>
      <section className="mt-8">
        <h2 className="font-title text-lg font-semibold">Activité récente</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {(events.data ?? []).map((event) => (
            <li key={event.id} className="rounded-2xl bg-white px-4 py-3">
              <p className="font-body text-sm font-semibold">{event.titre || getMedicalEventTypeLabel(event.type)}</p>
              <p className="font-body text-xs text-muted">
                {event.animaux?.nom ?? 'Animal'} · {formatShortDate(event.date_event)}
                {event.status === 'pending' ? ' · À valider' : event.status === 'rejected' ? ' · Refusé' : ''}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </OwnerLayout>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-4">
      <p className="font-body text-xs text-muted">{label}</p>
      <p className="mt-1 font-title text-2xl font-semibold">{value}</p>
    </div>
  )
}

function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <Link
      to={`/espace/animaux/${animal.id}`}
      onClick={() => rememberAnimal(animal.id)}
      className="rounded-3xl border border-line bg-white p-4"
    >
      <p className="font-title text-lg font-semibold">{animal.nom}</p>
      <p className="font-body text-sm text-muted">
        {animal.espece}
        {animal.race ? ` · ${animal.race}` : ''} · {ageLabel(animal.date_naissance)}
      </p>
      <p className="mt-2 font-body text-xs font-semibold text-primary">
        Score {animal.score_sante ?? '—'}
      </p>
    </Link>
  )
}

export function AnimalsPage() {
  const animals = useAsync(fetchAnimals)
  return (
    <OwnerLayout>
      <PageHeading
        title="Mes animaux"
        actions={
          <Link to="/espace/animaux/nouveau" className="rounded-2xl bg-primary px-4 py-2 font-body text-sm font-semibold text-white">
            Nouvel animal
          </Link>
        }
      />
      {animals.error ? <FormAlert>{animals.error}</FormAlert> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {(animals.data ?? []).map((animal) => (
          <AnimalCard key={animal.id} animal={animal} />
        ))}
      </div>
    </OwnerLayout>
  )
}

export function NewAnimalPage() {
  const navigate = useNavigate()
  const [nom, setNom] = useState('')
  const [espece, setEspece] = useState('Chien')
  const [race, setRace] = useState('')
  const [naissance, setNaissance] = useState('')
  const [poids, setPoids] = useState('')
  const [sexe, setSexe] = useState<Animal['sexe']>('inconnu')
  const [couleur, setCouleur] = useState('')
  const [puce, setPuce] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const weight = poids.replace(',', '.')
      const animal = await createAnimal({
        nom,
        espece,
        race,
        date_naissance: naissance || null,
        sexe,
        couleur,
        puce,
        poidsKg: weight ? Number(weight) : null,
      })
      rememberAnimal(animal.id)
      navigate(`/espace/animaux/${animal.id}`, { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <OwnerLayout>
      <PageHeading title="Nouvel animal" subtitle="Nom, espèce, race, naissance et poids. Le poids est enregistré comme une pesée." />
      <form onSubmit={handleSubmit} className="grid max-w-xl gap-4">
        <Input label="Nom" value={nom} onChange={(event) => setNom(event.target.value)} required />
        <SelectField
          label="Espèce"
          value={espece}
          onChange={setEspece}
          required
          options={[
            { value: 'Chien', label: 'Chien' },
            { value: 'Chat', label: 'Chat' },
            { value: 'NAC', label: 'NAC' },
          ]}
        />
        <Input label="Race" value={race} onChange={(event) => setRace(event.target.value)} />
        <Input label="Date de naissance" type="date" value={naissance} onChange={(event) => setNaissance(event.target.value)} />
        <Input label="Poids (kg)" inputMode="decimal" value={poids} onChange={(event) => setPoids(event.target.value)} />
        <SelectField
          label="Sexe"
          value={sexe}
          onChange={(value) => setSexe(value as Animal['sexe'])}
          options={[
            { value: 'male', label: 'Mâle' },
            { value: 'femelle', label: 'Femelle' },
            { value: 'inconnu', label: 'Non renseigné' },
          ]}
        />
        <Input label="Couleur" value={couleur} onChange={(event) => setCouleur(event.target.value)} />
        <Input label="Puce" value={puce} onChange={(event) => setPuce(event.target.value)} />
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Créer la fiche'}</Button>
      </form>
    </OwnerLayout>
  )
}

export function RemindersPage() {
  const reminders = useAsync(fetchReminders)
  const animals = useAsync(fetchAnimals)
  const names = useMemo(() => new Map((animals.data ?? []).map((animal) => [animal.id, animal.nom])), [animals.data])

  return (
    <OwnerLayout>
      <PageHeading title="Rappels" subtitle="Vaccins, antiparasitaires et rendez-vous à venir." />
      {reminders.error ? <FormAlert>{reminders.error}</FormAlert> : null}
      <ul className="flex flex-col gap-2">
        {(reminders.data ?? []).map((reminder) => (
          <ReminderRow key={reminder.id} reminder={reminder} animalName={names.get(reminder.animal_id)} />
        ))}
      </ul>
      {!reminders.loading && (reminders.data?.length ?? 0) === 0 ? (
        <p className="font-body text-sm text-muted">Aucun rappel. Ajoutez-en depuis la fiche d’un animal.</p>
      ) : null}
    </OwnerLayout>
  )
}

function ReminderRow({ reminder, animalName }: { reminder: Reminder; animalName?: string }) {
  const late = reminder.statut === 'actif' && daysUntil(reminder.date_echeance) < 0
  return (
    <li className="rounded-2xl bg-white px-4 py-3">
      <p className="font-body text-sm font-semibold">{reminder.titre}</p>
      <p className="font-body text-xs text-muted">
        {animalName ?? 'Animal'} · {formatShortDate(reminder.date_echeance)}
        {late ? ' · En retard' : ''} · {reminder.statut}
      </p>
    </li>
  )
}

export function SharesPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingInvitations()
      .then((value) => setRows(value as Array<Record<string, unknown>>))
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [])

  return (
    <OwnerLayout>
      <PageHeading title="Partage" subtitle="Invitations reçues. Les invitations envoyées se gèrent sur chaque fiche." />
      {error ? <FormAlert>{error}</FormAlert> : null}
      {rows.length === 0 ? <p className="font-body text-sm text-muted">Aucune invitation en attente.</p> : null}
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const id = String(row.id ?? '')
          return (
            <li key={id} className="rounded-2xl bg-white p-4">
              <p className="font-body text-sm font-semibold">{String(row.email_invite ?? 'Invitation')}</p>
              <p className="font-body text-xs text-muted">{String(row.role ?? '')}</p>
              <div className="mt-3 flex gap-2">
                <Button fullWidth={false} onClick={() => void acceptShare(id).then(() => setRows((current) => current.filter((item) => item.id !== id)))}>
                  Accepter
                </Button>
                <Button fullWidth={false} variant="ghost" onClick={() => void refuseShare(id).then(() => setRows((current) => current.filter((item) => item.id !== id)))}>
                  Refuser
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </OwnerLayout>
  )
}

export function PartnersPage() {
  const animals = useAsync(fetchAnimals)
  const first = animals.data?.[0]
  return (
    <OwnerLayout>
      <PageHeading title="Partenaires" subtitle="Suggestions selon l’espèce du premier animal de votre espace." />
      <PartnerSuggestions animal={first} contexte="owner-partners" />
      {!first ? <p className="font-body text-sm text-muted">Ajoutez un animal pour voir des suggestions.</p> : null}
    </OwnerLayout>
  )
}

export function AccountPage() {
  const { user, profile, refreshAccount, signOut } = useAuth()
  const [nom, setNom] = useState(profile?.nom ?? '')
  const [prenom, setPrenom] = useState(profile?.prenom ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(getStoredConsent())

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    try {
      await updateOwnerProfile(user.id, { nom, prenom })
      await refreshAccount()
      setMessage('Profil enregistré.')
      setError(null)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    }
  }

  async function toggleNotifications(enabled: boolean) {
    if (!user) return
    const { error: updateError } = await requireSupabase()
      .from('profiles')
      .update({ notifications_push_enabled: enabled })
      .eq('id', user.id)
    if (updateError) setError(getErrorMessage(updateError))
    else setMessage(enabled ? 'Alertes activées sur cet espace.' : 'Alertes désactivées.')
  }

  return (
    <OwnerLayout>
      <PageHeading title="Paramètres" subtitle="Profil, confidentialité et suppression du compte." />
      <form onSubmit={saveProfile} className="grid max-w-lg gap-4">
        <Input label="Prénom" value={prenom} onChange={(event) => setPrenom(event.target.value)} />
        <Input label="Nom" value={nom} onChange={(event) => setNom(event.target.value)} />
        <p className="font-body text-sm text-muted">{user?.email}</p>
        {error ? <FormAlert>{error}</FormAlert> : null}
        {message ? <p className="font-body text-sm text-primary">{message}</p> : null}
        <Button type="submit">Enregistrer</Button>
      </form>
      <section className="mt-8 max-w-lg space-y-3">
        <h2 className="font-title text-lg font-semibold">Notifications</h2>
        <p className="font-body text-sm text-muted">Les rappels restent visibles dans l’application. Le site ne envoie pas de notification push.</p>
        <div className="flex gap-2">
          <Button fullWidth={false} variant="secondary" onClick={() => void toggleNotifications(true)}>Activer</Button>
          <Button fullWidth={false} variant="ghost" onClick={() => void toggleNotifications(false)}>Désactiver</Button>
        </div>
      </section>
      <section className="mt-8 max-w-lg space-y-3">
        <h2 className="font-title text-lg font-semibold">Mesure d’audience</h2>
        <p className="font-body text-sm text-muted">Choix actuel : {consent ?? 'non renseigné'}.</p>
        <div className="flex gap-2">
          <Button fullWidth={false} onClick={() => { storeConsent('granted'); setConsent('granted') }}>Accepter</Button>
          <Button fullWidth={false} variant="ghost" onClick={() => { storeConsent('denied'); setConsent('denied') }}>Refuser</Button>
        </div>
      </section>
      <section className="mt-8 max-w-lg space-y-3">
        <h2 className="font-title text-lg font-semibold">Vos données</h2>
        <Button
          variant="secondary"
          onClick={() => {
            void exportAccountData().then((payload) => {
              downloadText('vetopoil-donnees.json', JSON.stringify(payload, null, 2), 'application/json')
            }).catch((exportError) => setError(getErrorMessage(exportError)))
          }}
        >
          Télécharger mes données
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (!window.confirm('Supprimer le compte et les animaux dont vous êtes propriétaire ?')) return
            void deleteAccount()
              .then(() => signOut())
              .catch((deleteError) => setError(getErrorMessage(deleteError)))
          }}
        >
          Supprimer mon compte
        </Button>
      </section>
    </OwnerLayout>
  )
}
