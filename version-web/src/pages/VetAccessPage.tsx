import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useVetSession } from '../context/VetSessionContext'
import { AuthFrame } from '../components/layout/AuthFrame'
import { VetWorkspace } from '../components/layout/VetWorkspace'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { FormAlert } from '../components/ui/FormAlert'
import { isVetAccessCode, normalizeVetAccessCode } from '../lib/vet'
import { getVetErrorMessage } from '../lib/vetErrors'

const CODE_LENGTH = 6

function cleanAccessCode(value: string) {
  return normalizeVetAccessCode(value).replace(/[^2-9A-HJ-NP-Z]/g, '').slice(0, CODE_LENGTH)
}

function emptySlots() {
  return Array.from({ length: CODE_LENGTH }, () => '')
}

export function VetAccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { activateToken } = useVetSession()
  const { isVet } = useAuth()
  const tokenFromUrl = searchParams.get('token')
  const [slots, setSlots] = useState(() => {
    const initial = tokenFromUrl ? cleanAccessCode(tokenFromUrl) : ''
    return emptySlots().map((slot, index) => initial[index] ?? slot)
  })
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const keyCommitted = useRef(false)
  const code = slots.join('')
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

  function focusSlot(index: number) {
    inputs.current[Math.max(0, Math.min(index, CODE_LENGTH - 1))]?.focus()
  }

  function writeFrom(index: number, raw: string) {
    const incoming = cleanAccessCode(raw)
    if (!incoming) return
    const target = Math.min(index + incoming.length, CODE_LENGTH - 1)
    setSlots((current) => {
      const next = [...current]
      let cursor = index
      for (const char of incoming) {
        if (cursor >= CODE_LENGTH) break
        next[cursor] = char
        cursor += 1
      }
      return next
    })
    setError(null)
    requestAnimationFrame(() => focusSlot(target))
  }

  function handleSlotKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const hasChar = Boolean(slots[index])
      setSlots((current) => {
        const next = [...current]
        if (hasChar) next[index] = ''
        else if (index > 0) next[index - 1] = ''
        return next
      })
      setError(null)
      if (!hasChar && index > 0) requestAnimationFrame(() => focusSlot(index - 1))
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusSlot(index - 1)
      return
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusSlot(index + 1)
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const char = cleanAccessCode(event.key)
      if (!char) return
      keyCommitted.current = true
      writeFrom(index, char)
      requestAnimationFrame(() => {
        keyCommitted.current = false
      })
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    writeFrom(index, event.clipboardData.getData('text'))
  }

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

  const form = (
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-title text-[28px] font-semibold tracking-[-0.03em] text-ink">Accès vétérinaire</h1>
          <p className="font-body text-sm leading-relaxed text-muted">
            Saisissez le code unique fourni par le propriétaire. Il est temporaire, lié au dossier
            de l’animal, et un code déjà servi, expiré ou révoqué ne donne plus accès.
          </p>
        </div>

        <div>
          <label id="vet-code-label" className="font-body text-sm font-medium text-ink" htmlFor="vet-code">
            Code d’accès
          </label>
          <div
            role="group"
            aria-labelledby="vet-code-label"
            className="mt-3 grid grid-cols-6 gap-2"
          >
            {slots.map((slot, index) => (
              <input
                key={index}
                ref={(node) => {
                  inputs.current[index] = node
                }}
                id={index === 0 ? 'vet-code' : undefined}
                value={slot}
                onChange={(event) => {
                  if (keyCommitted.current) return
                  const incoming = cleanAccessCode(event.target.value)
                  if (!incoming) {
                    if (event.target.value === '') {
                      setSlots((current) => current.map((currentSlot, slotIndex) => (slotIndex === index ? '' : currentSlot)))
                    }
                    return
                  }
                  const previous = slots[index]
                  const typed = previous && incoming.startsWith(previous) ? incoming.slice(previous.length) : incoming
                  writeFrom(index, typed || incoming)
                }}
                onKeyDown={(event) => handleSlotKeyDown(index, event)}
                onPaste={(event) => handlePaste(index, event)}
                onFocus={(event) => event.currentTarget.select()}
                maxLength={CODE_LENGTH}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                autoFocus={index === 0 && !tokenFromUrl}
                spellCheck={false}
                aria-label={`Caractère ${index + 1} sur 6`}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'vet-code-error' : 'vet-code-hint'}
                className="h-14 rounded-2xl border border-line bg-surface text-center font-title text-xl font-semibold text-ink uppercase outline-none focus:border-primary focus:ring-4 focus:ring-primary/12"
              />
            ))}
          </div>
          <p id="vet-code-hint" className="mt-3 font-body text-sm text-muted">
            6 caractères, sans 0, 1, I ni O. Identique au code affiché sous le QR.
          </p>
        </div>

        {error ? <div id="vet-code-error"><FormAlert>{error}</FormAlert></div> : null}

        <Button type="submit" loading={isSubmitting} className="vet-access-submit">
          {isSubmitting ? 'Vérification…' : 'Ouvrir le dossier'}
        </Button>
      </form>
  )

  if (isVet) return <VetWorkspace>{form}</VetWorkspace>
  return <AuthFrame>{form}</AuthFrame>
}
