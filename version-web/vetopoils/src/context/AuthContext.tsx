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

export type AuthMode = 'guest' | 'connected' | 'unauthenticated'

interface AuthContextValue {
  mode: AuthMode
  isLoading: boolean
  isGuest: boolean
  isConnected: boolean
  isSupabaseReady: boolean
  user: User | null
  displayName: string
  defaultVeterinarianName: string
  defaultClinic: string
  continueAsGuest: () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function resolveMode(session: Session | null, guestStored: boolean): AuthMode {
  if (session) return 'connected'
  if (guestStored) return 'guest'
  return 'unauthenticated'
}

function getDefaultVeterinarianName(user: User | null): string {
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

  const supabase = getSupabase()
  const isSupabaseReady = isSupabaseConfigured() && supabase !== null

  // #region agent log
  fetch('http://127.0.0.1:7933/ingest/9587ca61-8228-4ee6-b45f-c079cf435a6e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af1613'},body:JSON.stringify({sessionId:'af1613',location:'AuthContext.tsx:init',message:'auth provider supabase ready',data:{isSupabaseConfigured:isSupabaseConfigured(),supabaseClientNull:supabase===null,isSupabaseReady},timestamp:Date.now(),hypothesisId:'C-D'})}).catch(()=>{});
  // #endregion

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
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        clearGuestMode()
        setGuestStored(false)
      }

      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const continueAsGuest = useCallback(() => {
    setGuestMode()
    setGuestStored(true)
    setSession(null)

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
    async (fullName: string, email: string, password: string) => {
      if (!supabase) {
        return { error: 'Supabase n’est pas configuré', needsEmailConfirmation: false }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
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

    if (supabase) {
      await supabase.auth.signOut()
    }

    setSession(null)
  }, [supabase])

  const user = session?.user ?? null
  const mode = resolveMode(session, guestStored)
  const displayName = mode === 'guest' ? 'Invité' : getUserDisplayName(user?.user_metadata, user?.email)

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      isLoading,
      isGuest: mode === 'guest',
      isConnected: mode === 'connected',
      isSupabaseReady,
      user,
      displayName,
      defaultVeterinarianName: mode === 'connected' ? getDefaultVeterinarianName(user) : '',
      defaultClinic: '',
      continueAsGuest,
      signIn,
      signUp,
      signOut,
    }),
    [
      mode,
      isLoading,
      isSupabaseReady,
      user,
      displayName,
      continueAsGuest,
      signIn,
      signUp,
      signOut,
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
