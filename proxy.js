import { NextResponse } from 'next/server'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const RESERVED_STORE_SEGMENTS = new Set([
  'not-available',
  'payment-failed',
  'invalid-agent',
])

function isUuid(value) {
  return UUID_RE.test(value)
}

export async function proxy(request) {
  const { pathname } = request.nextUrl

  const hostname = request.headers.get('host') || ''
  const isStorefrontDomain = hostname.includes('referralpowerhouse.vercel.app')

  if (isStorefrontDomain) {
    if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/agent')) {
      return NextResponse.redirect(new URL('/store/invalid-agent', request.url))
    }

    const storefrontMatch = pathname.match(/^\/store\/([^/]+)/)
    if (storefrontMatch) {
      const segment = storefrontMatch[1]

      if (RESERVED_STORE_SEGMENTS.has(segment)) {
        return NextResponse.next()
      }

      // app/store/[segment]/page.tsx resolves slugs server-side (no edge fetch / rewrite)
      return NextResponse.next()
    }
  }

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/public') ||
    pathname === '/maintenance' ||
    pathname === '/agent/login' ||
    pathname === '/agent/register' ||
    pathname === '/agent/registration-payment' ||
    pathname === '/agent/registration-complete' ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next()
  }

  if (!request.nextUrl.origin || request.nextUrl.origin === 'http://localhost:3000') {
    try {
      const baseUrl = request.nextUrl.origin
      const now = Date.now()
      const cacheWindow = Math.floor(now / 10000)

      const maintenanceResponse = await fetch(`${baseUrl}/api/maintenance?v=${cacheWindow}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json()

        if (maintenanceData.success && maintenanceData.data.isEnabled) {
          const adminCookie = request.cookies.get('admin_user')
          if (adminCookie) {
            return NextResponse.next()
          }

          const specialAgentCookie = request.cookies.get('special_agent')
          const agentPhoneCookie = request.cookies.get('agent_phone')
          if (specialAgentCookie && agentPhoneCookie) {
            const phoneNumber = decodeURIComponent(agentPhoneCookie.value)
            if (phoneNumber === '+233546460945') {
              return NextResponse.next()
            }
          }

          const agentCookie = request.cookies.get('agent')
          if (agentCookie) {
            try {
              const agentData = JSON.parse(agentCookie.value)
              if (agentData.phone_number === '+233546460945' || agentData.phone === '+233546460945') {
                return NextResponse.next()
              }
            } catch {
              /* ignore */
            }
          }

          const agentAuth = request.cookies.get('agent_auth')
          if (agentAuth) {
            try {
              const authData = JSON.parse(agentAuth.value)
              if (authData.phone_number === '+233546460945' || authData.phone === '+233546460945') {
                return NextResponse.next()
              }
            } catch {
              /* ignore */
            }
          }

          const userSession = request.cookies.get('user_session')
          if (userSession) {
            try {
              const sessionData = JSON.parse(userSession.value)
              if (sessionData.phone_number === '+233546460945' || sessionData.phone === '+233546460945') {
                return NextResponse.next()
              }
            } catch {
              /* ignore */
            }
          }

          const maintenanceUrl = new URL('/maintenance', request.url)
          maintenanceUrl.searchParams.set('v', cacheWindow.toString())
          const response = NextResponse.redirect(maintenanceUrl)
          response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
          response.headers.set('Pragma', 'no-cache')
          response.headers.set('Expires', '0')
          response.headers.set('X-Maintenance-Redirect', 'true')
          return response
        }

        const response = NextResponse.next()
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('X-Maintenance-Status', 'disabled')
        return response
      }
    } catch (error) {
      console.error('Middleware maintenance check error:', error)
    }
  }

  return NextResponse.next()
}
