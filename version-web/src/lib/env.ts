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
  clarityProjectId: read(import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined),
  gaMeasurementId: read(import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined),
}

export function isSupabaseConfigured(): boolean {
  return !isPlaceholder(env.supabaseUrl) && !isPlaceholder(env.supabaseAnonKey)
}

export function isClarityConfigured() {
  return Boolean(env.clarityProjectId)
}

export function isGaConfigured() {
  return Boolean(env.gaMeasurementId)
}
