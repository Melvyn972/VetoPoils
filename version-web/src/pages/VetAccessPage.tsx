import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useVetSession } from '../context/VetSessionContext'
import { MobileShell } from '../components/layout/MobileShell'
import { Button } from '../components/ui/Button'
import { FormAlert } from '../components/ui/FormAlert'
import { Input } from '../components/ui/Input'
import { isVetAccessCode, normalizeVetAccessCode } from '../lib/vet'
import { mapVetRpcError } from '../lib/vetErrors'

export function VetAccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { activateToken } = useVetSession()
  const tokenFromUrl = searchParams.get('token')
  const [code, setCode] = useState(() =>
    tokenFromUrl ? normalizeVetAccessCode(tokenFromUrl) : '',
  )
  const [error, setError] = useState<string | null>(
    (location.state as { error?: string } | null)?.error ?? null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!tokenFromUrl || !isVetAccessCode(tokenFromUrl)) return

    let cancelled = false
    setIsSubmitting(true)
    activateToken(tokenFromUrl)
      .then(() => {
        if (!cancelled) navigate('/consultation', { replace: true })
      })
      .catch((submitError) => {
        if (!cancelled) {
          setError(
            mapVetRpcError(
              submitError instanceof Error ? submitError : new Error('Code invalide.'),
            ),
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsSubmitting(false)
      })

    return () => {
      cancelled = true
    }
  }, [activateToken, navigate, tokenFromUrl])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await activateToken(code)
      navigate('/consultation', { replace: true })
    } catch (submitError) {
      setError(mapVetRpcError(submitError instanceof Error ? submitError : new Error('Code invalide.')))
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

        {error ? <FormAlert>{error}</FormAlert> : null}

        <Button type="submit" disabled={isSubmitting || !isVetAccessCode(code)}>
          {isSubmitting ? 'Vérification...' : 'Accéder au dossier'}
        </Button>
      </form>
    </MobileShell>
  )
}
