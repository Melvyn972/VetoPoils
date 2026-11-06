import { useEffect, useState } from 'react'

import { getCachedAnimalPhotoUrl } from '../../lib/photoCache'

const sizes = {
  xs: 'h-8 w-8 rounded-[10px] text-xs',
  sm: 'h-10 w-10 rounded-[12px] text-sm',
  md: 'h-12 w-12 rounded-[14px] text-base',
  lg: 'h-16 w-16 rounded-[18px] text-xl',
  xl: 'h-20 w-20 rounded-[22px] text-2xl sm:h-24 sm:w-24 sm:rounded-[26px] sm:text-3xl',
}

function speciesTone(espece: string) {
  const value = espece.toLowerCase()
  if (value.startsWith('chat')) return 'bg-orange-15 text-orange-ink'
  if (value.startsWith('chien')) return 'bg-mint text-primary-pressed'
  return 'bg-teal-15 text-[#1d6f76]'
}

export function AnimalAvatar({
  animal,
  size = 'md',
  className = '',
}: {
  animal: { nom: string; espece: string; photo_path: string | null }
  size?: keyof typeof sizes
  className?: string
}) {
  const [photo, setPhoto] = useState<{ path: string; url: string | null } | null>(null)

  useEffect(() => {
    const path = animal.photo_path
    if (!path) return
    let cancelled = false
    void getCachedAnimalPhotoUrl(path).then((url) => {
      if (!cancelled) setPhoto({ path, url })
    })
    return () => {
      cancelled = true
    }
  }, [animal.photo_path])

  const url = photo && photo.path === animal.photo_path ? photo.url : null

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden font-title font-semibold ${sizes[size]} ${speciesTone(
        animal.espece,
      )} ${className}`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <span aria-hidden="true">{animal.nom.trim().charAt(0).toUpperCase() || '?'}</span>
      )}
    </span>
  )
}
