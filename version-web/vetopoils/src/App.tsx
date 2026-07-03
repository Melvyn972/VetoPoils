import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireAccess } from './components/auth/RequireAccess'
import { AuthProvider } from './context/AuthContext'
import { ConsultationPage } from './pages/ConsultationPage'
import { LoginPage } from './pages/LoginPage'
import { SuccessPage } from './pages/SuccessPage'
import { WelcomePage } from './pages/WelcomePage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/consultation"
            element={
              <RequireAccess>
                <ConsultationPage />
              </RequireAccess>
            }
          />
          <Route
            path="/succes"
            element={
              <RequireAccess>
                <SuccessPage />
              </RequireAccess>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export async function verifyAccessCode(code: string): Promise<VerifyCodeResponse> {
  const { data, error } = await supabase
    .from("access_codes")
    .select("code")
    .eq("code", code)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return { valid: false, message: "Code invalide." }
  }

  return { valid: true }
}