import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AnalyticsRoot } from './components/analytics/AnalyticsRoot'
import { RequireOwner } from './components/auth/RequireOwner'
import { RequireVetAuth } from './components/auth/RequireVetAuth'
import { RequireVetToken } from './components/auth/RequireVetToken'
import { AuthProvider } from './context/AuthContext'
import { VetSessionProvider } from './context/VetSessionContext'
import { ConsultationPage } from './pages/ConsultationPage'
import { SuccessPage } from './pages/SuccessPage'
import { VetAccessPage } from './pages/VetAccessPage'
import { VetAnimalPage } from './pages/VetAnimalPage'
import { VetPatientsPage } from './pages/VetPatientsPage'
import { AnimalPage } from './pages/owner/AnimalPages'
import {
  AccountPage,
  AnimalsPage,
  DashboardPage,
  NewAnimalPage,
  PartnersPage,
  RemindersPage,
  SharesPage,
} from './pages/owner/OwnerPages'
import { QrShortcut } from './pages/owner/OwnerLayout'
import {
  AuthCallbackPage,
  ForgotPasswordPage,
  LoginPage,
  OwnerSignupPage,
  ResetPasswordPage,
  RoleChoicePage,
  VetSignupPage,
} from './pages/public/AuthPages'
import { LandingPage } from './pages/public/LandingPage'
import { PrivacyPage, TermsPage } from './pages/public/LegalPages'
import { VetAccountPage } from './pages/vet/VetAccountPage'

function Owner({ children }: { children: ReactNode }) {
  return <RequireOwner>{children}</RequireOwner>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VetSessionProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/inscription" element={<RoleChoicePage />} />
            <Route path="/inscription/proprietaire" element={<OwnerSignupPage />} />
            <Route path="/inscription/veterinaire" element={<VetSignupPage />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/cgu" element={<TermsPage />} />
            <Route path="/confidentialite" element={<PrivacyPage />} />
            <Route path="/acces" element={<VetAccessPage />} />
            <Route path="/consultation" element={<RequireVetToken><ConsultationPage /></RequireVetToken>} />
            <Route path="/succes" element={<RequireVetToken><SuccessPage /></RequireVetToken>} />

            <Route path="/espace" element={<Owner><DashboardPage /></Owner>} />
            <Route path="/espace/animaux" element={<Owner><AnimalsPage /></Owner>} />
            <Route path="/espace/animaux/nouveau" element={<Owner><NewAnimalPage /></Owner>} />
            <Route path="/espace/animaux/:animalId" element={<Owner><AnimalPage section="fiche" /></Owner>} />
            <Route path="/espace/animaux/:animalId/modifier" element={<Owner><AnimalPage section="modifier" /></Owner>} />
            <Route path="/espace/animaux/:animalId/historique" element={<Owner><AnimalPage section="historique" /></Owner>} />
            <Route path="/espace/animaux/:animalId/documents" element={<Owner><AnimalPage section="documents" /></Owner>} />
            <Route path="/espace/animaux/:animalId/analyse" element={<Owner><AnimalPage section="analyse" /></Owner>} />
            <Route path="/espace/animaux/:animalId/code" element={<Owner><AnimalPage section="code" /></Owner>} />
            <Route path="/espace/animaux/:animalId/rappels" element={<Owner><AnimalPage section="rappels" /></Owner>} />
            <Route path="/espace/animaux/:animalId/partage" element={<Owner><AnimalPage section="partage" /></Owner>} />
            <Route path="/espace/animaux/:animalId/journal" element={<Owner><AnimalPage section="journal" /></Owner>} />
            <Route path="/espace/animaux/:animalId/budget" element={<Owner><AnimalPage section="budget" /></Owner>} />
            <Route path="/espace/animaux/:animalId/score" element={<Owner><AnimalPage section="score" /></Owner>} />
            <Route path="/espace/animaux/:animalId/pdf" element={<Owner><AnimalPage section="pdf" /></Owner>} />
            <Route path="/espace/rappels" element={<Owner><RemindersPage /></Owner>} />
            <Route path="/espace/partage" element={<Owner><SharesPage /></Owner>} />
            <Route path="/espace/partenaires" element={<Owner><PartnersPage /></Owner>} />
            <Route path="/espace/compte" element={<Owner><AccountPage /></Owner>} />
            <Route path="/espace/code" element={<Owner><QrShortcut /></Owner>} />

            <Route path="/mes-patients" element={<RequireVetAuth><VetPatientsPage /></RequireVetAuth>} />
            <Route path="/animal/:animalId" element={<RequireVetAuth><VetAnimalPage /></RequireVetAuth>} />
            <Route path="/compte-veterinaire" element={<VetAccountPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AnalyticsRoot />
        </VetSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
