import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

function isPublicRoute(pathname: string): boolean {
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
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
    '/schools',
    '/learning-centers',
    '/blog',
    '/api/auth',
    '/api/webhooks',
    '/api/public',
    '/api/location',
    '/parent/register',
    '/parent/verify-otp',
    '/register',
    '/claim-profile',
    '/forgot-pin',
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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow onboarding routes to pass through
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/api/v1/onboarding')) {
    return addSecurityHeaders(NextResponse.next())
  }

  // 1. Allow all public routes
  if (isPublicRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next())
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

  // 3.5. Onboarding Guard for ORG_ADMIN accessing CRM/Dashboard routes
  if (role === 'ORG_ADMIN' && isCRMRoute(pathname)) {
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

  // 4. Admin routes → platform roles only
  if (pathname.startsWith('/admin')) {
    if (!isPlatformRole(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
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

  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
