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

function serviceWorkerPlugin(): Plugin {
  return {
    name: 'vetopoil-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => !file.endsWith('.map'))
        .map((file) => `/${file}`)
      const source = `const CACHE = 'vetopoil-shell-v1'
const ASSETS = ${JSON.stringify(['/', '/index.html', '/manifest.webmanifest', ...assets])}
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')))
    return
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy))
        return response
      })
    }),
  )
})
`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

function resolveSupabaseEnv(env: Record<string, string>) {
  return {
    url:
      env.VITE_SUPABASE_URL ??
      env.NEXT_PUBLIC_SUPABASE_URL ??
      'https://lmdszelnnibexzvnaubp.supabase.co',
    key:
      env.VITE_SUPABASE_ANON_KEY ??
      env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      'sb_publishable_wxfo-oDHdAFee8uSYP9Uxg_g41pInti',
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const supabase = resolveSupabaseEnv(env)
  const clarityProjectId = (env.VITE_CLARITY_PROJECT_ID || process.env.VITE_CLARITY_PROJECT_ID || '').trim()
  const gtmId = (env.VITE_GTM_ID || process.env.VITE_GTM_ID || '').trim()
  const ocrApiUrl = (env.VITE_OCR_API_URL || process.env.VITE_OCR_API_URL || '').trim()
  const ocrApiKey = (env.VITE_OCR_API_KEY || process.env.VITE_OCR_API_KEY || '').trim()
  console.log(`[vetopoil] VITE_CLARITY_PROJECT_ID: ${clarityProjectId ? 'present' : 'absent'}`)
  console.log(`[vetopoil] VITE_GTM_ID: ${gtmId ? 'present' : 'absent'}`)

  return {
    plugins: [react(), tailwindcss(), vetPortalConfigPlugin(mode), serviceWorkerPlugin()],
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
      'import.meta.env.VITE_CLARITY_PROJECT_ID': JSON.stringify(clarityProjectId),
      'import.meta.env.VITE_GTM_ID': JSON.stringify(gtmId),
      'import.meta.env.VITE_OCR_API_URL': JSON.stringify(ocrApiUrl),
      'import.meta.env.VITE_OCR_API_KEY': JSON.stringify(ocrApiKey),
    },
  }
})
