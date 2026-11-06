import { getAnimalPhotoSignedUrl } from './documents'

const TTL_MS = 50 * 60 * 1000
const cache = new Map<string, { at: number; url: Promise<string | null> }>()

export function getCachedAnimalPhotoUrl(photoPath: string) {
  const hit = cache.get(photoPath)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.url
  const url = getAnimalPhotoSignedUrl(photoPath).catch(() => null)
  cache.set(photoPath, { at: Date.now(), url })
  return url
}
