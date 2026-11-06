import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AnimalAvatar } from '../../components/animal/AnimalAvatar'
import { PageHeader } from '../../components/layout/AppShell'
import { PartnerSuggestions } from '../../components/partners/PartnerSuggestions'
import {
  IconBell,
  IconDownload,
  IconFile,
  IconPaw,
  IconPlus,
  IconQr,
  IconScan,
  IconWallet,
} from '../../components/icons/Icons'
import { EventStatusBadge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Donut, ScoreRing } from '../../components/ui/Charts'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, ListSkeleton } from '../../components/ui/Feedback'
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
  fetchExpenses,
  fetchPendingInvitations,
  fetchRecentEvents,
  fetchReminders,
  refuseShare,
  updateOwnerProfile,
} from '../../features/owner/api'
import { useAsync } from '../../hooks/useAsync'
import { storeConsent, getStoredConsent } from '../../lib/analytics'
import { expenseCategoryLabels, type ExpenseCategory } from '../../lib/cdc'
import { downloadText } from '../../lib/download'
import { getErrorMessage } from '../../lib/errors'
import { ageLabel, daysUntil, formatEuro, formatShortDate } from '../../lib/format'
import { getMedicalEventTypeLabel } from '../../lib/medicalLabels'
import { rememberAnimal } from '../../lib/routes'
import { requireSupabase } from '../../lib/supabase'
import type { Animal, Expense, Reminder } from '../../types/owner'
import { OwnerLayout } from './OwnerLayout'

const CATEGORY_COLORS: Record<string, string> = {
  veterinaire: '#2c6e63',
  alimentation: '#57c9d2',
  pharmacie: '#fba84b',
  accessoires: '#8fb8ae',
  autre: '#c9d3cf',
}

function monthExpenses(rows: Expense[]) {
  const now = new Date()
  const current = rows.filter((row) => {
    const date = new Date(row.date_depense)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })
  const totals = new Map<string, number>()
  for (const row of current) totals.set(row.category, (totals.get(row.category) ?? 0) + Number(row.montant))
  return {
    label: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    total: current.reduce((sum, row) => sum + Number(row.montant), 0),
    segments: [...totals.entries()].map(([key, value]) => ({
      key,
      label: expenseCategoryLabels[key as ExpenseCategory] ?? key,
      value,
      color: CATEGORY_COLORS[key] ?? '#c9d3cf',
    })),
  }
}

export function DashboardPage() {
  const { profile, displayName } = useAuth()
  const board = useAsync(async () => {
    const [animals, events, reminders, expenses] = await Promise.all([
      fetchAnimals(),
      fetchRecentEvents(6),
      fetchReminders(),
      fetchExpenses(),
    ])
    return { animals, events, reminders, budget: monthExpenses(expenses) }
  })
  const data = board.data
  const animals = data?.animals ?? []
  const events = data?.events ?? []
  const pending = events.filter((event) => event.status === 'pending')
  const soon = (data?.reminders ?? []).filter((reminder) => reminder.statut === 'actif').slice(0, 4)
  const firstName = profile?.prenom || displayName.split(' ')[0] || 'à vous'
  const scored = animals.filter((animal) => animal.score_sante != null)
  const average = scored.length
    ? Math.round(scored.reduce((sum, animal) => sum + Number(animal.score_sante), 0) / scored.length)
    : null
  const first = animals[0]

  return (
    <OwnerLayout>
      <PageHeader
        eyebrow="Tableau de bord"
        title={
          <>
            <span className="sr-only">Tableau de bord. </span>
            Bonjour {firstName}
          </>
        }
        description={
          data
            ? `${animals.length} ${animals.length > 1 ? 'animaux' : 'animal'} · ${soon.length} rappel${soon.length > 1 ? 's' : ''} · ${pending.length} événement${pending.length > 1 ? 's' : ''} à valider`
            : 'Chargement de vos animaux, rappels et dépenses.'
        }
        actions={
          <ButtonLink to="/espace/animaux/nouveau" fullWidth={false} icon={<IconPlus className="h-4 w-4" />}>
            Ajouter
          </ButtonLink>
        }
      />
      {board.error ? <ErrorState message={board.error} onRetry={board.retry} /> : null}
      {board.loading ? <ListSkeleton rows={4} label="Chargement du tableau de bord…" /> : null}

      {data && pending[0] ? (
        <Link
          to={`/espace/animaux/${pending[0].animal_id}/historique`}
          className="mb-5 flex items-center justify-between gap-3 rounded-[16px] bg-amber-soft px-4 py-3 font-body text-sm text-amber-ink"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <IconBell className="h-4 w-4" />
            À valider · {pending[0].titre || getMedicalEventTypeLabel(pending[0].type)} — {pending[0].animaux?.nom ?? 'votre animal'}
          </span>
          <span className="shrink-0 font-semibold">Voir</span>
        </Link>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {animals.slice(0, 2).map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
            {animals.length > 2 ? (
              <Link to="/espace/animaux" className="surface flex items-center justify-center p-5 font-body text-sm font-semibold text-primary">
                Voir les {animals.length} animaux
              </Link>
            ) : null}
            <div className="surface flex flex-col items-center justify-center gap-2 p-5">
              <ScoreRing score={average} size={92} stroke={8} />
              <p className="font-body text-sm text-muted">Score moyen</p>
            </div>
            <Link to="/espace/code" className="surface flex flex-col justify-between p-5 transition-transform hover:-translate-y-0.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-forest text-white">
                <IconQr className="h-5 w-5" />
              </span>
              <span>
                <span className="mt-4 block font-body text-sm font-semibold text-ink">Code vétérinaire</span>
                <span className="mt-1 block font-body text-xs leading-relaxed text-muted">
                  {first ? `Ouvrir le dossier de ${first.nom} pendant 4 heures.` : 'Créez d’abord une fiche animal.'}
                </span>
              </span>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <QuickLink to={first ? `/espace/animaux/${first.id}/analyse` : '/espace/animaux'} icon={<IconScan className="h-4 w-4" />} label="Smart Scan" />
            <QuickLink to="/espace/code" icon={<IconQr className="h-4 w-4" />} label="Générer un code" />
            <QuickLink to={first ? `/espace/animaux/${first.id}/pdf` : '/espace/animaux'} icon={<IconFile className="h-4 w-4" />} label="Exporter PDF" />
            <QuickLink to={first ? `/espace/animaux/${first.id}/budget` : '/espace/animaux'} icon={<IconWallet className="h-4 w-4" />} label="Budget" />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <section className="surface p-5">
              <h2 className="font-title text-lg font-semibold">Prochains rappels</h2>
              {soon.length === 0 ? (
                <p className="mt-3 font-body text-sm text-muted">Aucun rappel actif. Ils se programment depuis chaque fiche.</p>
              ) : (
                <ul className="mt-3 flex flex-col">
                  {soon.map((reminder) => {
                    const days = daysUntil(reminder.date_echeance)
                    return (
                      <li key={reminder.id} className="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-b-0">
                        <span>
                          <span className="block font-body text-sm font-semibold text-ink">{reminder.titre}</span>
                          <span className="block font-body text-xs text-muted">{formatShortDate(reminder.date_echeance)}</span>
                        </span>
                        <span className={`font-body text-sm font-semibold ${days < 0 ? 'text-red-ink' : 'text-orange-ink'}`}>
                          {days < 0 ? 'En retard' : `Dans ${days} j`}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
            <section className="surface p-5">
              <h2 className="font-title text-lg font-semibold">Activité récente</h2>
              {events.length === 0 ? (
                <p className="mt-3 font-body text-sm text-muted">Les consultations, vaccins et scans apparaîtront ici.</p>
              ) : (
                <ul className="mt-3 flex flex-col">
                  {events.slice(0, 4).map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-b-0">
                      <span className="min-w-0">
                        <span className="block truncate font-body text-sm font-semibold text-ink">{event.titre || getMedicalEventTypeLabel(event.type)}</span>
                        <span className="block font-body text-xs text-muted">{event.animaux?.nom ?? 'Animal'} · {formatShortDate(event.date_event)}</span>
                      </span>
                      <EventStatusBadge status={event.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="surface p-5">
              <h2 className="font-title text-lg font-semibold">Budget du mois</h2>
              <p className="font-body text-xs capitalize text-muted">{data.budget.label}</p>
              {data.budget.segments.length === 0 ? (
                <p className="mt-4 font-body text-sm text-muted">Aucune dépense ce mois-ci. Une facture scannée alimente ce graphique.</p>
              ) : (
                <div className="mt-4 flex items-center gap-4">
                  <Donut
                    segments={data.budget.segments}
                    size={132}
                    stroke={16}
                    centerTop={formatEuro(data.budget.total)}
                    centerBottom="ce mois"
                  />
                  <ul className="flex flex-col gap-1.5">
                    {data.budget.segments.map((segment) => (
                      <li key={segment.key} className="flex items-center gap-2 font-body text-xs text-muted">
                        <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
                        {segment.label} · {formatEuro(segment.value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </OwnerLayout>
  )
}

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="press inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 font-body text-sm font-semibold text-primary hover:border-primary/30">
      {icon}
      {label}
    </Link>
  )
}

function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <Link
      to={`/espace/animaux/${animal.id}`}
      onClick={() => rememberAnimal(animal.id)}
      className="surface flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
    >
      <AnimalAvatar animal={animal} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block font-title text-lg font-semibold leading-tight text-ink">{animal.nom}</span>
        <span className="mt-0.5 block font-body text-sm leading-snug text-muted">
          {animal.espece}
          {animal.race ? ` · ${animal.race}` : ''}
          <span className="whitespace-nowrap"> · {ageLabel(animal.date_naissance)}</span>
        </span>
        <span className="mt-1 block font-body text-xs font-semibold text-primary">Score {animal.score_sante ?? '—'}/100</span>
      </span>
    </Link>
  )
}

export function AnimalsPage() {
  const animals = useAsync(fetchAnimals)
  return (
    <OwnerLayout>
      <PageHeader
        eyebrow="Vos compagnons"
        title="Mes animaux"
        description="Chaque fiche rassemble l’historique, les documents, les rappels et le budget."
        actions={
          <ButtonLink to="/espace/animaux/nouveau" fullWidth={false} icon={<IconPlus className="h-4 w-4" />}>
            Nouvel animal
          </ButtonLink>
        }
      />
      {animals.error ? <ErrorState message={animals.error} onRetry={animals.retry} /> : null}
      {animals.loading ? <ListSkeleton rows={3} label="Chargement des animaux…" /> : null}
      {!animals.loading && (animals.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<IconPaw className="h-6 w-6" />}
          title="Aucune fiche pour le moment"
          description="Un nom, une espèce et une date de naissance suffisent pour ouvrir le carnet."
          action={<ButtonLink to="/espace/animaux/nouveau">Créer la première fiche</ButtonLink>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(animals.data ?? []).map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
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
      <PageHeader
        eyebrow="Nouvelle fiche"
        title="Ajouter un animal"
        description="Le poids saisi ici est enregistré comme une première pesée."
        back={{ to: '/espace/animaux', label: 'Mes animaux' }}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,520px)_280px]">
        <form onSubmit={handleSubmit} className="surface grid gap-4 p-5 sm:p-6">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <Input label="Couleur" value={couleur} onChange={(event) => setCouleur(event.target.value)} />
          <Input label="Puce" value={puce} onChange={(event) => setPuce(event.target.value)} />
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Button type="submit" loading={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Créer la fiche'}</Button>
        </form>
        <aside className="rounded-[20px] bg-forest p-5 text-white">
          <p className="font-title text-lg font-semibold">Ensuite</p>
          <ol className="mt-4 flex flex-col gap-3 font-body text-sm leading-relaxed text-white/80">
            <li>1. Photographiez une ordonnance avec Smart Scan.</li>
            <li>2. Programmez le prochain vaccin.</li>
            <li>3. Le jour du rendez-vous, générez un code de 4 heures.</li>
          </ol>
        </aside>
      </div>
    </OwnerLayout>
  )
}

export function RemindersPage() {
  const reminders = useAsync(fetchReminders)
  const animals = useAsync(fetchAnimals)
  const names = useMemo(() => new Map((animals.data ?? []).map((animal) => [animal.id, animal.nom])), [animals.data])
  const rows = reminders.data ?? []

  return (
    <OwnerLayout>
      <PageHeader eyebrow="À ne pas manquer" title="Rappels" description="Vaccins, antiparasitaires et rendez-vous, du plus proche au plus lointain." />
      {reminders.error ? <ErrorState message={reminders.error} onRetry={reminders.retry} /> : null}
      {reminders.loading ? <ListSkeleton label="Chargement des rappels…" /> : null}
      {!reminders.loading && rows.length === 0 ? (
        <EmptyState
          icon={<IconBell className="h-6 w-6" />}
          title="Aucun rappel"
          description="Ajoutez-en depuis la fiche d’un animal, ou laissez votre vétérinaire en proposer un."
          action={<ButtonLink to="/espace/animaux">Voir mes animaux</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((reminder) => (
            <ReminderRow key={reminder.id} reminder={reminder} animalName={names.get(reminder.animal_id)} />
          ))}
        </ul>
      )}
    </OwnerLayout>
  )
}

function ReminderRow({ reminder, animalName }: { reminder: Reminder; animalName?: string }) {
  const days = daysUntil(reminder.date_echeance)
  const late = reminder.statut === 'actif' && days < 0
  return (
    <li className="surface flex items-center gap-3 px-4 py-3">
      <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[14px] font-body leading-none ${late ? 'bg-red-soft text-red-ink' : 'bg-orange-15 text-orange-ink'}`}>
        <span className="text-sm font-semibold tabular">{Math.abs(days)}</span>
        <span className="text-[9px] font-semibold uppercase">j</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-body text-sm font-semibold text-ink">{reminder.titre}</span>
        <span className="block font-body text-xs text-muted">
          {animalName ?? 'Animal'} · {formatShortDate(reminder.date_echeance)} · {reminder.statut}
          {late ? ' · en retard' : ''}
        </span>
      </span>
    </li>
  )
}

export function SharesPage() {
  const invitations = useAsync(fetchPendingInvitations)
  const rows = (invitations.data ?? []) as Array<Record<string, unknown>>

  return (
    <OwnerLayout>
      <PageHeader
        eyebrow="Accès reçus"
        title="Partage"
        description="Invitations reçues. Celles que vous envoyez se gèrent sur la fiche de chaque animal."
      />
      {invitations.error ? <ErrorState message={invitations.error} onRetry={invitations.retry} /> : null}
      {invitations.loading ? <ListSkeleton label="Chargement des invitations…" /> : null}
      {!invitations.loading && rows.length === 0 ? (
        <EmptyState
          icon={<IconPaw className="h-6 w-6" />}
          title="Aucune invitation en attente"
          description="Quand un proche vous invite sur un dossier, la demande apparaît ici."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const id = String(row.id ?? '')
            return (
              <li key={id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
                <span>
                  <span className="block font-body text-sm font-semibold text-ink">{String(row.email_invite ?? 'Invitation')}</span>
                  <span className="block font-body text-xs text-muted">{String(row.role ?? '')}</span>
                </span>
                <span className="flex gap-2">
                  <Button
                    fullWidth={false}
                    onClick={() => void acceptShare(id).then(() => invitations.setData(rows.filter((item) => item.id !== id)))}
                  >
                    Accepter
                  </Button>
                  <Button
                    fullWidth={false}
                    variant="ghost"
                    onClick={() => void refuseShare(id).then(() => invitations.setData(rows.filter((item) => item.id !== id)))}
                  >
                    Refuser
                  </Button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </OwnerLayout>
  )
}

export function PartnersPage() {
  const animals = useAsync(fetchAnimals)
  const first = animals.data?.[0]
  return (
    <OwnerLayout>
      <PageHeader
        eyebrow="Autour de vous"
        title="Partenaires"
        description={first ? `Suggestions pour ${first.nom} (${first.espece}).` : 'Ajoutez un animal pour voir des suggestions adaptées à son espèce.'}
      />
      {animals.loading ? <ListSkeleton label="Chargement…" /> : null}
      {first ? <PartnerSuggestions animal={first} contexte="owner-partners" /> : null}
      {!animals.loading && !first ? (
        <EmptyState
          icon={<IconPaw className="h-6 w-6" />}
          title="Pas encore de suggestions"
          description="Les partenaires sont proposés à partir de l’espèce de votre animal."
          action={<ButtonLink to="/espace/animaux/nouveau">Ajouter un animal</ButtonLink>}
        />
      ) : null}
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
      <PageHeader
        eyebrow="Compte"
        title="Paramètres"
        description={`${[prenom, nom].filter(Boolean).join(' ') || 'Votre compte'} · ${user?.email ?? ''}`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="surface grid gap-4 p-5">
          <h2 className="font-title text-lg font-semibold">Profil</h2>
          <Input label="Prénom" value={prenom} onChange={(event) => setPrenom(event.target.value)} />
          <Input label="Nom" value={nom} onChange={(event) => setNom(event.target.value)} />
          <p className="font-body text-sm text-muted">{user?.email}</p>
          {error ? <FormAlert>{error}</FormAlert> : null}
          {message ? <p className="font-body text-sm text-primary">{message}</p> : null}
          <Button type="submit">Enregistrer</Button>
        </form>
        <section className="surface space-y-3 p-5">
          <h2 className="font-title text-lg font-semibold">Notifications</h2>
          <p className="font-body text-sm text-muted">Les rappels restent visibles dans l’application. Cet espace ne déclenche pas de notification du téléphone.</p>
          <div className="flex gap-2">
            <Button fullWidth={false} variant="secondary" onClick={() => void toggleNotifications(true)}>Activer</Button>
            <Button fullWidth={false} variant="ghost" onClick={() => void toggleNotifications(false)}>Désactiver</Button>
          </div>
        </section>
        <section className="surface space-y-3 p-5">
          <h2 className="font-title text-lg font-semibold">Mesure d’audience</h2>
          <p className="font-body text-sm text-muted">
            Choix actuel : {consent === 'granted' ? 'acceptée' : consent === 'denied' ? 'refusée' : 'non renseigné'}. Microsoft Clarity et Google Tag Manager ne se chargent pas sans votre accord. Le refus coupe la mesure d’audience.
          </p>
          <div className="flex gap-2">
            <Button fullWidth={false} onClick={() => { storeConsent('granted'); setConsent('granted') }}>Accepter</Button>
            <Button fullWidth={false} variant="ghost" onClick={() => { storeConsent('denied'); setConsent('denied') }}>Refuser</Button>
          </div>
        </section>
        <section className="surface space-y-3 p-5">
          <h2 className="font-title text-lg font-semibold">Vos données</h2>
          <p className="font-body text-sm text-muted">Export JSON complet, ou suppression du compte et des animaux dont vous êtes propriétaire.</p>
          <Button
            variant="secondary"
            icon={<IconDownload className="h-4 w-4" />}
            onClick={() => {
              void exportAccountData()
                .then((payload) => downloadText('vetopoil-donnees.json', JSON.stringify(payload, null, 2), 'application/json'))
                .catch((exportError) => setError(getErrorMessage(exportError)))
            }}
          >
            Télécharger mes données
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Supprimer mon compte</Button>
        </section>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer le compte ?"
        description="Les animaux dont vous êtes propriétaire et les données associées sont effacés. Cette action est définitive."
        confirmLabel="Supprimer le compte"
        busy={deleting}
        error={error}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setDeleting(true)
          void deleteAccount()
            .then(() => signOut())
            .catch((deleteError) => {
              setError(getErrorMessage(deleteError))
              setDeleting(false)
            })
        }}
      />
    </OwnerLayout>
  )
}
