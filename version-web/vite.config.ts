import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

function normalizeOrigin(value: string) {
  const trimmed = value.replace(/\/$/, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}

function resolveVetPortalUrl(mode: string) {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return normalizeOrigin(production)

  const deployment = process.env.VERCEL_URL?.trim()
  if (deployment) return normalizeOrigin(deployment)

  const configured =
    process.env.VITE_VET_WEB_URL?.trim() ?? process.env.NEXT_PUBLIC_VET_WEB_URL?.trim()
  if (configured) return normalizeOrigin(configured)

  if (mode === 'production') {
    return 'https://veto-poils.vercel.app'
  }

  return 'http://localhost:5173'
}

function writeVetPortalConfig(baseUrl: string) {
  const payload = JSON.stringify({ baseUrl }, null, 2)
  writeFileSync(resolve(rootDir, 'public/vet-portal-config.json'), `${payload}\n`)
}

function vetPortalConfigPlugin(mode: string): Plugin {
  return {
    name: 'vet-portal-config',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address()
        if (!address || typeof address === 'string') return

        const host = server.config.server.host === true ? 'localhost' : String(server.config.server.host ?? 'localhost')
        const port = address.port
        const protocol = server.config.server.https ? 'https' : 'http'
        writeVetPortalConfig(`${protocol}://${host}:${port}`)
      })
    },
    buildStart() {
      writeVetPortalConfig(resolveVetPortalUrl(mode))
    },
  }
}

function resolveSupabaseEnv(env: Record<string, string>) {
  return {
    url: env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    key:
      env.VITE_SUPABASE_ANON_KEY ??
      env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      '',
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const supabase = resolveSupabaseEnv(env)

  return {
    plugins: [react(), tailwindcss(), vetPortalConfigPlugin(mode)],
    server: {
      host: true,
      port: 5173,
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabase.url),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabase.key),
      'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(supabase.url),
      'import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabase.key),
      'import.meta.env.VITE_VERCEL_URL': JSON.stringify(env.VERCEL_URL ?? ''),
      'import.meta.env.VITE_VERCEL_PROJECT_PRODUCTION_URL': JSON.stringify(
        env.VERCEL_PROJECT_PRODUCTION_URL ?? '',
      ),
    },
  }
})
