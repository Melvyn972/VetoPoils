import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

import { getErrorMessage } from '../lib/errors'

export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let cancelled = false
    loaderRef
      .current()
      .then((value) => {
        if (cancelled) return
        setData(value)
        setError(null)
      })
      .catch((loadError) => {
        if (!cancelled) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // The caller owns the dependency list; the loader is always read from the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  const retry = useCallback(() => {
    setLoading(true)
    setError(null)
    setVersion((current) => current + 1)
  }, [])

  return { data, error, loading, setData, reload, retry }
}

export function useCountdown(expiresAt: string | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!expiresAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt])

  if (!expiresAt) return null
  return Math.max(0, new Date(expiresAt).getTime() - now)
}
