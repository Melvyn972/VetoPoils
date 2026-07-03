import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'

import type { Animal } from '../types/consultation'

export type AuthMode = 'guest' | 'connected'

interface AuthContextValue {
  mode: AuthMode
  isGuest: boolean
  isConnected: boolean
  animal: Animal | null
  defaultVeterinarianName: string
  defaultClinic: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

const MOCK_ANIMAL: Animal = {
  name: 'Luna',
  breed: 'Golden Retriever',
  age: 3,
}

const MOCK_VETERINARIAN = 'Dr. Martin'
const MOCK_CLINIC = 'Clinique du Parc'

function parseAuthMode(value: string | null): AuthMode {
  return value === 'connected' ? 'connected' : 'guest'
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [searchParams] = useSearchParams()
  const mode = parseAuthMode(searchParams.get('mode'))

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      isGuest: mode === 'guest',
      isConnected: mode === 'connected',
      animal: mode === 'connected' ? MOCK_ANIMAL : null,
      defaultVeterinarianName: mode === 'connected' ? MOCK_VETERINARIAN : '',
      defaultClinic: mode === 'connected' ? MOCK_CLINIC : '',
    }),
    [mode],
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
