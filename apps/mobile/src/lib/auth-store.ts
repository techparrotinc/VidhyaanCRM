import { create } from 'zustand'
import * as storage from './secure-storage'
import type { AuthUser } from '@vidhyaan/shared'

/**
 * Auth state. Refresh token + user live in SecureStore (Keychain/Keystore);
 * the short-lived access token stays in memory only.
 */

const KEY_REFRESH = 'vidhyaan.refreshToken'
const KEY_USER = 'vidhyaan.user'
const KEY_DEVICE = 'vidhyaan.deviceId'

interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn'
  accessToken: string | null
  user: AuthUser | null
  deviceId: string | null
  hydrate: () => Promise<void>
  signIn: (tokens: { accessToken: string; refreshToken: string; user: AuthUser }) => Promise<void>
  setAccessToken: (token: string) => void
  signOut: () => Promise<void>
}

export async function getDeviceId(): Promise<string> {
  let id = await storage.getItem(KEY_DEVICE)
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    await storage.setItem(KEY_DEVICE, id)
  }
  return id
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return storage.getItem(KEY_REFRESH)
}

export async function storeRefreshToken(token: string): Promise<void> {
  await storage.setItem(KEY_REFRESH, token)
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  accessToken: null,
  user: null,
  deviceId: null,

  hydrate: async () => {
    const [refresh, userJson, deviceId] = await Promise.all([
      storage.getItem(KEY_REFRESH),
      storage.getItem(KEY_USER),
      getDeviceId()
    ])
    if (refresh && userJson) {
      set({ status: 'signedIn', user: JSON.parse(userJson), deviceId })
    } else {
      set({ status: 'signedOut', deviceId })
    }
  },

  signIn: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      storage.setItem(KEY_REFRESH, refreshToken),
      storage.setItem(KEY_USER, JSON.stringify(user))
    ])
    set({ status: 'signedIn', accessToken, user })
  },

  setAccessToken: (token) => set({ accessToken: token }),

  signOut: async () => {
    await Promise.all([
      storage.deleteItem(KEY_REFRESH),
      storage.deleteItem(KEY_USER)
    ])
    set({ status: 'signedOut', accessToken: null, user: null })
  }
}))
