import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireVetAuth } from './components/auth/RequireVetAuth'
import { RequireVetToken } from './components/auth/RequireVetToken'
import { AuthProvider } from './context/AuthContext'
import { VetSessionProvider } from './context/VetSessionContext'
import { ConsultationPage } from './pages/ConsultationPage'
import { LoginPage } from './pages/LoginPage'
import { SuccessPage } from './pages/SuccessPage'
import { VetAccessPage } from './pages/VetAccessPage'
import { VetAnimalPage } from './pages/VetAnimalPage'
import { VetPatientsPage } from './pages/VetPatientsPage'
import { WelcomePage } from './pages/WelcomePage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VetSessionProvider>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/mes-patients"
              element={
                <RequireVetAuth>
                  <VetPatientsPage />
                </RequireVetAuth>
              }
            />
            <Route
              path="/animal/:animalId"
              element={
                <RequireVetAuth>
                  <VetAnimalPage />
                </RequireVetAuth>
              }
            />
            <Route path="/acces" element={<VetAccessPage />} />
            <Route
              path="/consultation"
              element={
                <RequireVetToken>
                  <ConsultationPage />
                </RequireVetToken>
              }
            />
            <Route
              path="/succes"
              element={
                <RequireVetToken>
                  <SuccessPage />
                </RequireVetToken>
              }
            />
          </Routes>
        </VetSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
