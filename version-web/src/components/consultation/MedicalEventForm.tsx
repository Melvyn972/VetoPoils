import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { getTodayDateInputValue } from '../../lib/consultation'
import {
  MEDICAL_EVENT_TYPES,
  requiresDiagnosis,
  type MedicalEventTypeValue,
} from '../../lib/medicalLabels'
import { mapVetRpcError } from '../../lib/vetErrors'
import {
  submitVetAnimalEvent,
  submitVetConsultation,
  uploadVetDocument,
} from '../../lib/vet'
import type { VetDossier } from '../../types/vet'
import { Button } from '../ui/Button'
import { FormAlert } from '../ui/FormAlert'
import { Input } from '../ui/Input'
import { SelectField } from '../ui/SelectField'
import { Textarea } from '../ui/Textarea'
import { GuestIdentityFields } from './GuestIdentityFields'

interface MedicalEventFormProps {
  dossier: VetDossier
  mode: 'token' | 'connected'
  token?: string
  animalId?: string
  onSuccess: () => void
  submitLabel?: string
}

interface FormState {
  eventType: MedicalEventTypeValue
  veterinarianName: string
  clinic: string
  visitDate: string
  diagnosis: string
  notes: string
  weightKg: string
  guestFullName: string
  guestEmail: string
}

interface FormErrors {
  fullName?: string
  email?: string
  veterinarianName?: string
  diagnosis?: string
  form?: string
}

export function MedicalEventForm({
  dossier,
  mode,
  token,
  animalId,
  onSuccess,
  submitLabel = 'Enregistrer',
}: MedicalEventFormProps) {
  const {
    isConnected,
    defaultVeterinarianName,
    defaultClinic,
    defaultEmail,
    displayName,
  } = useAuth()

  const [form, setForm] = useState<FormState>(() => ({
    eventType: 'consultation',
    veterinarianName: defaultVeterinarianName,
    clinic: defaultClinic,
    visitDate: getTodayDateInputValue(),
    diagnosis: '',
    notes: '',
    weightKg: '',
    guestFullName: defaultVeterinarianName,
    guestEmail: defaultEmail,
  }))
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [document, setDocument] = useState<File | null>(null)

  useEffect(() => {
    setForm((current) => ({
      ...current,
      veterinarianName: defaultVeterinarianName || current.veterinarianName,
      clinic: defaultClinic || current.clinic,
      guestFullName: defaultVeterinarianName || current.guestFullName,
      guestEmail: defaultEmail || current.guestEmail,
    }))
  }, [defaultClinic, defaultEmail, defaultVeterinarianName])

  function validate(): FormErrors {
    const nextErrors: FormErrors = {}

    if (!form.veterinarianName.trim()) {
      nextErrors.veterinarianName = 'Le nom du vétérinaire est requis'
    }

    if (requiresDiagnosis(form.eventType) && !form.diagnosis.trim()) {
      nextErrors.diagnosis = 'Ce champ est requis pour ce type d’événement'
    }

    if (mode === 'token' && !isConnected) {
      if (!form.guestFullName.trim()) nextErrors.fullName = 'Le nom complet est requis'
      if (!form.guestEmail.trim()) nextErrors.email = "L'email est requis"
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const parsedWeight = form.weightKg.trim() ? Number(form.weightKg.replace(',', '.')) : null
    if (form.weightKg.trim() && (!parsedWeight || Number.isNaN(parsedWeight) || parsedWeight <= 0)) {
      setErrors({ form: 'Le poids doit être un nombre positif.' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    const payload = {
      token: mode === 'token' ? token : undefined,
      animalId: mode === 'connected' ? animalId : undefined,
      eventType: form.eventType,
      veterinarianName: form.veterinarianName,
      clinic: form.clinic,
      diagnosis: form.diagnosis,
      notes: [
        form.notes.trim(),
        mode === 'token' && !isConnected && form.guestFullName
          ? `Vétérinaire : ${form.guestFullName}`
          : null,
        mode === 'token' && !isConnected && form.guestEmail ? `Email : ${form.guestEmail}` : null,
        isConnected ? `Vétérinaire connecté : ${displayName}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      weightKg: parsedWeight,
    }

    try {
      const createdEvent =
        mode === 'connected'
          ? await submitVetAnimalEvent(payload)
          : await submitVetConsultation(payload)

      if (document) {
        await uploadVetDocument({
          token: mode === 'token' ? token : undefined,
          animalId: mode === 'connected' ? animalId : undefined,
          dossier,
          file: document,
          medicalEventId: (createdEvent as { id?: string })?.id,
        })
      }

      onSuccess()
    } catch (submitError) {
      setErrors({
        form: mapVetRpcError(submitError instanceof Error ? submitError : new Error('Erreur inconnue')),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="font-title text-lg font-semibold text-fg-primary">Nouvel événement médical</h2>
        <p className="mt-1 font-body text-sm text-fg-secondary">
          Choisissez le type d’événement. Le propriétaire devra valider l’entrée.
        </p>
      </div>

      {mode === 'token' && !isConnected ? (
        <p className="font-body text-sm text-fg-secondary">
          <Link to="/login" className="font-medium text-primary underline">
            Connectez-vous
          </Link>{' '}
          pour préremplir vos informations et retrouver vos patients.
        </p>
      ) : null}

      {mode === 'token' && !isConnected ? (
        <GuestIdentityFields
          fullName={form.guestFullName}
          email={form.guestEmail}
          errors={{ fullName: errors.fullName, email: errors.email }}
          onFullNameChange={(value) => setForm((current) => ({ ...current, guestFullName: value }))}
          onEmailChange={(value) => setForm((current) => ({ ...current, guestEmail: value }))}
        />
      ) : null}

      <SelectField
        label="Type d’événement"
        required
        value={form.eventType}
        onChange={(value) =>
          setForm((current) => ({ ...current, eventType: value as MedicalEventTypeValue }))
        }
        options={MEDICAL_EVENT_TYPES}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nom du vétérinaire"
          required
          value={form.veterinarianName}
          onChange={(event) => setForm((current) => ({ ...current, veterinarianName: event.target.value }))}
          placeholder="Dr. Martin"
          error={errors.veterinarianName}
        />
        <Input
          label="Clinique"
          value={form.clinic}
          onChange={(event) => setForm((current) => ({ ...current, clinic: event.target.value }))}
          placeholder="Clinique du Parc"
        />
        <Input
          label="Date de la visite"
          type="date"
          value={form.visitDate}
          onChange={(event) => setForm((current) => ({ ...current, visitDate: event.target.value }))}
        />
        <Input
          label="Poids (kg)"
          value={form.weightKg}
          onChange={(event) => setForm((current) => ({ ...current, weightKg: event.target.value }))}
          placeholder="12.5"
        />
      </div>

      <Input
        label={requiresDiagnosis(form.eventType) ? 'Diagnostic / objet' : 'Objet (optionnel)'}
        required={requiresDiagnosis(form.eventType)}
        value={form.diagnosis}
        onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))}
        placeholder={
          form.eventType === 'vaccination'
            ? 'Ex: Vaccin rage + CHPPi'
            : 'Ex: Otite externe légère'
        }
        error={errors.diagnosis}
      />

      <Textarea
        label="Notes & traitement"
        value={form.notes}
        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
        placeholder="Observations, prescriptions, recommandations..."
      />

      <div className="flex flex-col gap-2 rounded-12 border border-dashed border-fg-tertiary/30 bg-surface p-4">
        <label className="font-body text-sm font-medium text-fg-primary">Document médical (optionnel)</label>
        <p className="font-body text-xs text-fg-tertiary">PDF ou image — ordonnance, analyse, radio...</p>
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
          className="font-body text-sm text-fg-secondary file:mr-3 file:rounded-10 file:border-0 file:bg-primary-15 file:px-3 file:py-2 file:font-body file:text-sm file:font-medium file:text-primary"
        />
        {document ? (
          <p className="font-body text-xs text-fg-secondary">Fichier sélectionné : {document.name}</p>
        ) : null}
      </div>

      {errors.form ? <FormAlert>{errors.form}</FormAlert> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Enregistrement...' : submitLabel}
      </Button>
    </form>
  )
}
