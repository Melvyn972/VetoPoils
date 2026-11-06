import { createContext, useContext } from 'react'

import type { Animal } from '../types/owner'

export interface OwnerData {
  animals: Animal[] | null
  loading: boolean
  error: string | null
  reloadAnimals: () => void
  dueReminders: number
  reloadReminders: () => void
}

export const OwnerDataContext = createContext<OwnerData | null>(null)

export function useOwnerData() {
  const context = useContext(OwnerDataContext)
  if (!context) throw new Error('useOwnerData doit être utilisé dans l’espace propriétaire.')
  return context
}
