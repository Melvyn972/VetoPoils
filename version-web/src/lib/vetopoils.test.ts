import { describe, expect, it } from 'vitest'

import { dateInputToIso, isValidEmail } from './consultation'
import { isVetAccessCode, normalizeVetAccessCode, buildEventPayload } from './vet'
import { mapVetRpcError, toVetError } from './vetErrors'

describe('codes d’accès vétérinaires', () => {
  it('normalise et accepte un code 6 caractères sans 0/1/O/I', () => {
    expect(normalizeVetAccessCode(' ab3def ')).toBe('AB3DEF')
    expect(isVetAccessCode('2A3B4C')).toBe(true)
    expect(isVetAccessCode('ABC10O')).toBe(false)
    expect(isVetAccessCode('ABCDE')).toBe(false)
  })
})

describe('consultation helpers', () => {
  it('valide un email', () => {
    expect(isValidEmail('veto@clinique.fr')).toBe(true)
    expect(isValidEmail('pas-un-email')).toBe(false)
  })

  it('convertit une date de visite en ISO midi UTC', () => {
    expect(dateInputToIso('2026-09-14')).toBe('2026-09-14T12:00:00.000Z')
    expect(dateInputToIso('14/09/2026')).toBeNull()
  })

  it('inclut p_date_event dans le payload RPC', () => {
    const payload = buildEventPayload({
      eventType: 'consultation',
      veterinarianName: 'Dr Martin',
      clinic: 'Clinique du Parc',
      notes: 'Otite',
      visitDate: '2026-09-14',
      weightKg: 12.5,
    })

    expect(payload.p_date_event).toBe('2026-09-14T12:00:00.000Z')
    expect(payload.p_type).toBe('consultation')
    expect(payload.p_titre).toContain('Dr Martin')
  })
})

describe('erreurs RPC', () => {
  it('traduit expiration, révocation et usage unique', () => {
    expect(mapVetRpcError(new Error('Code d’accès expiré.'))).toMatch(/expiré/i)
    expect(mapVetRpcError(new Error('Code d’accès révoqué.'))).toMatch(/révoqué/i)
    expect(mapVetRpcError(new Error('Code d’accès déjà utilisé.'))).toMatch(/déjà servi/i)
    expect(mapVetRpcError(new Error('Code d’accès invalide.'))).toMatch(/invalide/i)
    expect(mapVetRpcError(new Error('duplicate key value violates unique constraint'))).toMatch(/existe déjà/i)
    expect(mapVetRpcError(new Error('syntax error at or near SELECT'))).toBe(
      'Impossible de finaliser l’opération. Vérifiez le code d’accès et réessayez.',
    )
  })

  it('mappe un objet PostgREST (pas une instance Error)', () => {
    expect(toVetError({ message: "Code d'accès invalide.", code: 'P0001' }).message).toMatch(
      /invalide/i,
    )
    expect(toVetError({ message: 'Code d’accès expiré.', code: 'P0001' }).message).toMatch(/expiré/i)
  })
})
