import { useState, type FormEvent } from 'react'

import { getTodayDateInputValue } from '../../lib/consultation'
import { getReminderTypeLabel, REMINDER_TYPES, type ReminderTypeValue } from '../../lib/medicalLabels'
import { mapVetRpcError } from '../../lib/vetErrors'
import { createVetReminder } from '../../lib/vet'
import type { VetReminder } from '../../types/vet'
import { Button } from '../ui/Button'
import { FormAlert } from '../ui/FormAlert'
import { Input } from '../ui/Input'
import { SelectField } from '../ui/SelectField'
import { Textarea } from '../ui/Textarea'

interface ReminderFormProps {
  animalId: string
  onCreated: (reminder: VetReminder) => void
}

export function ReminderForm({ animalId, onCreated }: ReminderFormProps) {
  const [type, setType] = useState<ReminderTypeValue>('rdv')
  const [dateEcheance, setDateEcheance] = useState(getTodayDateInputValue())
  const [titre, setTitre] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!titre.trim()) {
      setError('Le titre du rappel est requis.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const reminder = await createVetReminder({
        animalId,
        type,
        dateEcheance,
        titre: titre.trim(),
        notes,
      })
      onCreated(reminder as VetReminder)
      setTitre('')
      setNotes('')
      setType('rdv')
    } catch (submitError) {
      setError(mapVetRpcError(submitError instanceof Error ? submitError : new Error('Erreur inconnue')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="font-title text-lg font-semibold text-fg-primary">Créer un rappel</h2>
        <p className="mt-1 font-body text-sm text-fg-secondary">
          Le propriétaire sera notifié dans l’app mobile.
        </p>
      </div>

      <SelectField
        label="Type de rappel"
        required
        value={type}
        onChange={(value) => setType(value as ReminderTypeValue)}
        options={REMINDER_TYPES}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Date d’échéance"
          type="date"
          required
          value={dateEcheance}
          onChange={(event) => setDateEcheance(event.target.value)}
        />
        <Input
          label="Titre"
          required
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          placeholder={`Ex: ${getReminderTypeLabel(type)} de contrôle`}
        />
      </div>

      <Textarea
        label="Notes (optionnel)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Instructions pour le propriétaire..."
      />

      {error ? <FormAlert>{error}</FormAlert> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Création...' : 'Programmer le rappel'}
      </Button>
    </form>
  )
}
