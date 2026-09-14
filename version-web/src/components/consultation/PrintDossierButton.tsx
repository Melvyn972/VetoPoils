import { useState } from 'react'

import { mailtoDossierFallback, printVetDossier } from '../../lib/dossier'
import { getVetErrorMessage } from '../../lib/vetErrors'
import type { VetDossier } from '../../types/vet'
import { Button } from '../ui/Button'
import { FormAlert } from '../ui/FormAlert'

export function PrintDossierButton({ dossier }: { dossier: VetDossier }) {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {error ? <FormAlert>{error}</FormAlert> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={() => {
            setError(null)
            try {
              printVetDossier(dossier)
            } catch (printError) {
              setError(getVetErrorMessage(printError))
            }
          }}
        >
          Imprimer le dossier
        </Button>
        <button
          type="button"
          onClick={() => mailtoDossierFallback(dossier.animal.nom)}
          className="rounded-14 border border-primary/25 bg-primary-15 px-4 py-3 font-body text-sm font-semibold text-primary"
        >
          Envoyer par e-mail
        </button>
      </div>
      <p className="font-body text-xs text-fg-tertiary">
        L’impression ouvre une page à enregistrer en PDF. L’e-mail ouvre votre messagerie : joignez le
        PDF manuellement si besoin.
      </p>
    </div>
  )
}
