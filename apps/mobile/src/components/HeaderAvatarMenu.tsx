import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'
import type { IconName } from '@/lib/icons'

/**
 * Avatar + dropdown account menu for GradientHeader `right` slots — shown on
 * every tab-root screen so account actions are always one tap away.
 * Render `<AvatarMenuOverlay />` as a sibling of the header inside Screen.
 */

const MENU: Array<{ label: string; icon: IconName; route?: string; action?: 'logout' }> = [
  { label: 'My profile', icon: 'person-circle-outline', route: '/(org)/more' },
  { label: 'Login PIN', icon: 'keypad-outline', route: '/set-pin' },
  { label: 'Help & support', icon: 'help-buoy-outline', route: '/support' },
  { label: 'Log out', icon: 'log-out-outline', action: 'logout' }
]

export function useAvatarMenu() {
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}

export function HeaderAvatar({ onPress }: { onPress: () => void }) {
  const name = useAuthStore((s) => s.user?.name)
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <Avatar name={name} size={40} accent="brand" />
    </Pressable>
  )
}

export function AvatarMenuOverlay({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  const signOut = useAuthStore((s) => s.signOut)
  if (!open) return null

  const onItem = async (item: (typeof MENU)[number]) => {
    onClose()
    if (item.action === 'logout') {
      try {
        await api('/api/mobile/v1/auth/logout', { method: 'POST' })
      } catch {
        // Local sign-out proceeds regardless.
      }
      await signOut()
      router.replace('/(auth)/login')
    } else if (item.route) {
      router.push(item.route as never)
    }
  }

  return (
    <>
      <Pressable
        onPress={onClose}
        className="absolute z-10"
        style={{ top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <View
        className="absolute right-4 top-1 z-20 w-56 rounded-2xl border border-line bg-white py-1 shadow-lg"
        style={{ elevation: 8 }}
      >
        {MENU.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => void onItem(item)}
            className="flex-row items-center gap-3 px-4 py-3 active:bg-line-soft"
          >
            <Ionicons name={item.icon} size={18} color={item.action === 'logout' ? '#DC2626' : '#475569'} />
            <Text className={`text-sm font-medium ${item.action === 'logout' ? 'text-bad' : 'text-ink'}`}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  )
}
