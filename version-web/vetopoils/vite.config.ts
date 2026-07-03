import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

function normalizeOrigin(value: string) {
  const trimmed = value.replace(/\/$/, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}

function resolveVetPortalUrl() {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return normalizeOrigin(production)

  const deployment = process.env.VERCEL_URL?.trim()
  if (deployment) return normalizeOrigin(deployment)

  const configured =
    process.env.VITE_VET_WEB_URL?.trim() ?? process.env.NEXT_PUBLIC_VET_WEB_URL?.trim()
  if (configured) return normalizeOrigin(configured)

  return 'http://localhost:5173'
}

function writeVetPortalConfig(baseUrl: string) {
  const payload = JSON.stringify({ baseUrl }, null, 2)
  writeFileSync(resolve(rootDir, 'public/vet-portal-config.json'), `${payload}\n`)
}

function vetPortalConfigPlugin(): Plugin {
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
      writeVetPortalConfig(resolveVetPortalUrl())
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vetPortalConfigPlugin()],
  server: {
    host: true,
    port: 5173,
  },
  define: {
    'import.meta.env.VITE_VERCEL_URL': JSON.stringify(process.env.VERCEL_URL ?? ''),
    'import.meta.env.VITE_VERCEL_PROJECT_PRODUCTION_URL': JSON.stringify(
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '',
    ),
  },
})
