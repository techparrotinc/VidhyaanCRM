import { useAuthStore, getStoredRefreshToken, storeRefreshToken, getDeviceId } from './auth-store'

/**
 * API client. All requests carry the Bearer access token; on 401 the client
 * refreshes once (single-flight) and retries. Refresh failure signs out.
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      const refreshToken = await getStoredRefreshToken()
      if (!refreshToken) return null
      const deviceId = await getDeviceId()
      const res = await fetch(`${API_URL}/api/mobile/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken, deviceId })
      })
      if (!res.ok) return null
      const json = await res.json()
      if (!json.success) return null
      await storeRefreshToken(json.refreshToken)
      useAuthStore.getState().setAccessToken(json.accessToken)
      return json.accessToken as string
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.headers ?? {}),
        ...(token ? { authorization: `Bearer ${token}` } : {})
      }
    })

  let token = useAuthStore.getState().accessToken
  if (!token) token = await refreshAccessToken()

  let res = await doFetch(token)
  if (res.status === 401) {
    token = await refreshAccessToken()
    if (!token) {
      await useAuthStore.getState().signOut()
      throw new ApiError(401, 'Session expired')
    }
    res = await doFetch(token)
  }

  const json = await res.json().catch(() => null)
  if (!res.ok || json?.success === false) {
    throw new ApiError(res.status, json?.error ?? `Request failed (${res.status})`)
  }
  return json as T
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Unauthenticated helper for the login endpoints. */
export async function apiPublic<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.success === false) {
    throw new ApiError(res.status, json?.error ?? `Request failed (${res.status})`)
  }
  return json as T
}
