import NextAuth from 'next-auth'
import { configEdge } from '@/lib/auth/config.edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'

const { auth } = NextAuth(configEdge)

function isPublicRoute(pathname: string): boolean {
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/pricing' ||
    pathname === '/about' ||
    pathname === '/contact' ||
    pathname === '/data-deletion' ||
    pathname === '/privacy-policy' ||
    pathname === '/terms-of-service' ||
    pathname === '/products' ||
    pathname === '/for-schools' ||
    pathname === '/for-parents' ||
    pathname === '/wireframes.html' || // mobile-app design prototype (team review)
    pathname === '/favicon.ico' ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    pathname === '/opengraph-image.png' ||
    pathname === '/twitter-image.png' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
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
    '/api/cron', // self-authenticated via Bearer CRON_SECRET in each route
    '/api/public',
    '/api/location',
    '/apply', // public digital-form fill page (token-gated)
    '/parent/register',
    '/parent/verify-otp',
    '/parent/login',
    '/parent/complete-signup', // Google SSO completion (Redis token-gated)
    '/login/google', // Google SSO challenge-token handoff
    '/register',
    '/claim-profile',
    '/forgot-pin',
    '/impersonate', // token-gated: page only works with a valid single-use Redis token

    '/_next',
    '/fonts',
    '/images',
    '/icons',
    '/brand'
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
    '/timetable',
    '/settings'
  ]
  return prefixes.some((prefix) => pathname.startsWith(prefix))
}

// Every route section that requires a session. Unauthenticated requests to
// these redirect to /login; anything outside this list AND outside the public
// routes has no page at all, so it must fall through to Next's not-found —
// a login redirect there turns every junk URL into a soft-404 for crawlers.
// New protected page sections MUST be added here (their APIs stay guarded by
// the route() composer regardless).
function isKnownProtectedRoute(pathname: string): boolean {
  const prefixes = [
    '/admin',
    '/parent',
    '/onboarding',
    '/setup',
    '/attendance',
    '/users',
    '/families',
    '/notifications',
    '/roles',
    '/schedule',
    '/api'
  ]
  return isCRMRoute(pathname) || prefixes.some((prefix) => pathname.startsWith(prefix))
}

// Only the production domain may be indexed — dev/preview hosts
// (app-dev.vidhyaan.com, *.vercel.app, localhost) get a blanket noindex so
// they never compete with vidhyaan.com in search.
const INDEXABLE_HOSTS = new Set(['vidhyaan.com', 'www.vidhyaan.com'])

function addSecurityHeaders(response: NextResponse, host?: string): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=()')
  if (host && !INDEXABLE_HOSTS.has(host)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
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
  const requestHost = request.nextUrl.hostname
  const passThrough = () =>
    addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), requestHost)

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

  // CORS for token-authenticated mobile endpoints. Native apps never send
  // CORS preflights — this exists solely for the Expo web dev preview.
  // Safe with '*' because these endpoints are cookie-free (Bearer only).
  const mobileCors = (res: NextResponse) => {
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'content-type, authorization')
    return res
  }

  // Mobile auth endpoints enforce their own auth (OTP / refresh / Bearer).
  if (pathname.startsWith('/api/mobile/')) {
    if (request.method === 'OPTIONS') {
      return mobileCors(new NextResponse(null, { status: 204 }))
    }
    return mobileCors(passThrough())
  }

  // Mobile app path: a valid mobile access JWT (minted by /api/mobile/v1/auth)
  // sets the identity headers from its VERIFIED claims — the same trust model
  // as the AI service token above. route() then applies its normal
  // revocation/RBAC/module checks unchanged, so every existing /api/v1 route
  // is mobile-callable with no per-route work. /api/admin/* is included too
  // (platform-role JWTs, orgId claim empty) — those routes predate route()
  // and read x-user-id/x-user-role directly rather than through it.
  if (pathname.startsWith('/api/v1/') || pathname.startsWith('/api/admin/')) {
    const authz = request.headers.get('authorization')
    // Preflight for Bearer requests from the Expo web dev preview: the
    // Authorization header itself triggers OPTIONS, which carries no authz.
    if (
      request.method === 'OPTIONS' &&
      request.headers.get('access-control-request-headers')?.toLowerCase().includes('authorization')
    ) {
      return mobileCors(new NextResponse(null, { status: 204 }))
    }
    if (authz?.startsWith('Bearer ')) {
      const claims = await verifyMobileAccessToken(authz.slice(7))
      if (!claims) {
        return mobileCors(
          NextResponse.json(
            { success: false, code: 'TOKEN_EXPIRED', error: 'invalid or expired token' },
            { status: 401 }
          )
        )
      }
      requestHeaders.set('x-user-id', claims.userId)
      requestHeaders.set('x-user-role', claims.role)
      requestHeaders.set('x-org-id', claims.orgId ?? '')
      requestHeaders.set('x-user-name', claims.name)
      requestHeaders.set('x-active-role-assignment-id', claims.assignmentId)
      return mobileCors(passThrough())
    }
  }

  // Onboarding APIs enforce their own auth via the route() composer.
  if (pathname.startsWith('/api/v1/onboarding')) {
    return passThrough()
  }

  // 1. Allow all public routes
  if (isPublicRoute(pathname)) {
    return passThrough()
  }

  // 2. Get session
  const session = await auth()

  // 3. No session → known app sections redirect to login; anything else has
  // no route at all, so fall through and let Next render the 404 page
  // (redirecting junk URLs to /login makes crawlers see them as soft-404s).
  if (!session?.user) {
    if (isKnownProtectedRoute(pathname)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return passThrough()
  }

  // Onboarding pages: signed-in users pass straight through — the wizard
  // itself drives step routing, and the CRM guard below must not run here
  // (it would bounce incomplete orgs right back to onboarding in a loop).
  if (pathname.startsWith('/onboarding')) {
    return passThrough()
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
    }),
    requestHost
  )
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
