import { supabase } from "../lib/supabase"

export type VerifyCodeResponse = {
  valid: boolean
  message?: string
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