const PLACEHOLDER_VALUES = [
  'your-project.supabase.co',
  'your-anon-key',
]

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true
  return PLACEHOLDER_VALUES.some((placeholder) => value.includes(placeholder))
}

export const env = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined,
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined,
}

export function isSupabaseConfigured(): boolean {
  const urlConfigured = !isPlaceholder(env.supabaseUrl)
  const keyConfigured = !isPlaceholder(env.supabaseAnonKey)
  return urlConfigured && keyConfigured
}
