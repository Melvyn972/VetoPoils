import { useEffect, useState } from 'react'

import { getSupabase } from '../../lib/supabase'
import { partnerMatchesAnimal } from '../../lib/cdc'
import type { VetAnimal } from '../../types/vet'

type Partner = {
  id: string
  nom: string
  categorie: string
  url: string
  description: string | null
  cibles: string[] | null
}

export function PartnerSuggestions({
  animal,
  contexte,
}: {
  animal?: Pick<VetAnimal, 'espece' | 'race'> | null
  contexte: string
}) {
  const [partners, setPartners] = useState<Partner[]>([])

  useEffect(() => {
    if (!animal) {
      setPartners([])
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    void supabase
      .from('partners')
      .select('id, nom, categorie, url, description, cibles')
      .eq('actif', true)
      .then(async ({ data }) => {
        const matches = ((data ?? []) as Partner[])
          .filter((partner) => partnerMatchesAnimal(partner, animal))
          .slice(0, 3)
        setPartners(matches)
      })
  }, [animal])

  if (!animal || partners.length === 0) return null

  async function openPartner(partner: Partner) {
    const supabase = getSupabase()
    try {
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('partner_clicks').insert({
            user_id: user.id,
            partner_id: partner.id,
            contexte,
          })
        }
      }
    } catch {
      // Le clic reste utile même si le tracking échoue.
    }
    window.open(partner.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="rounded-14 border border-dashed border-fg-tertiary/25 bg-surface px-4 py-3">
      <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-fg-tertiary">
        Suggestions partenaires
      </p>
      <p className="mt-1 font-body text-xs text-fg-secondary">
        Liens utiles selon l’espèce - ouverture dans un nouvel onglet.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {partners.map((partner) => (
          <li key={partner.id}>
            <button
              type="button"
              onClick={() => void openPartner(partner)}
              className="w-full rounded-12 bg-surface-secondary px-3 py-2 text-left transition-colors hover:bg-primary-15"
            >
              <span className="block font-body text-sm font-semibold text-fg-primary">{partner.nom}</span>
              <span className="block font-body text-xs text-fg-secondary">
                {partner.description ?? partner.categorie}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
