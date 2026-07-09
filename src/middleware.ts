import NextAuth from 'next-auth'
import { configEdge } from '@/lib/auth/config.edge'
import { NextRequest, NextResponse } from 'next/server'

const { auth } = NextAuth(configEdge)

function isPublicRoute(pathname: string): boolean {
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/pricing' ||
    pathname === '/about' ||
    pathname === '/contact' ||
    pathname === '/products' ||
    pathname === '/for-schools' ||
    pathname === '/for-parents' ||
    pathname === '/favicon.ico'
  ) {
    return true
  }

  const prefixes = [
    '/products',
    '/schools',
    '/learning-centers',
    '/blog',
    '/api/auth',
    '/api/webhooks',
    '/api/public',
    '/api/location',
    '/parent/register',
    '/parent/verify-otp',
    '/parent/login',
    '/register',
    '/claim-profile',
    '/forgot-pin',
    '/impersonate', // token-gated: page only works with a valid single-use Redis token

    '/_next',
    '/fonts',
    '/images',
    '/icons'
  ]

  return prefixes.some((prefix) => pathname.startsWith(prefix))
}

function isPlatformRole(role: string): boolean {
  return ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role)
}

function isOrgRole(role: string): boolean {
  return [
    'ORG_ADMIN',
    'BRANCH_ADMIN',
    'COUNSELLOR',
    'RECEPTIONIST',
    'ACCOUNTANT',
    'TEACHER'
  ].includes(role)
}

function isCRMRoute(pathname: string): boolean {
  const prefixes = [
    '/dashboard',
    '/lead-management',
    '/admission-management',
    '/student-management',
    '/fee-management',
    '/campaign-management',
    '/event-management',
    '/reports',
    '/settings'
  ]
  return prefixes.some((prefix) => pathname.startsWith(prefix))
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=()')
  return response
}

const IDENTITY_HEADERS = [
  'x-user-id',
  'x-user-role',
  'x-org-id',
  'x-user-name',
  'x-active-role-assignment-id'
]

// Verifies the AI Gateway service token (edge-safe Web Crypto).
// Format: v1.<ts>.<userId>.<orgId>.<role>.<hexHmacSha256(secret, "ts.userId.orgId.role")>
// 60s validity window bounds replay; the signature covers the acting identity.
async function verifyAiServiceToken(
  token: string
): Promise<{ userId: string; orgId: string; role: string } | null> {
  const secret = process.env.ERP_SERVICE_TOKEN_SECRET
  if (!secret) return null
  const parts = token.split('.')
  if (parts.length !== 6 || parts[0] !== 'v1') return null
  const [, ts, userId, orgId, role, sig] = parts
  if (!ts || !userId || !orgId || !role || !sig) return null
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 60) return null

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${userId}.${orgId}.${role}`))
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  if (expected.length !== sig.length) return null
  // constant-time compare
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0 ? { userId, orgId, role } : null
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Never trust identity headers from the client — they are set below only
  // after session verification. Strip them on every path, including public
  // and onboarding bypasses, so no route can be reached with spoofed values.
  const requestHeaders = new Headers(request.headers)
  IDENTITY_HEADERS.forEach((h) => requestHeaders.delete(h))
  const passThrough = () =>
    addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }))

  // AI Gateway service path: a valid HMAC service token lets the gateway act
  // on behalf of a user — identity headers are then set from the SIGNED
  // acting-* values (not trusted client input; the signature covers them).
  // route() then applies its normal RBAC/revocation/module checks unchanged.
  if (pathname.startsWith('/api/v1/')) {
    const svcToken = request.headers.get('x-ai-service-token')
    if (svcToken) {
      const acting = await verifyAiServiceToken(svcToken)
      if (!acting) {
        return NextResponse.json({ success: false, error: 'invalid service token' }, { status: 401 })
      }
      requestHeaders.set('x-user-id', acting.userId)
      requestHeaders.set('x-user-role', acting.role)
      requestHeaders.set('x-org-id', acting.orgId)
      requestHeaders.set('x-user-name', 'Vidhyaan AI (on behalf)')
      return passThrough()
    }
  }

  // Allow onboarding routes to pass through
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/api/v1/onboarding')) {
    return passThrough()
  }

  // 1. Allow all public routes
  if (isPublicRoute(pathname)) {
    return passThrough()
  }

  // 2. Get session
  const session = await auth()

  // 3. No session → redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user.role

  // 3.5. Onboarding Guard for ORG_ADMIN accessing CRM/Dashboard routes.
  // Skip entirely once onboarding is complete (flag carried in the session
  // token) so established orgs pay zero DB/self-fetch cost per navigation.
  if (role === 'ORG_ADMIN' && !session.user.onboardingComplete && isCRMRoute(pathname)) {
    try {
      const statusRes = await fetch(new URL('/api/v1/onboarding/status', request.url), {
        headers: {
          cookie: request.headers.get('cookie') || ''
        }
      })
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        if (statusData.success && !statusData.isComplete && statusData.currentStep < 5) {
          return NextResponse.redirect(new URL(`/onboarding/step/${statusData.currentStep}`, request.url))
        }
      }
    } catch (e) {
      console.error('Middleware onboarding guard check error:', e)
    }
  }

  // 3.6. Forced 2FA enrolment: org policy requires a second factor but the
  // user has not enrolled. Corral every CRM route to the security page until
  // they do (the page + its APIs are exempt so enrolment can complete).
  if (
    (session.user as any).mustEnrol2fa &&
    isCRMRoute(pathname) &&
    !pathname.startsWith('/settings/security')
  ) {
    return NextResponse.redirect(new URL('/settings/security?enrol=required', request.url))
  }

  // 4. Admin routes → platform roles only
  if (pathname.startsWith('/admin')) {
    if (!isPlatformRole(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // SUPPORT_ADMIN restrictions: cannot access settings, revenue, or impersonation
    if (role === 'SUPPORT_ADMIN') {
      const blockedPaths = ['/admin/settings', '/admin/revenue', '/admin/impersonate']
      if (blockedPaths.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }

    // OPERATIONS_ADMIN restrictions: cannot impersonate
    if (role === 'OPERATIONS_ADMIN') {
      const blockedPaths = ['/admin/impersonate']
      if (blockedPaths.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  // 5. Parent routes → parent role only
  if (pathname.startsWith('/parent')) {
    if (role !== 'PARENT') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 6. CRM routes → org roles only
  if (isCRMRoute(pathname)) {
    if (!isOrgRole(role)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (session?.user) {
    requestHeaders.set('x-user-id', session.user.id || '')
    requestHeaders.set('x-user-role', session.user.role || '')
    requestHeaders.set('x-org-id', session.user.orgId || '')
    requestHeaders.set('x-user-name', session.user.name || '')
    requestHeaders.set('x-active-role-assignment-id', session.user.activeRoleAssignmentId || '')
  }

  return addSecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    })
  )
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
