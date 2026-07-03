const PLACEHOLDER_VALUES = [
  'your-project.supabase.co',
  'your-anon-key',
]

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true
  return PLACEHOLDER_VALUES.some((placeholder) => value.includes(placeholder))
}

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
}

export function isSupabaseConfigured(): boolean {
  const urlConfigured = !isPlaceholder(env.supabaseUrl)
  const keyConfigured = !isPlaceholder(env.supabaseAnonKey)
  const result = urlConfigured && keyConfigured

  // #region agent log
  fetch('http://127.0.0.1:7933/ingest/9587ca61-8228-4ee6-b45f-c079cf435a6e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af1613'},body:JSON.stringify({sessionId:'af1613',location:'env.ts:isSupabaseConfigured',message:'supabase config check',data:{hasUrl:!!env.supabaseUrl,hasKey:!!env.supabaseAnonKey,urlLength:env.supabaseUrl?.length??0,keyLength:env.supabaseAnonKey?.length??0,urlIsPlaceholder:isPlaceholder(env.supabaseUrl),keyIsPlaceholder:isPlaceholder(env.supabaseAnonKey),urlConfigured,keyConfigured,result,emptyStringIncludesBug:env.supabaseUrl?.includes('')??null},timestamp:Date.now(),hypothesisId:'A-B'})}).catch(()=>{});
  // #endregion

  return result
}
