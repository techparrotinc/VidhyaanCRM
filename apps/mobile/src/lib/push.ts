import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { api } from './api'
import { recordError } from './crash-reporting'

/**
 * Registers this device for Expo push once per sign-in. Non-fatal by
 * design — a denied permission or a failed registration must never block
 * login; the user just won't get push until they grant it later.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH
      })
    }

    const existing = await Notifications.getPermissionsAsync()
    let status = existing.status
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync()
      status = requested.status
    }
    if (status !== 'granted') return

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )

    await api('/api/mobile/v1/devices/push-token', {
      method: 'POST',
      body: JSON.stringify({ pushToken })
    })
  } catch (err) {
    console.warn('Push registration failed (non-fatal):', err)
    recordError(err, 'push-registration-failed')
  }
}
