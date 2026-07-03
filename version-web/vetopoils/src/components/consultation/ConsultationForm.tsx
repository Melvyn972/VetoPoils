import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import {
  getTodayDateInputValue,
  isValidEmail,
  saveConsultationResult,
} from '../../lib/consultation'
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
}

function buildInitialForm(defaultVeterinarianName: string, defaultClinic: string): ConsultationFormData {
  return {
    veterinarianName: defaultVeterinarianName,
    clinic: defaultClinic,
    visitDate: getTodayDateInputValue(),
    nextAppointment: '',
    diagnosis: '',
    notes: '',
    guestIdentity: {
      fullName: '',
      email: '',
    },
  }
}

export function ConsultationForm() {
  const navigate = useNavigate()
  const { isGuest, isConnected, defaultVeterinarianName, defaultClinic } = useAuth()

  const [form, setForm] = useState(() =>
    buildInitialForm(defaultVeterinarianName, defaultClinic),
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<K extends keyof ConsultationFormData>(key: K, value: ConsultationFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {}

    if (!form.veterinarianName.trim()) {
      nextErrors.veterinarianName = 'Le nom du vétérinaire est requis'
    }

    if (!form.diagnosis.trim()) {
      nextErrors.diagnosis = 'Le diagnostic est requis'
    }

    if (isGuest) {
      if (!form.guestIdentity?.fullName.trim()) {
        nextErrors.fullName = 'Le nom complet est requis'
      }

      if (!form.guestIdentity?.email.trim()) {
        nextErrors.email = "L'email est requis"
      } else if (!isValidEmail(form.guestIdentity.email)) {
        nextErrors.email = 'Email invalide'
      }
    }

    return nextErrors
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    const animalName = isConnected ? 'Luna' : 'votre animal'

    saveConsultationResult({ animalName })

    navigate('/succes')
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
        {isGuest && (
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
        )}

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
          label="Prochain rendez-vous"
          type="date"
          value={form.nextAppointment}
          onChange={(event) => updateField('nextAppointment', event.target.value)}
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

        <Button type="submit" disabled={isSubmitting}>
          Enregistrer la consultation &gt;
        </Button>
      </div>
    </form>
  )
}
