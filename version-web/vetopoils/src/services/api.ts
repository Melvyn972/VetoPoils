const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://api.example.com"

export type VerifyCodeResponse = {
  valid: boolean
  message?: string
}

export async function verifyAccessCode(code: string): Promise<VerifyCodeResponse> {
  const response = await fetch(`${API_BASE_URL}/access-code/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status})`)
  }

  return response.json() as Promise<VerifyCodeResponse>
}