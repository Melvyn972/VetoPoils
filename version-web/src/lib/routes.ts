import type { AccountRole } from '../context/AuthContext'

export function homePath(role: AccountRole | null) {
  return role === 'veterinarian' ? '/mes-patients' : '/espace'
}

export const SELECTED_ANIMAL_KEY = 'vetopoil-selected-animal'

export function rememberAnimal(id: string) {
  localStorage.setItem(SELECTED_ANIMAL_KEY, id)
}

export function rememberedAnimal() {
  return localStorage.getItem(SELECTED_ANIMAL_KEY)
}
