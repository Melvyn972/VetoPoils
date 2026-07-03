import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  clearVetToken,
  fetchVetDossier,
  getStoredVetToken,
  isVetAccessCode,
  normalizeVetAccessCode,
  saveVetToken,
} from '../lib/vet'
import type { VetDossier } from '../types/vet'

interface VetSessionContextValue {
  token: string | null
  dossier: VetDossier | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  activateToken: (token: string) => Promise<void>
  clearSession: () => void
}

const VetSessionContext = createContext<VetSessionContextValue | null>(null)

export function VetSessionProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [dossier, setDossier] = useState<VetDossier | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDossier = useCallback(async (nextToken: string) => {
    const normalized = normalizeVetAccessCode(nextToken)
    if (!isVetAccessCode(normalized)) {
      throw new Error('Le code doit comporter 6 caractères.')
    }

    const nextDossier = await fetchVetDossier(normalized)
    saveVetToken(normalized)
    setToken(normalized)
    setDossier(nextDossier)
    setError(null)
  }, [])

  const refresh = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      await loadDossier(token)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Accès refusé.')
      setDossier(null)
    } finally {
      setIsLoading(false)
    }
  }, [loadDossier, token])

  const activateToken = useCallback(
    async (nextToken: string) => {
      setIsLoading(true)
      try {
        await loadDossier(nextToken)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Accès refusé.')
        setDossier(null)
        setToken(null)
        clearVetToken()
        throw loadError
      } finally {
        setIsLoading(false)
      }
    },
    [loadDossier],
  )

  const clearSession = useCallback(() => {
    clearVetToken()
    setToken(null)
    setDossier(null)
    setError(null)
  }, [])

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    const initialToken = tokenFromUrl ?? getStoredVetToken()

    if (!initialToken) {
      setIsLoading(false)
      return
    }

    activateToken(initialToken).catch(() => {
      setIsLoading(false)
    })
  }, [activateToken, searchParams])

  const value = useMemo(
    () => ({
      token,
      dossier,
      isLoading,
      error,
      refresh,
      activateToken,
      clearSession,
    }),
    [token, dossier, isLoading, error, refresh, activateToken, clearSession],
  )

  return <VetSessionContext.Provider value={value}>{children}</VetSessionContext.Provider>
}

export function useVetSession() {
  const context = useContext(VetSessionContext)
  if (!context) {
    throw new Error('useVetSession doit être utilisé dans VetSessionProvider.')
  }
  return context
}
