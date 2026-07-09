"use client"

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Emits an active-time heartbeat (~every 60s) while the CRM tab is visible and
 * focused. Powers the "hours in app" metric on the org usage dashboard.
 * Fire-and-forget; failures are ignored. Mounted once in the CRM layout.
 */
const INTERVAL_MS = 60_000

export default function UsageHeartbeat() {
  const pathname = usePathname()
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  useEffect(() => {
    const ping = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState !== 'visible') return
      try {
        fetch('/api/v1/usage/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathRef.current }),
          keepalive: true,
        }).catch(() => {})
      } catch {
        /* ignore */
      }
    }

    // First beat shortly after load, then on interval.
    const initial = setTimeout(ping, 3_000)
    const id = setInterval(ping, INTERVAL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearTimeout(initial)
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}
