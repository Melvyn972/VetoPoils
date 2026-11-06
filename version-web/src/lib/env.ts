const PLACEHOLDER_VALUES = ['your-project.supabase.co', 'your-anon-key']

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true
  return PLACEHOLDER_VALUES.some((placeholder) => value.includes(placeholder))
}

function read(value: string | undefined) {
  return value?.trim() || ''
}

export const env = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined,
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined,
  ocrApiUrl: read(import.meta.env.VITE_OCR_API_URL as string | undefined),
  ocrApiKey: read(import.meta.env.VITE_OCR_API_KEY as string | undefined),
  clarityProjectId: read(import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined),
  gtmId: read(import.meta.env.VITE_GTM_ID as string | undefined),
}

export function isSupabaseConfigured(): boolean {
  return !isPlaceholder(env.supabaseUrl) && !isPlaceholder(env.supabaseAnonKey)
}

export function isOcrConfigured() {
  return Boolean(env.ocrApiUrl && env.ocrApiKey)
}

export function isClarityConfigured() {
  return Boolean(env.clarityProjectId)
}

export function isGtmConfigured() {
  return Boolean(env.gtmId)
}
