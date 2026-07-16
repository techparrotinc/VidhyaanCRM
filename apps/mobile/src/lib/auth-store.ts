import { create } from 'zustand'
import * as storage from './secure-storage'
import type { AuthUser } from '@/shared-contract'

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
  /** Biometric app-lock gate — only meaningful when status === 'signedIn'.
   *  true = show the lock screen; false = biometric unavailable/unenrolled
   *  (fail-open) or already unlocked this session. */
  locked: boolean
  hydrate: () => Promise<void>
  signIn: (tokens: { accessToken: string; refreshToken: string; user: AuthUser }) => Promise<void>
  setAccessToken: (token: string) => void
  signOut: () => Promise<void>
  lock: () => void
  unlock: () => void
}

function randomHex(bytes: number): string {
  // globalThis.crypto exists on web; React Native lacks it — Math.random is
  // fine here: the device id needs uniqueness, not cryptographic strength
  // (all auth security lives in the server-issued tokens).
  const g: any = globalThis as any
  if (g.crypto?.getRandomValues) {
    return Array.from(g.crypto.getRandomValues(new Uint8Array(bytes)) as Uint8Array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  let out = ''
  for (let i = 0; i < bytes; i++) {
    out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  }
  return out
}

export async function getDeviceId(): Promise<string> {
  let id = await storage.getItem(KEY_DEVICE)
  if (!id) {
    id = randomHex(16)
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
  locked: false,

  hydrate: async () => {
    const [refresh, userJson, deviceId] = await Promise.all([
      storage.getItem(KEY_REFRESH),
      storage.getItem(KEY_USER),
      getDeviceId()
    ])
    if (refresh && userJson) {
      // Gate a resumed session behind the app PIN; a fresh sign-in (via
      // signIn() below) never locks — the OTP/PIN just proved identity.
      // Accounts without a PIN are auto-unlocked by the LockScreen itself.
      set({ status: 'signedIn', user: JSON.parse(userJson), deviceId, locked: true })
    } else {
      set({ status: 'signedOut', deviceId })
    }
  },

  signIn: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      storage.setItem(KEY_REFRESH, refreshToken),
      storage.setItem(KEY_USER, JSON.stringify(user))
    ])
    set({ status: 'signedIn', accessToken, user, locked: false })
  },

  setAccessToken: (token) => set({ accessToken: token }),

  signOut: async () => {
    await Promise.all([
      storage.deleteItem(KEY_REFRESH),
      storage.deleteItem(KEY_USER)
    ])
    set({ status: 'signedOut', accessToken: null, user: null, locked: false })
  },

  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false })
}))
