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

import { ensureOwnerProfile, fetchOwnerProfile } from '../features/owner/api'
import { trackEvent } from '../lib/analytics'
import {
  clearGuestMode,
  getUserDisplayName,
  isGuestModeStored,
  mapAuthError,
  setGuestMode,
} from '../lib/auth'
import { isSupabaseConfigured } from '../lib/env'
import { getSupabase } from '../lib/supabase'
import { ensureVetProfile, fetchVetProfile } from '../lib/vetProfile'
import type { OwnerProfile } from '../types/owner'
import type { VetProfile } from '../types/vetProfile'

export type AccountRole = 'owner' | 'veterinarian'

interface AuthContextValue {
  mode: 'guest' | 'connected' | 'unauthenticated'
  isLoading: boolean
  isGuest: boolean
  isConnected: boolean
  isOwner: boolean
  isVet: boolean
  role: AccountRole | null
  isSupabaseReady: boolean
  user: User | null
  profile: OwnerProfile | null
  vetProfile: VetProfile | null
  displayName: string
  defaultVeterinarianName: string
  defaultClinic: string
  defaultEmail: string
  continueAsGuest: () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: AccountRole | null }>
  signUp: (
    fullName: string,
    email: string,
    password: string,
    clinic?: string,
    extra?: { telephone?: string; numeroOrdre?: string },
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signUpOwner: (values: {
    prenom: string
    nom: string
    email: string
    password: string
  }) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshVetProfile: () => Promise<void>
  refreshAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function redirectTo(path: string) {
  return `${window.location.origin}${path}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [guestStored, setGuestStored] = useState(isGuestModeStored)
  const [role, setRole] = useState<AccountRole | null>(null)
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
  const [vetProfile, setVetProfile] = useState<VetProfile | null>(null)

  const supabase = getSupabase()
  const isSupabaseReady = isSupabaseConfigured() && supabase !== null

  const loadAccount = useCallback(async (user: User | undefined) => {
    if (!user) {
      setRole(null)
      setProfile(null)
      setVetProfile(null)
      return null
    }

    try {
      let vet = await fetchVetProfile(user.id)
      let owner = await fetchOwnerProfile(user.id)
      const accountType = String(user.user_metadata?.account_type ?? '')

      if (!vet && accountType === 'veterinarian') {
        vet = await ensureVetProfile().catch(() => null)
      }
      if (!owner && accountType !== 'veterinarian') {
        owner = await ensureOwnerProfile().catch(() => null)
      }

      if (vet && !owner) {
        setVetProfile(vet)
        setProfile(null)
        setRole('veterinarian')
        return 'veterinarian' as const
      }

      if (owner) {
        setProfile(owner)
        setVetProfile(vet)
        setRole(vet && !owner ? 'veterinarian' : 'owner')
        return 'owner' as const
      }

      if (vet) {
        setVetProfile(vet)
        setProfile(null)
        setRole('veterinarian')
        return 'veterinarian' as const
      }

      setRole(null)
      setProfile(null)
      setVetProfile(null)
      return null
    } catch {
      setRole(null)
      setProfile(null)
      setVetProfile(null)
      return null
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) {
        clearGuestMode()
        setGuestStored(false)
      }
      setSession(data.session)
      void loadAccount(data.session?.user).finally(() => {
        if (mounted) setIsLoading(false)
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
      window.setTimeout(() => {
        void loadAccount(nextSession?.user).finally(() => setIsLoading(false))
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadAccount, supabase])

  const continueAsGuest = useCallback(() => {
    setGuestMode()
    setGuestStored(true)
    setSession(null)
    setRole(null)
    setProfile(null)
    setVetProfile(null)
    if (supabase) void supabase.auth.signOut()
  }, [supabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.', role: null }
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return { error: mapAuthError(error.message), role: null }
      const nextRole = await loadAccount(data.user)
      if (!nextRole) return { error: 'Profil introuvable pour ce compte.', role: null }
      trackEvent('login')
      return { error: null, role: nextRole }
    },
    [loadAccount, supabase],
  )

  const signUp = useCallback(
    async (
      fullName: string,
      email: string,
      password: string,
      clinic?: string,
      extra?: { telephone?: string; numeroOrdre?: string },
    ) => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.', needsEmailConfirmation: false }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo('/auth/callback'),
          data: {
            account_type: 'veterinarian',
            full_name: fullName.trim(),
            clinique: clinic?.trim() || '',
            telephone: extra?.telephone?.trim() || '',
            numero_ordre: extra?.numeroOrdre?.trim() || '',
          },
        },
      })
      if (error) return { error: mapAuthError(error.message), needsEmailConfirmation: false }
      trackEvent('signup_vet')
      if (data.session?.user) await loadAccount(data.session.user)
      return { error: null, needsEmailConfirmation: !data.session }
    },
    [loadAccount, supabase],
  )

  const signUpOwner = useCallback(
    async (values: { prenom: string; nom: string; email: string; password: string }) => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.', needsEmailConfirmation: false }
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          emailRedirectTo: redirectTo('/auth/callback'),
          data: {
            account_type: 'owner',
            prenom: values.prenom.trim(),
            nom: values.nom.trim(),
          },
        },
      })
      if (error) return { error: mapAuthError(error.message), needsEmailConfirmation: false }
      trackEvent('signup_owner')
      if (data.session?.user) await loadAccount(data.session.user)
      return { error: null, needsEmailConfirmation: !data.session }
    },
    [loadAccount, supabase],
  )

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.' }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo('/reinitialiser-mot-de-passe'),
      })
      if (error) return { error: mapAuthError(error.message) }
      return { error: null }
    },
    [supabase],
  )

  const updatePassword = useCallback(
    async (password: string) => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.' }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { error: mapAuthError(error.message) }
      return { error: null }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    clearGuestMode()
    setGuestStored(false)
    setRole(null)
    setProfile(null)
    setVetProfile(null)
    setSession(null)
    if (supabase) await supabase.auth.signOut()
  }, [supabase])

  const refreshVetProfile = useCallback(async () => {
    await loadAccount(session?.user)
  }, [loadAccount, session?.user])

  const user = session?.user ?? null
  const isVet = role === 'veterinarian'
  const isOwner = role === 'owner'
  const mode = session && role ? 'connected' : guestStored ? 'guest' : 'unauthenticated'
  const displayName = isOwner
    ? `${profile?.prenom ?? ''} ${profile?.nom ?? ''}`.trim() || getUserDisplayName(user?.user_metadata, user?.email)
    : isVet
      ? vetProfile?.nom_complet || getUserDisplayName(user?.user_metadata, user?.email)
      : guestStored
        ? 'Invité'
        : 'Utilisateur'

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      isLoading,
      isGuest: mode === 'guest',
      isConnected: isVet,
      isOwner,
      isVet,
      role,
      isSupabaseReady,
      user,
      profile,
      vetProfile,
      displayName,
      defaultVeterinarianName: isVet ? displayName : '',
      defaultClinic: vetProfile?.clinique ?? '',
      defaultEmail: user?.email ?? '',
      continueAsGuest,
      signIn,
      signUp,
      signUpOwner,
      requestPasswordReset,
      updatePassword,
      signOut,
      refreshVetProfile,
      refreshAccount: refreshVetProfile,
    }),
    [
      mode,
      isLoading,
      isVet,
      isOwner,
      role,
      isSupabaseReady,
      user,
      profile,
      vetProfile,
      displayName,
      continueAsGuest,
      signIn,
      signUp,
      signUpOwner,
      requestPasswordReset,
      updatePassword,
      signOut,
      refreshVetProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return context
}
