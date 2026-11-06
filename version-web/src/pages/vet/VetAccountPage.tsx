import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'

import { PageHeader } from '../../components/layout/AppShell'
import { VetWorkspace } from '../../components/layout/VetWorkspace'
import { ListSkeleton } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { FormAlert } from '../../components/ui/FormAlert'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../lib/errors'
import { updateVetProfile } from '../../lib/vetProfile'

export function VetAccountPage() {
  const { isLoading, isVet, isOwner, user, vetProfile, refreshAccount } = useAuth()
  const [nom, setNom] = useState(vetProfile?.nom_complet ?? '')
  const [clinique, setClinique] = useState(vetProfile?.clinique ?? '')
  const [telephone, setTelephone] = useState(vetProfile?.telephone ?? '')
  const [ordre, setOrdre] = useState(vetProfile?.numero_ordre ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <VetWorkspace>
        <ListSkeleton label="Chargement du compte…" />
      </VetWorkspace>
    )
  }
  if (isOwner) return <Navigate to="/espace" replace />
  if (!isVet || !user) return <Navigate to="/connexion" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await updateVetProfile(user!.id, {
        nom_complet: nom,
        clinique,
        telephone,
        numero_ordre: ordre,
      })
      await refreshAccount()
      setMessage('Profil clinique enregistré.')
      setError(null)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    }
  }

  return (
    <VetWorkspace>
      <PageHeader eyebrow="Clinique" title="Compte clinique" description={user.email ?? ''} />
      <form onSubmit={handleSubmit} className="surface flex max-w-lg flex-col gap-4 p-5">
        <Input label="Nom complet" value={nom} onChange={(event) => setNom(event.target.value)} required />
        <Input label="Clinique" value={clinique} onChange={(event) => setClinique(event.target.value)} />
        <Input label="Téléphone" value={telephone} onChange={(event) => setTelephone(event.target.value)} />
        <Input label="Numéro d’ordre" value={ordre} onChange={(event) => setOrdre(event.target.value)} />
        {error ? <FormAlert>{error}</FormAlert> : null}
        {message ? <p className="font-body text-sm text-primary">{message}</p> : null}
        <Button type="submit">Enregistrer</Button>
      </form>
    </VetWorkspace>
  )
}
