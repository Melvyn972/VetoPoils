import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireVetToken } from './components/auth/RequireVetToken'
import { VetSessionProvider } from './context/VetSessionContext'
import { ConsultationPage } from './pages/ConsultationPage'
import { SuccessPage } from './pages/SuccessPage'
import { VetAccessPage } from './pages/VetAccessPage'
import { WelcomePage } from './pages/WelcomePage'

function App() {
  return (
    <BrowserRouter>
      <VetSessionProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
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
    </BrowserRouter>
  )
}

export default App
