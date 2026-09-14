import { describe, expect, it } from 'vitest'

import { dateInputToIso, isValidEmail } from './consultation'
import { suggestDocumentCategory, expensesToCsv, partnerMatchesAnimal } from './cdc'
import { computeHealthScore } from './healthScore'
import { buildVetDossierHtml, formatSexe } from './dossier'
import { isVetAccessCode, normalizeVetAccessCode, buildEventPayload } from './vet'
import { getVetErrorMessage, mapVetRpcError, toVetError } from './vetErrors'

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

  it('conserve le message usage unique après le chemin d’affichage UI', () => {
    const postgrest = { message: "Code d'accès déjà utilisé.", code: 'P0001' }
    const thrown = toVetError(postgrest)

    expect(thrown.message).toMatch(/déjà servi/i)
    expect(getVetErrorMessage(thrown)).toBe(thrown.message)
    expect(getVetErrorMessage(thrown)).toMatch(/déjà servi/i)

    // Re-mapper le message déjà traduit perd « déjà utilisé » et tombe sur le générique.
    expect(mapVetRpcError(thrown)).toBe(
      'Impossible de finaliser l’opération. Vérifiez le code d’accès et réessayez.',
    )
  })
})

describe('OCR et budget', () => {
  it('suggère une catégorie depuis le nom de fichier', () => {
    expect(suggestDocumentCategory('facture-clinique.pdf')).toBe('facture')
    expect(suggestDocumentCategory('ordonnance-otite.jpg')).toBe('ordonnance')
    expect(suggestDocumentCategory('vaccin-rappel.png')).toBe('vaccination')
    expect(suggestDocumentCategory('bilan-sanguin.pdf')).toBe('analyse_sanguine')
    expect(suggestDocumentCategory('scan.jpg')).toBe('autre')
  })

  it('exporte un CSV budget avec séparateur point-virgule', () => {
    const csv = expensesToCsv([
      {
        date_depense: '2026-09-14',
        category: 'veterinaire',
        montant: 45.5,
        description: 'Consultation',
        animalNom: 'Luna',
      },
    ])
    expect(csv).toContain('Catégorie')
    expect(csv).toContain('Vétérinaire')
    expect(csv).toContain('45,50')
    expect(csv).toContain('Luna')
  })

  it('filtre les partenaires selon l’espèce', () => {
    expect(partnerMatchesAnimal({ cibles: ['tous'] }, { espece: 'Chat', race: null })).toBe(true)
    expect(partnerMatchesAnimal({ cibles: ['chien'] }, { espece: 'Chat', race: null })).toBe(false)
    expect(partnerMatchesAnimal({ cibles: ['chat'] }, { espece: 'Chat', race: 'Siamois' })).toBe(true)
  })
})

describe('score santé', () => {
  it('pénalise l’absence de consultation et les rappels en retard', () => {
    const result = computeHealthScore({
      animal: { date_naissance: null, puce: null },
      events: [],
      reminders: [
        {
          type: 'vaccination',
          statut: 'actif',
          date_echeance: '2020-01-01T00:00:00.000Z',
        },
      ],
    })

    expect(result).not.toBeNull()
    expect(result!.score).toBeLessThan(100)
    expect(result!.details.lateReminderCount).toBe(1)
    expect(result!.details.factors.some((factor) => factor.code === 'vaccin_retard')).toBe(true)
  })

  it('reste à 100 sans facteur négatif', () => {
    const result = computeHealthScore({
      animal: { date_naissance: '2022-01-01', puce: '250269801234567' },
      events: [
        {
          type: 'consultation',
          status: 'validated',
          date_event: new Date().toISOString(),
          poids_kg: 5,
        },
        {
          type: 'consultation',
          status: 'validated',
          date_event: new Date(Date.now() - 40 * 86_400_000).toISOString(),
          poids_kg: 5.1,
        },
      ],
      reminders: [],
    })

    expect(result?.score).toBe(100)
  })
})

describe('dossier PDF', () => {
  it('formate le sexe et inclut le nom de l’animal', () => {
    expect(formatSexe('male')).toBe('Mâle')
    expect(formatSexe('femelle')).toBe('Femelle')
    const html = buildVetDossierHtml({
      animal: {
        id: 'a1',
        nom: 'Luna',
        espece: 'Chat',
        race: 'Siamois',
        date_naissance: '2022-01-01',
        sexe: 'femelle',
        couleur: 'gris',
        puce: '123',
        photo_path: null,
        proprietaire_id: 'p1',
      },
      medical_events: [],
      documents: [],
    })
    expect(html).toContain('Luna')
    expect(html).toContain('Femelle')
    expect(html).toContain("Vet'OPoil")
  })
})

