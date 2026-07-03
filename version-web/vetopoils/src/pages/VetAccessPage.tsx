import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useVetSession } from '../context/VetSessionContext'
import { MobileShell } from '../components/layout/MobileShell'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { isVetAccessCode, normalizeVetAccessCode } from '../lib/vet'

export function VetAccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activateToken } = useVetSession()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(
    (location.state as { error?: string } | null)?.error ?? null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await activateToken(code)
      navigate('/consultation', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Code invalide.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MobileShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
        <div className="flex flex-col gap-3">
          <h1 className="font-title text-2xl font-bold text-fg-primary">Accès vétérinaire</h1>
          <p className="font-body text-sm leading-relaxed text-fg-secondary">
            Saisissez le code unique fourni par le propriétaire. Ce code est temporaire et lié au
            dossier de l’animal.
          </p>
        </div>

        <Input
          label="Code d’accès"
          required
          value={code}
          onChange={(event) =>
            setCode(normalizeVetAccessCode(event.target.value).replace(/[^2-9A-HJ-NP-Z]/g, ''))
          }
          placeholder="ABC123"
          maxLength={6}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="text-center text-lg font-semibold tracking-[0.35em]"
        />

        {error ? <p className="font-body text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={isSubmitting || !isVetAccessCode(code)}>
          {isSubmitting ? 'Vérification...' : 'Accéder au dossier'}
        </Button>
      </form>
    </MobileShell>
  )
}
