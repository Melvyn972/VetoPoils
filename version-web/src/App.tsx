import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AnalyticsRoot } from './components/analytics/AnalyticsRoot'
import { RequireOwner } from './components/auth/RequireOwner'
import { RequireVetAuth } from './components/auth/RequireVetAuth'
import { RequireVetToken } from './components/auth/RequireVetToken'
import { AuthProvider } from './context/AuthContext'
import { VetSessionProvider } from './context/VetSessionContext'
import { LandingPage } from './pages/public/LandingPage'

const authPages = () => import('./pages/public/AuthPages')
const ownerPages = () => import('./pages/owner/OwnerPages')
const legalPages = () => import('./pages/public/LegalPages')

const LoginPage = lazy(() => authPages().then((module) => ({ default: module.LoginPage })))
const RoleChoicePage = lazy(() => authPages().then((module) => ({ default: module.RoleChoicePage })))
const OwnerSignupPage = lazy(() => authPages().then((module) => ({ default: module.OwnerSignupPage })))
const VetSignupPage = lazy(() => authPages().then((module) => ({ default: module.VetSignupPage })))
const ForgotPasswordPage = lazy(() => authPages().then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => authPages().then((module) => ({ default: module.ResetPasswordPage })))
const AuthCallbackPage = lazy(() => authPages().then((module) => ({ default: module.AuthCallbackPage })))
const TermsPage = lazy(() => legalPages().then((module) => ({ default: module.TermsPage })))
const PrivacyPage = lazy(() => legalPages().then((module) => ({ default: module.PrivacyPage })))
const DashboardPage = lazy(() => ownerPages().then((module) => ({ default: module.DashboardPage })))
const AnimalsPage = lazy(() => ownerPages().then((module) => ({ default: module.AnimalsPage })))
const NewAnimalPage = lazy(() => ownerPages().then((module) => ({ default: module.NewAnimalPage })))
const RemindersPage = lazy(() => ownerPages().then((module) => ({ default: module.RemindersPage })))
const SharesPage = lazy(() => ownerPages().then((module) => ({ default: module.SharesPage })))
const PartnersPage = lazy(() => ownerPages().then((module) => ({ default: module.PartnersPage })))
const AccountPage = lazy(() => ownerPages().then((module) => ({ default: module.AccountPage })))
const AnimalPage = lazy(() => import('./pages/owner/AnimalPages').then((module) => ({ default: module.AnimalPage })))
const QrShortcut = lazy(() => import('./pages/owner/OwnerLayout').then((module) => ({ default: module.QrShortcut })))
const VetAccessPage = lazy(() => import('./pages/VetAccessPage').then((module) => ({ default: module.VetAccessPage })))
const ConsultationPage = lazy(() => import('./pages/ConsultationPage').then((module) => ({ default: module.ConsultationPage })))
const SuccessPage = lazy(() => import('./pages/SuccessPage').then((module) => ({ default: module.SuccessPage })))
const VetPatientsPage = lazy(() => import('./pages/VetPatientsPage').then((module) => ({ default: module.VetPatientsPage })))
const VetAnimalPage = lazy(() => import('./pages/VetAnimalPage').then((module) => ({ default: module.VetAnimalPage })))
const VetAccountPage = lazy(() => import('./pages/vet/VetAccountPage').then((module) => ({ default: module.VetAccountPage })))

function Owner({ children }: { children: ReactNode }) {
  return <RequireOwner>{children}</RequireOwner>
}

function RouteFallback() {
  return (
    <div role="status" className="flex min-h-[100svh] items-center justify-center bg-canvas">
      <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <span className="sr-only">Chargement…</span>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VetSessionProvider>
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
          <AnalyticsRoot />
        </VetSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
