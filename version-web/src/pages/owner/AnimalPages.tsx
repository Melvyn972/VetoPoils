import QRCode from 'qrcode'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'

import { AnimalAvatar } from '../../components/animal/AnimalAvatar'
import { PageHeader } from '../../components/layout/AppShell'
import { EventStatusBadge } from '../../components/ui/Badge'
import { Donut, MonthlyBars, ScoreRing } from '../../components/ui/Charts'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ErrorState, ListSkeleton } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { FileField } from '../../components/ui/FileField'
import { FormAlert } from '../../components/ui/FormAlert'
import { Input } from '../../components/ui/Input'
import { SelectField } from '../../components/ui/SelectField'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../context/AuthContext'
import {
  createDailyLog,
  createExpense,
  createMedicalEvent,
  createReminder,
  deleteExpense,
  fetchAnimal,
  fetchAnimalAccess,
  fetchDailyLogs,
  fetchDocuments,
  fetchExpenses,
  fetchHealthHistory,
  fetchMedicalEvents,
  fetchReminders,
  fetchShares,
  fetchVetTokens,
  generateVetToken,
  incrementOcrUsage,
  inviteShare,
  persistHealthScore,
  postponeReminder,
  rejectMedicalEvent,
  revokeShare,
  revokeVetToken,
  archiveAnimal,
  updateAnimal,
  updateReminderStatus,
  uploadAnimalPhoto,
  uploadOwnerDocument,
  validateMedicalEvent,
} from '../../features/owner/api'
import { trackEvent } from '../../lib/analytics'
import { documentCategoryLabels, expenseCategoryLabels, expensesToCsv, type ExpenseCategory } from '../../lib/cdc'
import { buildVetDossierHtml } from '../../lib/dossier'
import { downloadText, fileToBase64 } from '../../lib/download'
import { getErrorMessage } from '../../lib/errors'
import { ageLabel, countdownLabel, formatEuro, formatShortDate } from '../../lib/format'
import { scoreVerdict } from '../../components/ui/chartUtils'
import { computeHealthScore } from '../../lib/healthScore'
import { MEDICAL_EVENT_TYPES, REMINDER_TYPES, getMedicalEventTypeLabel } from '../../lib/medicalLabels'
import {
  categoryToMedicalEventType,
  expenseCategoryFromDocument,
  heuristicExtraction,
  runOcrRequest,
  type OcrExtraction,
} from '../../lib/ocr'
import { printHtmlDocument } from '../../lib/print'
import { rememberAnimal } from '../../lib/routes'
import type { Animal, AnimalAccess, DailyLog, Expense, MedicalEvent, PartageRole, Reminder } from '../../types/owner'
import { OwnerLayout } from './OwnerLayout'

export type AnimalSection =
  | 'fiche'
  | 'modifier'
  | 'historique'
  | 'documents'
  | 'analyse'
  | 'code'
  | 'rappels'
  | 'partage'
  | 'journal'
  | 'budget'
  | 'score'
  | 'pdf'

const links: Array<{ section: AnimalSection; label: string; suffix: string }> = [
  { section: 'fiche', label: 'Fiche', suffix: '' },
  { section: 'historique', label: 'Historique', suffix: '/historique' },
  { section: 'documents', label: 'Documents', suffix: '/documents' },
  { section: 'analyse', label: 'Analyse', suffix: '/analyse' },
  { section: 'code', label: 'Code', suffix: '/code' },
  { section: 'rappels', label: 'Rappels', suffix: '/rappels' },
  { section: 'partage', label: 'Partage', suffix: '/partage' },
  { section: 'journal', label: 'Journal', suffix: '/journal' },
  { section: 'budget', label: 'Budget', suffix: '/budget' },
  { section: 'score', label: 'Score', suffix: '/score' },
  { section: 'pdf', label: 'PDF', suffix: '/pdf' },
]

export function AnimalPage({ section }: { section: AnimalSection }) {
  const { animalId = '' } = useParams()
  const { user } = useAuth()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [access, setAccess] = useState<AnimalAccess | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!animalId || !user) return
    rememberAnimal(animalId)
    let cancelled = false
    Promise.all([fetchAnimal(animalId), fetchAnimalAccess(animalId, user.id)])
      .then(([nextAnimal, nextAccess]) => {
        if (cancelled) return
        setAnimal(nextAnimal)
        setAccess(nextAccess)
        if (!nextAnimal) setError('Animal introuvable.')
      })
      .catch((loadError) => {
        if (!cancelled) setError(getErrorMessage(loadError))
      })
    return () => {
      cancelled = true
    }
  }, [animalId, user])

  return (
    <OwnerLayout>
      {!animal ? (
        error ? <ErrorState message={error} /> : <ListSkeleton label="Chargement de la fiche…" />
      ) : (
        <>
          <PageHeader
            eyebrow={animal.espece}
            title={animal.nom}
            description={`${animal.race ? `${animal.race} · ` : ''}${ageLabel(animal.date_naissance)}`}
            back={{ to: '/espace/animaux', label: 'Mes animaux' }}
          />
          <nav aria-label="Sections de la fiche" className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto pb-1">
            {links.map((link) => (
              <NavLink
                key={link.section}
                to={`/espace/animaux/${animal.id}${link.suffix}`}
                end={link.suffix === ''}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3.5 py-2 font-body text-[13px] font-semibold ${
                    isActive || section === link.section ? 'bg-primary text-white' : 'bg-white text-[#4b5552] ring-1 ring-line'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          {error ? <FormAlert>{error}</FormAlert> : null}
          {section === 'fiche' ? <Fiche animal={animal} access={access} onChange={setAnimal} /> : null}
          {section === 'modifier' ? <EditAnimal animal={animal} onChange={setAnimal} /> : null}
          {section === 'historique' ? <Timeline animalId={animal.id} canWrite={Boolean(access?.canWrite)} /> : null}
          {section === 'documents' ? <Documents animalId={animal.id} /> : null}
          {section === 'analyse' ? (
            <ScanReview animal={animal} userId={user?.id ?? ''} canWrite={Boolean(access?.canWrite)} />
          ) : null}
          {section === 'code' ? <CodePanel animal={animal} canWrite={Boolean(access?.canWrite)} /> : null}
          {section === 'rappels' ? <AnimalReminders animalId={animal.id} canWrite={Boolean(access?.canWrite)} /> : null}
          {section === 'partage' ? <SharePanel animalId={animal.id} canManage={Boolean(access?.canManageShares)} /> : null}
          {section === 'journal' ? (
            <Journal animalId={animal.id} userId={user?.id ?? ''} canWrite={Boolean(access?.canWriteDailyLog)} />
          ) : null}
          {section === 'budget' ? (
            <Budget animal={animal} userId={user?.id ?? ''} canWrite={Boolean(access?.canWrite)} />
          ) : null}
          {section === 'score' ? <ScorePanel animal={animal} onChange={setAnimal} /> : null}
          {section === 'pdf' ? <PdfPanel animal={animal} /> : null}
        </>
      )}
    </OwnerLayout>
  )
}

function Fiche({
  animal,
  access,
  onChange,
}: {
  animal: Animal
  access: AnimalAccess | null
  onChange: (animal: Animal) => void
}) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const facts = [
    ['Sexe', animal.sexe === 'male' ? 'Mâle' : animal.sexe === 'femelle' ? 'Femelle' : 'Non renseigné'],
    ['Couleur', animal.couleur || '—'],
    ['Puce', animal.puce || '—'],
    ['Accès', access?.level === 'owner' ? 'Propriétaire' : access?.level === 'contributor' ? 'Pet-sitter' : 'Lecture seule'],
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="surface p-5">
        <div className="flex flex-wrap items-center gap-4">
          <AnimalAvatar animal={animal} size="xl" />
          <div>
            <p className="font-body text-sm text-muted">{animal.espece}{animal.race ? ` · ${animal.race}` : ''}</p>
            <p className="font-title text-xl font-semibold text-ink">{ageLabel(animal.date_naissance)}</p>
          </div>
          <ScoreRing score={animal.score_sante} size={84} stroke={8} />
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-[14px] bg-canvas px-4 py-3">
              <dt className="font-body text-xs text-muted">{label}</dt>
              <dd className="mt-0.5 font-body text-sm font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {access?.canWrite ? (
          <Link to={`/espace/animaux/${animal.id}/modifier`} className="mt-5 inline-flex font-body text-sm font-semibold text-primary">
            Modifier la fiche
          </Link>
        ) : null}
      </section>
      {access?.canWrite ? (
        <section className="surface p-5">
          <FileField label="Photo" accept="image/*" file={file} onFile={setFile} />
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Button
            className="mt-3"
            disabled={!file}
            onClick={() => {
              if (!file || !user) return
              void uploadAnimalPhoto({ ownerId: animal.proprietaire_id, animalId: animal.id, file })
                .then(onChange)
                .catch((uploadError) => setError(getErrorMessage(uploadError)))
            }}
          >
            Enregistrer la photo
          </Button>
        </section>
      ) : null}
    </div>
  )
}

function EditAnimal({ animal, onChange }: { animal: Animal; onChange: (animal: Animal) => void }) {
  const navigate = useNavigate()
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [nom, setNom] = useState(animal.nom)
  const [espece, setEspece] = useState(animal.espece)
  const [race, setRace] = useState(animal.race ?? '')
  const [naissance, setNaissance] = useState(animal.date_naissance ?? '')
  const [sexe, setSexe] = useState(animal.sexe)
  const [couleur, setCouleur] = useState(animal.couleur ?? '')
  const [puce, setPuce] = useState(animal.puce ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      const updated = await updateAnimal(animal.id, {
        nom: nom.trim(),
        espece: espece.trim(),
        race: race.trim() || null,
        date_naissance: naissance || null,
        sexe,
        couleur: couleur.trim() || null,
        puce: puce.trim() || null,
      })
      onChange(updated)
      navigate(`/espace/animaux/${animal.id}`)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-4">
      <Input label="Nom" value={nom} onChange={(event) => setNom(event.target.value)} required />
      <Input label="Espèce" value={espece} onChange={(event) => setEspece(event.target.value)} required />
      <Input label="Race" value={race} onChange={(event) => setRace(event.target.value)} />
      <Input label="Date de naissance" type="date" value={naissance ?? ''} onChange={(event) => setNaissance(event.target.value)} />
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
      <Button type="submit">Enregistrer</Button>
      <Button type="button" variant="danger" onClick={() => setConfirmArchive(true)}>
        Archiver l’animal
      </Button>
      <ConfirmDialog
        open={confirmArchive}
        title={`Archiver ${animal.nom} ?`}
        description="La fiche quitte votre espace. L’historique n’est plus accessible depuis ce compte."
        confirmLabel="Archiver"
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => {
          void archiveAnimal(animal.id)
            .then(() => navigate('/espace/animaux'))
            .catch((deleteError) => {
              setError(getErrorMessage(deleteError))
              setConfirmArchive(false)
            })
        }}
      />
    </form>
  )
}

function Timeline({ animalId, canWrite }: { animalId: string; canWrite: boolean }) {
  const [events, setEvents] = useState<MedicalEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState('consultation')
  const [titre, setTitre] = useState('')
  const [diagnostic, setDiagnostic] = useState('')
  const [traitement, setTraitement] = useState('')

  function reload() {
    fetchMedicalEvents(animalId).then(setEvents).catch((loadError) => setError(getErrorMessage(loadError)))
  }

  useEffect(() => {
    reload()
    // Le rechargement est relancé explicitement après chaque écriture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <li key={event.id} className="rounded-3xl bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-body text-sm font-semibold">{event.titre || getMedicalEventTypeLabel(event.type)}</p>
              <EventStatusBadge status={event.status} />
            </div>
            <p className="mt-1 font-body text-xs text-muted">{formatShortDate(event.date_event)}</p>
            {event.diagnostic ? <p className="mt-2 font-body text-sm">{event.diagnostic}</p> : null}
            {event.traitement ? <p className="font-body text-sm text-muted">{event.traitement}</p> : null}
            {event.status === 'pending' && canWrite ? (
              <div className="mt-3 flex gap-2">
                <Button fullWidth={false} onClick={() => void validateMedicalEvent(event.id).then(reload)}>Valider</Button>
                <Button fullWidth={false} variant="danger" onClick={() => void rejectMedicalEvent(event.id).then(reload)}>
                  Refuser
                </Button>
              </div>
            ) : null}
          </li>
        ))}
        {events.length === 0 ? <p className="font-body text-sm text-muted">Aucun événement.</p> : null}
      </ul>
      {canWrite ? (
        <form
          className="flex flex-col gap-3 rounded-3xl bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void createMedicalEvent({
              animal_id: animalId,
              type: type as MedicalEvent['type'],
              titre,
              diagnostic,
              traitement,
              status: 'validated',
            })
              .then(() => {
                setTitre('')
                setDiagnostic('')
                setTraitement('')
                reload()
              })
              .catch((saveError) => setError(getErrorMessage(saveError)))
          }}
        >
          <SelectField
            label="Type"
            value={type}
            onChange={setType}
            options={MEDICAL_EVENT_TYPES.map((item) => ({ value: item.value, label: item.label }))}
          />
          <Input label="Titre" value={titre} onChange={(event) => setTitre(event.target.value)} />
          <Textarea label="Diagnostic" value={diagnostic} onChange={(event) => setDiagnostic(event.target.value)} />
          <Textarea label="Traitement" value={traitement} onChange={(event) => setTraitement(event.target.value)} />
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Button type="submit">Ajouter</Button>
        </form>
      ) : null}
    </div>
  )
}

function Documents({ animalId }: { animalId: string }) {
  const [rows, setRows] = useState<Array<{ id: string; file_name: string; category_ocr: string | null }>>([])
  useEffect(() => {
    fetchDocuments(animalId).then(setRows).catch(() => setRows([]))
  }, [animalId])
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.id} className="rounded-2xl bg-white px-4 py-3 font-body text-sm">
          {row.file_name}
          <span className="ml-2 text-muted">{row.category_ocr ? documentCategoryLabels[row.category_ocr as keyof typeof documentCategoryLabels] ?? row.category_ocr : 'Non classé'}</span>
        </li>
      ))}
      {rows.length === 0 ? <p className="font-body text-sm text-muted">Aucun document. Lancez une analyse pour en ajouter.</p> : null}
    </ul>
  )
}

function ScanReview({ animal, userId, canWrite }: { animal: Animal; userId: string; canWrite: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<OcrExtraction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function analyze() {
    if (!file) return
    setBusy(true)
    setError(null)
    trackEvent('ocr_scan_started')
    try {
      const base64 = await fileToBase64(file)
      const extracted = await runOcrRequest({
        imageBase64: base64,
        mimeType: file.type || 'application/octet-stream',
        fileName: file.name,
      })
      setDraft(extracted ?? heuristicExtraction(file.name, file.type))
      await incrementOcrUsage().catch(() => undefined)
      trackEvent('ocr_scan_completed')
    } catch (scanError) {
      trackEvent('ocr_scan_failed')
      setDraft(heuristicExtraction(file.name, file.type))
      setError(`${getErrorMessage(scanError)} Une proposition locale est affichée, vous pouvez la corriger.`)
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!file || !draft || !canWrite) return
    setBusy(true)
    setError(null)
    try {
      const event = await createMedicalEvent({
        animal_id: animal.id,
        type: categoryToMedicalEventType(draft.category),
        titre: draft.titre,
        diagnostic: draft.diagnostic,
        traitement: draft.traitement,
        poids_kg: draft.poidsKg ?? undefined,
        date_event: draft.dateEvent ? new Date(draft.dateEvent).toISOString() : undefined,
        status: 'validated',
      })
      await uploadOwnerDocument({
        ownerId: animal.proprietaire_id,
        animalId: animal.id,
        file,
        category: draft.category,
        raw: draft.raw,
        medicalEventId: event.id,
        userId,
      })
      if (draft.montant && draft.montant > 0) {
        await createExpense({
          animal_id: animal.id,
          category: expenseCategoryFromDocument(draft.category),
          montant: draft.montant,
          cree_par: userId,
          description: draft.titre,
          medical_event_id: event.id,
        })
      }
      setInfo('Document enregistré dans le dossier.')
      setFile(null)
      setDraft(null)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setBusy(false)
    }
  }

  if (!canWrite) return <p className="font-body text-sm text-muted">Lecture seule : l’analyse est réservée au propriétaire.</p>

  return (
    <div className="grid max-w-2xl gap-4">
      <FileField label="Document à analyser" hint="Photo ou PDF. Sans clé OCR, une proposition est déduite du nom du fichier." accept="image/*,application/pdf" file={file} onFile={setFile} />
      <Button disabled={!file || busy} onClick={() => void analyze()}>{busy ? 'Analyse…' : 'Analyser'}</Button>
      {draft ? (
        <div className="grid gap-3 rounded-3xl bg-white p-4">
          <p className="font-body text-xs text-muted">Source : {draft.source === 'api' ? 'OCR' : 'proposition locale'}</p>
          <SelectField
            label="Catégorie"
            value={draft.category}
            onChange={(value) => setDraft({ ...draft, category: value as OcrExtraction['category'] })}
            options={Object.entries(documentCategoryLabels).map(([value, label]) => ({ value, label }))}
          />
          <Input label="Titre" value={draft.titre} onChange={(event) => setDraft({ ...draft, titre: event.target.value })} />
          <Textarea label="Diagnostic" value={draft.diagnostic} onChange={(event) => setDraft({ ...draft, diagnostic: event.target.value })} />
          <Textarea label="Traitement" value={draft.traitement} onChange={(event) => setDraft({ ...draft, traitement: event.target.value })} />
          <Button onClick={() => void save()}>Enregistrer dans le dossier</Button>
        </div>
      ) : null}
      {error ? <FormAlert>{error}</FormAlert> : null}
      {info ? <p className="font-body text-sm text-primary">{info}</p> : null}
    </div>
  )
}

function CodePanel({ animal, canWrite }: { animal: Animal; canWrite: boolean }) {
  const [code, setCode] = useState<string | null>(null)
  const [expires, setExpires] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVetTokens(animal.id)
      .then((rows) => {
        const active = rows.find((row) => row.statut === 'actif' && new Date(row.expire_le).getTime() > Date.now())
        if (!active) return
        setCode(active.token)
        setExpires(active.expire_le)
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
  }, [animal.id])

  useEffect(() => {
    if (!expires) return
    const timer = window.setInterval(() => setLabel(countdownLabel(expires)), 1000)
    setLabel(countdownLabel(expires))
    return () => window.clearInterval(timer)
  }, [expires])

  useEffect(() => {
    if (!code) return
    const url = `${window.location.origin}/consultation?token=${code}`
    void QRCode.toDataURL(url, { margin: 1, width: 280 }).then(setImage)
  }, [code])

  if (!canWrite) return <p className="font-body text-sm text-muted">Seul le propriétaire peut générer un code.</p>

  return (
    <section className="max-w-md rounded-3xl bg-white p-5">
      <h2 className="font-title text-lg font-semibold">Code vétérinaire, 4 heures</h2>
      <p className="mt-2 font-body text-sm text-muted">Le vétérinaire ouvre le dossier, puis le code s’éteint.</p>
      {code ? (
        <div className="mt-4">
          <p className="font-title text-3xl font-semibold tracking-[0.3em]" data-testid="vet-code">{code}</p>
          <p className="mt-2 font-body text-sm text-muted">Temps restant : {label}</p>
          {image ? <img src={image} alt="QR du code vétérinaire" className="mt-4 h-48 w-48" /> : null}
          <Button className="mt-4" variant="ghost" onClick={() => void revokeVetToken(code).then(() => { setCode(null); setImage(null) })}>
            Révoquer
          </Button>
        </div>
      ) : (
        <Button
          className="mt-4"
          onClick={() => {
            void generateVetToken(animal.id)
              .then((row) => {
                setCode(row.token)
                setExpires(row.expire_le)
              })
              .catch((generateError) => setError(getErrorMessage(generateError)))
          }}
        >
          Générer un code
        </Button>
      )}
      {error ? <FormAlert>{error}</FormAlert> : null}
    </section>
  )
}

function AnimalReminders({ animalId, canWrite }: { animalId: string; canWrite: boolean }) {
  const [rows, setRows] = useState<Reminder[]>([])
  const [titre, setTitre] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('vaccination')
  const [error, setError] = useState<string | null>(null)

  function reload() {
    fetchReminders(animalId).then(setRows).catch((loadError) => setError(getErrorMessage(loadError)))
  }
  useEffect(() => {
    reload()
    // Le rechargement est relancé explicitement après chaque écriture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId])

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl bg-white p-4">
            <p className="font-body text-sm font-semibold">{row.titre}</p>
            <p className="font-body text-xs text-muted">{formatShortDate(row.date_echeance)} · {row.statut}</p>
            {canWrite && row.statut === 'actif' ? (
              <div className="mt-2 flex gap-2">
                <Button fullWidth={false} variant="secondary" onClick={() => void updateReminderStatus(row.id, 'termine').then(reload)}>Terminer</Button>
                <Button fullWidth={false} variant="ghost" onClick={() => void postponeReminder(row).then(reload)}>Reporter 7 jours</Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {canWrite ? (
        <form
          className="flex flex-col gap-3 rounded-3xl bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void createReminder({ animal_id: animalId, titre, date_echeance: date, type: type as Reminder['type'] })
              .then(() => {
                setTitre('')
                reload()
              })
              .catch((saveError) => setError(getErrorMessage(saveError)))
          }}
        >
          <Input label="Titre" value={titre} onChange={(event) => setTitre(event.target.value)} required />
          <Input label="Échéance" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <SelectField label="Type" value={type} onChange={setType} options={REMINDER_TYPES.map((item) => ({ value: item.value, label: item.label }))} />
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Button type="submit">Créer le rappel</Button>
        </form>
      ) : null}
    </div>
  )
}

function SharePanel({ animalId, canManage }: { animalId: string; canManage: boolean }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<PartageRole>('read_only')
  const [rows, setRows] = useState<Array<{ id: string; email_invite: string; role: string; statut: string }>>([])
  const [error, setError] = useState<string | null>(null)

  function reload() {
    fetchShares(animalId).then(setRows).catch((loadError) => setError(getErrorMessage(loadError)))
  }
  useEffect(() => {
    reload()
    // Le rechargement est relancé explicitement après chaque écriture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId])

  return (
    <div className="grid max-w-xl gap-4">
      <p className="font-body text-sm text-muted">
        L’invitation part par e-mail. Lecture pour la famille, contribution pour le pet-sitter (journal).
      </p>
      {canManage ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void inviteShare(animalId, email, role)
              .then(() => {
                setEmail('')
                reload()
              })
              .catch((saveError) => setError(getErrorMessage(saveError)))
          }}
        >
          <Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <SelectField
            label="Rôle"
            value={role}
            onChange={(value) => setRole(value as PartageRole)}
            options={[
              { value: 'read_only', label: 'Famille — lecture' },
              { value: 'contributor', label: 'Pet-sitter — journal' },
            ]}
          />
          <Button type="submit">Envoyer l’invitation</Button>
        </form>
      ) : null}
      {error ? <FormAlert>{error}</FormAlert> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
            <span className="font-body text-sm">{row.email_invite} · {row.role} · {row.statut}</span>
            {canManage && row.statut !== 'revoquee' ? (
              <button type="button" className="font-body text-xs text-error" onClick={() => void revokeShare(row.id).then(reload)}>
                Révoquer
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Journal({ animalId, userId, canWrite }: { animalId: string; userId: string; canWrite: boolean }) {
  const [rows, setRows] = useState<DailyLog[]>([])
  const [repas, setRepas] = useState('')
  const [sortie, setSortie] = useState('')
  const [comportement, setComportement] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function reload() {
    fetchDailyLogs(animalId).then(setRows).catch((loadError) => setError(getErrorMessage(loadError)))
  }
  useEffect(() => {
    reload()
    // Le rechargement est relancé explicitement après chaque écriture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId])

  return (
    <div className="grid gap-4">
      {canWrite ? (
        <form
          className="grid gap-3 rounded-3xl bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void createDailyLog({ animal_id: animalId, cree_par: userId, repas, sortie, comportement, notes })
              .then(() => {
                setRepas('')
                setSortie('')
                setComportement('')
                setNotes('')
                reload()
              })
              .catch((saveError) => setError(getErrorMessage(saveError)))
          }}
        >
          <Input label="Repas" value={repas} onChange={(event) => setRepas(event.target.value)} />
          <Input label="Sortie" value={sortie} onChange={(event) => setSortie(event.target.value)} />
          <Input label="Comportement" value={comportement} onChange={(event) => setComportement(event.target.value)} />
          <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <Button type="submit">Ajouter au journal</Button>
        </form>
      ) : (
        <p className="font-body text-sm text-muted">Le journal s’écrit par le propriétaire ou un pet-sitter invité.</p>
      )}
      {error ? <FormAlert>{error}</FormAlert> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl bg-white px-4 py-3 font-body text-sm">
            <span className="text-muted">{formatShortDate(row.date_journal)}</span>
            <p>{[row.repas, row.sortie, row.comportement, row.notes].filter(Boolean).join(' · ') || 'Note vide'}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Budget({ animal, userId, canWrite }: { animal: Animal; userId: string; canWrite: boolean }) {
  const [rows, setRows] = useState<Expense[]>([])
  const [category, setCategory] = useState<ExpenseCategory>('veterinaire')
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  function reload() {
    fetchExpenses(animal.id).then(setRows).catch((loadError) => setError(getErrorMessage(loadError)))
  }
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal.id])

  const total = rows.reduce((sum, row) => sum + Number(row.montant), 0)
  const totals = new Map<string, number>()
  for (const row of rows) totals.set(row.category, (totals.get(row.category) ?? 0) + Number(row.montant))
  const byCategory = [...totals.entries()]

  const segments = byCategory.map(([key, value]) => ({
    key,
    label: expenseCategoryLabels[key as ExpenseCategory] ?? key,
    value,
    color: key === 'veterinaire' ? '#2c6e63' : key === 'alimentation' ? '#57c9d2' : key === 'pharmacie' ? '#fba84b' : '#c9d3cf',
  }))
  const months = new Map<string, number>()
  for (const row of rows) {
    const key = row.date_depense.slice(0, 7)
    months.set(key, (months.get(key) ?? 0) + Number(row.montant))
  }
  const bars = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => ({ key, label: key.slice(5), value }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <section className="surface p-5">
        <p className="font-title text-2xl font-semibold">{formatEuro(total)}</p>
        {segments.length ? (
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
            <Donut segments={segments} size={148} stroke={18} centerTop={formatEuro(total)} centerBottom="au total" />
            <MonthlyBars data={bars.length ? bars : [{ key: 'none', label: '—', value: 0 }]} formatValue={(value) => `${Math.round(value)} €`} height={150} />
          </div>
        ) : (
          <p className="mt-3 font-body text-sm text-muted">Aucune dépense. Ajoutez-en, ou scannez une facture.</p>
        )}
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between font-body text-sm">
              <span>{formatShortDate(row.date_depense)} · {row.description || expenseCategoryLabels[row.category]}</span>
              <span className="flex items-center gap-2">
                {formatEuro(Number(row.montant))}
                {canWrite ? (
                  <button type="button" className="text-xs text-error" onClick={() => void deleteExpense(row.id).then(reload)}>Retirer</button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            downloadText(
              `budget-${animal.nom}.csv`,
              expensesToCsv(rows.map((row) => ({ ...row, animalNom: animal.nom }))),
              'text/csv;charset=utf-8',
            )
            trackEvent('csv_exported')
          }}
        >
          Exporter le CSV
        </Button>
      </section>
      {canWrite ? (
        <form
          className="flex flex-col gap-3 rounded-3xl bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void createExpense({
              animal_id: animal.id,
              category,
              montant: Number(montant.replace(',', '.')),
              description,
              cree_par: userId,
            })
              .then(() => {
                setMontant('')
                setDescription('')
                reload()
              })
              .catch((saveError) => setError(getErrorMessage(saveError)))
          }}
        >
          <SelectField
            label="Catégorie"
            value={category}
            onChange={(value) => setCategory(value as ExpenseCategory)}
            options={Object.entries(expenseCategoryLabels).map(([value, label]) => ({ value, label }))}
          />
          <Input label="Montant" value={montant} onChange={(event) => setMontant(event.target.value)} required />
          <Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Button type="submit">Ajouter</Button>
        </form>
      ) : null}
    </div>
  )
}

function ScorePanel({ animal, onChange }: { animal: Animal; onChange: (animal: Animal) => void }) {
  const [score, setScore] = useState<number | null>(animal.score_sante)
  const [factors, setFactors] = useState<Array<{ label: string; delta: number }>>([])
  const [history, setHistory] = useState<Array<{ id: string; score: number; calcule_le: string }>>([])

  useEffect(() => {
    Promise.all([fetchMedicalEvents(animal.id), fetchReminders(animal.id), fetchHealthHistory(animal.id)])
      .then(async ([events, reminders, past]) => {
        const computed = computeHealthScore({ animal, events, reminders })
        setHistory(past as Array<{ id: string; score: number; calcule_le: string }>)
        if (!computed) return
        setScore(computed.score)
        setFactors(computed.details.factors)
        await persistHealthScore(animal.id, computed.score, computed.details as unknown as Record<string, unknown>)
        onChange({ ...animal, score_sante: computed.score })
      })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal.id])

  return (
    <section className="surface max-w-xl p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-6">
        <ScoreRing score={score} size={148} stroke={12} />
        <div>
          <p className="font-title text-xl font-semibold text-ink">{scoreVerdict(score)}</p>
          <p className="mt-1 max-w-sm font-body text-sm text-muted">Score de 0 à 100, recalculé à partir du dossier. Indicateur de suivi, pas un diagnostic.</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {factors.map((factor) => (
          <li key={factor.label} className="flex justify-between font-body text-sm">
            <span>{factor.label}</span>
            <span>{factor.delta}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-4 font-body text-xs text-muted">
        {history.map((row) => (
          <li key={row.id}>{formatShortDate(row.calcule_le)} · {row.score}</li>
        ))}
      </ul>
    </section>
  )
}

function PdfPanel({ animal }: { animal: Animal }) {
  const [error, setError] = useState<string | null>(null)

  return (
    <section className="surface max-w-xl p-6">
      <h2 className="font-title text-xl font-semibold">Le dossier complet, en un PDF</h2>
      <p className="mt-2 font-body text-sm leading-relaxed text-muted">L’impression ouvre la boîte de dialogue du navigateur. Enregistrez en PDF depuis cette fenêtre.</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {['Identité', 'Historique', 'Documents', 'Poids'].map((item) => (
          <li key={item} className="rounded-full bg-canvas px-3 py-1 font-body text-xs font-semibold text-[#3c4542]">{item}</li>
        ))}
      </ul>
      {error ? <FormAlert>{error}</FormAlert> : null}
      <Button
        className="mt-4"
        onClick={() => {
          void Promise.all([fetchMedicalEvents(animal.id), fetchDocuments(animal.id)])
            .then(([events, documents]) => {
              printHtmlDocument(
                buildVetDossierHtml({
                  animal,
                  medical_events: events,
                  documents,
                }),
              )
              trackEvent('pdf_exported')
            })
            .catch((printError) => setError(getErrorMessage(printError)))
        }}
      >
        Imprimer / enregistrer en PDF
      </Button>
    </section>
  )
}
