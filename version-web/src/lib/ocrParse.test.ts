import { describe, expect, it } from 'vitest'

import {
  extractAmount,
  extractDates,
  extractWeightKg,
  parseOcrText,
} from '../../../supabase/functions/ocr-extract/parse'

const ORDONNANCE = `Clinique Vétérinaire des Lilas
ORDONNANCE
Le 12/03/2026
Patient : Luna - Chat - Poids : 4,2 kg
Diagnostic : Otite externe
Traitement : Métacam 1,5 mg/ml, 0,1 mg/kg une fois par jour pendant 5 jours
Amoxicilline + acide clavulanique 12,5 mg/kg matin et soir
Prochain contrôle le 20/03/2026`

const VACCIN = `CARNET DE SANTÉ - VACCINATION
Date : 5 septembre 2026
Poids : 28 kg
Vaccin : CHPPi + Leptospirose, rage
Lot n° A4521
Rappel annuel le 05/09/2027`

const FACTURE = `FACTURE n°2026-441
Date: 2026-10-02
Consultation et soins
TVA 20%
Total TTC : 78,50 €`

const ANALYSE = `Laboratoire Vet'Lab - Bilan sanguin
Prélèvement du 14-11-2026
Poids: 31,2 kg
Créatinine 11 mg/L
Conclusion : Fonction rénale normale`

describe('parseur OCR', () => {
  it('extrait poids, dates et montants', () => {
    expect(extractWeightKg('Poids : 4,2 kg')).toBe(4.2)
    expect(extractWeightKg('Poids 850 g')).toBe(0.85)
    expect(extractWeightKg('0,1 mg/kg pendant 5 jours')).toBeNull()
    expect(extractDates('le 5 septembre 2026 et 02/10/26').map((d) => d.iso)).toEqual([
      '2026-09-05',
      '2026-10-02',
    ])
    expect(extractDates('31/02/2026')).toEqual([])
    expect(extractAmount('Sous-total 10 € Total TTC : 78,50 €')).toBe(78.5)
  })

  it('structure une ordonnance (poids, molécules, date)', () => {
    const r = parseOcrText(ORDONNANCE, 'scan.jpg')
    expect(r.category).toBe('ordonnance')
    expect(r.poids_kg).toBe(4.2)
    expect(r.date_event).toBe('2026-03-12')
    expect(r.molecules).toEqual(
      expect.arrayContaining(['Méloxicam', 'Amoxicilline', 'Acide clavulanique']),
    )
    expect(r.diagnostic).toBe('Otite externe')
    expect(r.dates).toContain('2026-03-20')
  })

  it('reprend tout le bloc traitement (posologie, durée)', () => {
    const r = parseOcrText(
      'ORDONNANCE\nTraitement :\n- Clavaseptin 250 mg\n1 comprimé matin et soir\npendant 10 jours\nPoids : 18,5 kg',
    )
    expect(r.traitement).toContain('1 comprimé matin et soir')
    expect(r.traitement).toContain('10 jours')
    expect(r.traitement).not.toContain('Poids')
    expect(r.poids_kg).toBe(18.5)
  })

  it('arrête le diagnostic avant la signature et détecte oméprazole/probiotique', () => {
    const r = parseOcrText(
      'ORDONNANCE\nDiagnostic : Troubles digestifs (suspicion de gastrite légère).\nDr. Pauline Martin\nVétérinaire - N° d\'ordre: 31876\nTraitement :\n• Oméprazole (Gastroprotect® 10 mg)\n1 comprimé par jour\n• Probiotique vétérinaire (Fortiflora®)',
    )
    expect(r.diagnostic).toBe('Troubles digestifs (suspicion de gastrite légère).')
    expect(r.molecules).toEqual(expect.arrayContaining(['Oméprazole', 'Probiotique']))
  })

  it('ignore la date de rappel pour la date de l’événement', () => {
    const r = parseOcrText(VACCIN)
    expect(r.category).toBe('vaccination')
    expect(r.date_event).toBe('2026-09-05')
    expect(r.molecules).toEqual(expect.arrayContaining(['CHPPi', 'Leptospirose', 'Rage']))
  })

  it('taux de pré-remplissage ≥ 80 % sur documents lisibles', () => {
    const cases: Array<[string, Array<(r: ReturnType<typeof parseOcrText>) => boolean>]> = [
      [ORDONNANCE, [(r) => r.category === 'ordonnance', (r) => r.poids_kg === 4.2, (r) => r.date_event === '2026-03-12', (r) => r.molecules.length >= 2, (r) => r.diagnostic !== '']],
      [VACCIN, [(r) => r.category === 'vaccination', (r) => r.poids_kg === 28, (r) => r.date_event === '2026-09-05', (r) => r.molecules.length >= 2]],
      [FACTURE, [(r) => r.category === 'facture', (r) => r.montant === 78.5, (r) => r.date_event === '2026-10-02']],
      [ANALYSE, [(r) => r.category === 'analyse_sanguine', (r) => r.poids_kg === 31.2, (r) => r.date_event === '2026-11-14', (r) => r.diagnostic !== '']],
    ]
    let ok = 0
    let total = 0
    for (const [text, checks] of cases) {
      const r = parseOcrText(text)
      for (const check of checks) {
        total += 1
        if (check(r)) ok += 1
      }
    }
    expect(ok / total).toBeGreaterThanOrEqual(0.8)
  })
})
