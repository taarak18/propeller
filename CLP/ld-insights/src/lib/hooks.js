// Tiny data-fetching layer for the POC. No external deps (no react-query).
import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

// useApi(path) → { data, loading, error, refetch }
// `path` may be null/undefined to skip fetching (e.g. waiting on a route param).
// Refetches automatically whenever `path` changes (e.g. filter query strings).
export function useApi(path) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    if (!path) {
      setData(null)
      setLoading(false)
      setError(null)
      return Promise.resolve(null)
    }
    setLoading(true)
    setError(null)
    return api
      .get(path)
      .then((res) => {
        setData(res)
        return res
      })
      .catch((err) => {
        setError(err)
        return null
      })
      .finally(() => setLoading(false))
  }, [path])

  useEffect(() => {
    // Fetch on mount and whenever `path` changes. The request intentionally
    // flips loading/error state — that's the purpose of this data hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch()
  }, [refetch])

  return { data, loading, error, refetch, setData }
}
