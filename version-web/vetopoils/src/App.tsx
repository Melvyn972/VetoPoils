import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { ConsultationPage } from './pages/ConsultationPage'
import { SuccessPage } from './pages/SuccessPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ConsultationPage />} />
          <Route path="/succes" element={<SuccessPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
