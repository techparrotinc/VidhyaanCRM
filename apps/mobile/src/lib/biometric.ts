import * as LocalAuthentication from 'expo-local-authentication'

/**
 * Biometric app-lock wrapping the stored refresh token (mobile-app-plan
 * §4.9). Convenience gate only — the actual security boundary is the
 * server-issued refresh token in SecureStore; a device with no biometric
 * hardware/enrollment just skips the gate (fail-open by design).
 */
export async function biometricAvailable(): Promise<boolean> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync()
    ])
    return hasHardware && isEnrolled
  } catch {
    return false
  }
}

export async function authenticateBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Vidhyaan',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false // allow device PIN/pattern as fallback
    })
    return result.success
  } catch {
    return false
  }
}
