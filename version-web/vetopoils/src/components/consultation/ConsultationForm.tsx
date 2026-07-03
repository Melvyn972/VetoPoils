import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useVetSession } from '../../context/VetSessionContext'
import { getTodayDateInputValue, saveConsultationResult } from '../../lib/consultation'
import { submitVetConsultation, uploadVetDocument } from '../../lib/vet'
import type { ConsultationFormData } from '../../types/consultation'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { AnimalSummary } from './AnimalSummary'
import { GuestIdentityFields } from './GuestIdentityFields'

interface FormErrors {
  fullName?: string
  email?: string
  veterinarianName?: string
  diagnosis?: string
  form?: string
}

function buildInitialForm(): ConsultationFormData {
  return {
    veterinarianName: '',
    clinic: '',
    visitDate: getTodayDateInputValue(),
    nextAppointment: '',
    diagnosis: '',
    notes: '',
    weightKg: '',
    guestIdentity: {
      fullName: '',
      email: '',
    },
  }
}

export function ConsultationForm() {
  const navigate = useNavigate()
  const { token, dossier } = useVetSession()
  const [form, setForm] = useState(buildInitialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [document, setDocument] = useState<File | null>(null)

  function updateField<K extends keyof ConsultationFormData>(key: K, value: ConsultationFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }))
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {}

    if (!form.veterinarianName.trim()) {
      nextErrors.veterinarianName = 'Le nom du vétérinaire est requis'
    }

    if (!form.diagnosis.trim()) {
      nextErrors.diagnosis = 'Le diagnostic est requis'
    }

    if (!form.guestIdentity?.fullName.trim()) {
      nextErrors.fullName = 'Le nom complet est requis'
    }

    if (!form.guestIdentity?.email.trim()) {
      nextErrors.email = "L'email est requis"
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !dossier) return

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

    try {
      await submitVetConsultation({
        token,
        veterinarianName: form.veterinarianName,
        clinic: form.clinic,
        diagnosis: form.diagnosis,
        notes: [
          form.notes.trim(),
          form.guestIdentity?.fullName ? `Vétérinaire : ${form.guestIdentity.fullName}` : null,
          form.guestIdentity?.email ? `Email : ${form.guestIdentity.email}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
        weightKg: parsedWeight,
      })

      if (document) {
        await uploadVetDocument({ token, dossier, file: document })
      }

      saveConsultationResult({ animalName: dossier.animal.nom })
      navigate('/succes')
    } catch (submitError) {
      setErrors({
        form:
          submitError instanceof Error
            ? submitError.message
            : 'Impossible d’enregistrer la consultation.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="font-title text-2xl font-bold text-fg-primary">
          Compte rendu de consultation
        </h1>
        <AnimalSummary />
      </div>

      <div className="flex flex-col gap-4 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4">
        <GuestIdentityFields
          fullName={form.guestIdentity?.fullName ?? ''}
          email={form.guestIdentity?.email ?? ''}
          errors={{
            fullName: errors.fullName,
            email: errors.email,
          }}
          onFullNameChange={(value) =>
            updateField('guestIdentity', {
              fullName: value,
              email: form.guestIdentity?.email ?? '',
            })
          }
          onEmailChange={(value) =>
            updateField('guestIdentity', {
              fullName: form.guestIdentity?.fullName ?? '',
              email: value,
            })
          }
        />

        <Input
          label="Nom du vétérinaire"
          required
          value={form.veterinarianName}
          onChange={(event) => updateField('veterinarianName', event.target.value)}
          placeholder="Dr. Martin"
          error={errors.veterinarianName}
        />

        <Input
          label="Clinique"
          value={form.clinic}
          onChange={(event) => updateField('clinic', event.target.value)}
          placeholder="Clinique du Parc"
        />

        <Input
          label="Date de la visite"
          type="date"
          value={form.visitDate}
          onChange={(event) => updateField('visitDate', event.target.value)}
        />

        <Input
          label="Poids (kg)"
          value={form.weightKg}
          onChange={(event) => updateField('weightKg', event.target.value)}
          placeholder="12.5"
        />

        <Input
          label="Diagnostic"
          required
          value={form.diagnosis}
          onChange={(event) => updateField('diagnosis', event.target.value)}
          placeholder="Ex: Otite externe légère"
          error={errors.diagnosis}
        />

        <Textarea
          label="Notes & traitement"
          value={form.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          placeholder="Observations, prescriptions, recommandations..."
        />

        <div className="flex flex-col gap-2">
          <label className="font-body text-sm font-medium text-fg-primary">
            Document médical (optionnel)
          </label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
            className="font-body text-sm text-fg-secondary"
          />
        </div>

        {errors.form ? <p className="font-body text-sm text-red-600">{errors.form}</p> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer la consultation'}
        </Button>
      </div>
    </form>
  )
}
