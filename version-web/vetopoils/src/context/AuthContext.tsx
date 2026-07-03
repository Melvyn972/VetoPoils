import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  clearGuestMode,
  getUserDisplayName,
  isGuestModeStored,
  mapAuthError,
  setGuestMode,
} from '../lib/auth'
import { isSupabaseConfigured } from '../lib/env'
import { getSupabase } from '../lib/supabase'
import { fetchVetProfile } from '../lib/vetProfile'
import type { VetProfile } from '../types/vetProfile'

export type AuthMode = 'guest' | 'connected' | 'unauthenticated'

interface AuthContextValue {
  mode: AuthMode
  isLoading: boolean
  isGuest: boolean
  isConnected: boolean
  isSupabaseReady: boolean
  user: User | null
  vetProfile: VetProfile | null
  displayName: string
  defaultVeterinarianName: string
  defaultClinic: string
  defaultEmail: string
  continueAsGuest: () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    fullName: string,
    email: string,
    password: string,
    clinic?: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshVetProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function resolveMode(session: Session | null, guestStored: boolean): AuthMode {
  if (session) return 'connected'
  if (guestStored) return 'guest'
  return 'unauthenticated'
}

function getDefaultVeterinarianName(user: User | null, vetProfile: VetProfile | null): string {
  if (vetProfile?.nom_complet) return vetProfile.nom_complet
  if (!user) return ''
  return getUserDisplayName(user.user_metadata, user.email)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [guestStored, setGuestStored] = useState(isGuestModeStored)
  const [vetProfile, setVetProfile] = useState<VetProfile | null>(null)

  const supabase = getSupabase()
  const isSupabaseReady = isSupabaseConfigured() && supabase !== null

  const loadVetProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setVetProfile(null)
      return
    }

    try {
      setVetProfile(await fetchVetProfile(userId))
    } catch {
      setVetProfile(null)
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return

      if (data.session) {
        clearGuestMode()
        setGuestStored(false)
      }

      setSession(data.session)
      void loadVetProfile(data.session?.user.id).finally(() => {
        if (isMounted) setIsLoading(false)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        clearGuestMode()
        setGuestStored(false)
      }

      setSession(nextSession)
      void loadVetProfile(nextSession?.user.id).finally(() => {
        setIsLoading(false)
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadVetProfile, supabase])

  const continueAsGuest = useCallback(() => {
    setGuestMode()
    setGuestStored(true)
    setSession(null)
    setVetProfile(null)

    if (supabase) {
      void supabase.auth.signOut()
    }
  }, [supabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: 'Supabase n’est pas configuré' }
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        return { error: mapAuthError(error.message) }
      }

      return { error: null }
    },
    [supabase],
  )

  const signUp = useCallback(
    async (fullName: string, email: string, password: string, clinic?: string) => {
      if (!supabase) {
        return { error: 'Supabase n’est pas configuré', needsEmailConfirmation: false }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            account_type: 'veterinarian',
            full_name: fullName.trim(),
            clinique: clinic?.trim() || '',
          },
        },
      })

      if (error) {
        return { error: mapAuthError(error.message), needsEmailConfirmation: false }
      }

      const needsEmailConfirmation = !data.session

      return { error: null, needsEmailConfirmation }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    clearGuestMode()
    setGuestStored(false)
    setVetProfile(null)

    if (supabase) {
      await supabase.auth.signOut()
    }

    setSession(null)
  }, [supabase])

  const refreshVetProfile = useCallback(async () => {
    await loadVetProfile(session?.user.id)
  }, [loadVetProfile, session?.user.id])

  const user = session?.user ?? null
  const mode = resolveMode(session, guestStored)
  const displayName =
    mode === 'guest' ? 'Invité' : getDefaultVeterinarianName(user, vetProfile) || 'Vétérinaire'

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      isLoading,
      isGuest: mode === 'guest',
      isConnected: mode === 'connected',
      isSupabaseReady,
      user,
      vetProfile,
      displayName,
      defaultVeterinarianName: mode === 'connected' ? getDefaultVeterinarianName(user, vetProfile) : '',
      defaultClinic: vetProfile?.clinique ?? '',
      defaultEmail: user?.email ?? '',
      continueAsGuest,
      signIn,
      signUp,
      signOut,
      refreshVetProfile,
    }),
    [
      mode,
      isLoading,
      isSupabaseReady,
      user,
      vetProfile,
      displayName,
      continueAsGuest,
      signIn,
      signUp,
      signOut,
      refreshVetProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
