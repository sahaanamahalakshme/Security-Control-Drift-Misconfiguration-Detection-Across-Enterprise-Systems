import { useCallback, useEffect, useState } from 'react'

// Generic fetch-with-fallback hook for the many read-only intelligence /
// remediation endpoints. `fetcher` is one of the functions in api/client.js
// (already returns { data, source, error } and never throws). `fallback`
// is realistic demo data shown when the backend is unreachable or hasn't
// generated data yet, so every page renders something useful immediately.
export function useEndpoint(fetcher, fallback, deps = []) {
  const [state, setState] = useState({ data: fallback, loading: true, isLive: false, error: null })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    const res = await fetcher()
    if (res.source === 'live' && res.data != null) {
      setState({ data: res.data, loading: false, isLive: true, error: null })
    } else {
      setState({ data: fallback, loading: false, isLive: false, error: res.error })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { ...state, refresh: load }
}
