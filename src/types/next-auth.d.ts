import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      orgId: string
      name: string
      phone: string
      email: string
      activeRoleAssignmentId: string | null
      onboardingComplete: boolean
      impersonatorId: string | null
      impersonationExpiresAt: number | null
      mustEnrol2fa: boolean
      institutionType: string | null
    } & DefaultSession['user']
  }

  interface JWT {
    userId: string
    role: string
    orgId: string
    phone: string
    email: string
    activeRoleAssignmentId: string | null
    onboardingComplete: boolean
    impersonatorId: string | null
    impersonationExpiresAt: number | null
    mustEnrol2fa: boolean
    institutionType: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: string
    orgId: string
    phone: string
    email: string
    activeRoleAssignmentId: string | null
    onboardingComplete: boolean
    impersonatorId: string | null
    impersonationExpiresAt: number | null
    mustEnrol2fa: boolean
    institutionType: string | null
  }
}
