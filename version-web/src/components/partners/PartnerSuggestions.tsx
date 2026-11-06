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

  if (!animal) return null

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
  }

  return (
    <section className="rounded-2xl border border-dashed border-line bg-white px-4 py-4">
      <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-muted">
        Suggestions partenaires
      </p>
      {partners.length === 0 ? (
        <p className="mt-2 font-body text-sm text-muted">
          Aucun partenaire ne correspond encore à cet animal. Les suggestions apparaîtront ici dès qu’une offre
          correspond à son espèce.
        </p>
      ) : (
        <>
          <p className="mt-1 font-body text-xs text-muted">Liens utiles selon l’espèce, ouverts dans un nouvel onglet.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {partners.map((partner) => (
              <li key={partner.id}>
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void openPartner(partner)}
                  className="block rounded-xl bg-canvas px-3 py-2 transition-colors hover:bg-primary-15"
                >
                  <span className="block font-body text-sm font-semibold text-ink">{partner.nom}</span>
                  <span className="block font-body text-xs text-muted">{partner.description ?? partner.categorie}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
