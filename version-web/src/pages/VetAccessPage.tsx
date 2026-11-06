import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useVetSession } from '../context/VetSessionContext'
import { MobileShell } from '../components/layout/MobileShell'
import { Button } from '../components/ui/Button'
import { FormAlert } from '../components/ui/FormAlert'
import { isVetAccessCode, normalizeVetAccessCode } from '../lib/vet'
import { getVetErrorMessage } from '../lib/vetErrors'

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
          setError(getVetErrorMessage(submitError, 'Code d’accès invalide. Vérifiez le code saisi.'))
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

    if (!isVetAccessCode(code)) {
      setError('Le code doit contenir 6 caractères (lettres et chiffres, sans 0, 1, I, O).')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await activateToken(code, { track: true })
      navigate('/consultation', { replace: true })
    } catch (submitError) {
      setError(getVetErrorMessage(submitError, 'Code d’accès invalide. Vérifiez le code saisi.'))
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
            Saisissez le code unique fourni par le propriétaire. Ce code est temporaire, à usage
            unique, et lié au dossier de l’animal. Un code déjà servi, expiré ou révoqué ne donne
            plus accès.
          </p>
        </div>

        <label className="font-body text-sm font-medium text-ink" htmlFor="vet-code">
          Code d’accès
        </label>
        <input
          id="vet-code"
          value={code}
          onChange={(event) =>
            setCode(normalizeVetAccessCode(event.target.value).replace(/[^2-9A-HJ-NP-Z]/g, ''))
          }
          maxLength={6}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label="Code d’accès"
          className="w-full rounded-2xl border border-line bg-white px-3 py-3 text-center font-title text-2xl font-semibold tracking-[0.45em] text-ink outline-none focus:border-primary"
        />
        <div className="grid grid-cols-6 gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span
              key={index}
              className="flex h-12 items-center justify-center rounded-xl border border-line bg-canvas font-title text-lg font-semibold"
            >
              {code[index] ?? ''}
            </span>
          ))}
        </div>
        <p className="font-body text-xs text-muted">
          6 caractères, sans 0, 1, I ni O — identique au code affiché sous le QR.
        </p>

        {error ? <FormAlert>{error}</FormAlert> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Vérification…' : 'Ouvrir le dossier'}
        </Button>
      </form>
    </MobileShell>
  )
}
