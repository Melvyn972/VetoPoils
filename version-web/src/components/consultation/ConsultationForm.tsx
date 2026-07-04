import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { useVetSession } from '../../context/VetSessionContext'
import { saveConsultationResult } from '../../lib/consultation'
import { AnimalSummary } from './AnimalSummary'
import { DocumentsPanel } from './DocumentsPanel'
import { MedicalEventForm } from './MedicalEventForm'
import { MedicalHistory } from './MedicalHistory'

export function ConsultationForm() {
  const navigate = useNavigate()
  const { token, dossier } = useVetSession()
  const { isConnected, displayName } = useAuth()

  if (!token || !dossier) return null

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-title text-2xl font-bold text-fg-primary lg:text-3xl">
          Compte rendu de visite
        </h1>
        {isConnected ? (
          <p className="font-body text-sm text-fg-secondary">
            Connecté en tant que {displayName}. Cet animal sera ajouté à{' '}
            <Link to="/mes-patients" className="font-medium text-primary underline">
              vos patients
            </Link>
            .
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-8">
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
          <AnimalSummary dossier={dossier} />
          <DocumentsPanel documents={dossier.documents} />
          <MedicalHistory events={dossier.medical_events} />
        </aside>

        <div className="rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-6">
          <MedicalEventForm
            dossier={dossier}
            mode="token"
            token={token}
            onSuccess={() => {
              saveConsultationResult({ animalName: dossier.animal.nom })
              navigate('/succes')
            }}
            submitLabel="Enregistrer"
          />
        </div>
      </div>
    </div>
  )
}
