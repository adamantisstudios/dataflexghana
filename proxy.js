import { NextResponse } from 'next/server'

const AGENT_AUTH_PUBLIC_PATHS = new Set([
  '/agent/login',
  '/agent/register',
  '/agent/registration-payment',
  '/agent/registration-complete',
])

const AGENT_PHOTO_VERIFICATION_HOLD_PATH = '/agent/dashboard'

const AGENT_API_PHOTO_EXEMPT_PATHS = [
  '/api/agent/login',
  '/api/agent/register',
  '/api/agent/check-payment',
  '/api/agent/mark-payment-ready',
  '/api/agent/clear-payment',
  '/api/agent/profile-photo/verify',
]

const AGENT_UPLOAD_PHOTO_EXEMPT_PATHS = ['/api/upload/image']

const AGENT_REGISTRATION_API_EXEMPT_PREFIXES = ['/api/paystack/register']

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getPlatformAdminEmail() {
  return (
    process.env.SUPPORT_EMAIL ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    'sales.dataflex@gmail.com'
  )
    .trim()
    .toLowerCase()
}

function isPlatformAdminEmail(email) {
  const adminEmail = getPlatformAdminEmail()
  if (!adminEmail || !email) return false
  return String(email).trim().toLowerCase() === adminEmail
}

function getPhotoVerificationStatus(agent) {
  if (!agent) return 'unverified'
  if (agent.profile_verified === true) return 'verified'
  if (String(agent.profile_image_url ?? '').trim()) return 'pending'
  return 'unverified'
}

function isAgentPhotoVerified(agent) {
  if (!agent) return false
  if (isPlatformAdminEmail(agent.email)) return true
  return getPhotoVerificationStatus(agent) === 'verified'
}

function parseAgentIdFromRequest(request) {
  const headerId = request.headers.get('x-agent-id')
  if (headerId) return headerId

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = JSON.parse(atob(authHeader.slice(7)))
      if (decoded?.id) return String(decoded.id)
    } catch {
      const raw = authHeader.slice(7).trim()
      if (UUID_RE.test(raw)) return raw
    }
  }

  const agentIdCookie = request.cookies.get('agent_id')
  if (agentIdCookie?.value) return agentIdCookie.value

  const agentCookie = request.cookies.get('agent')
  if (agentCookie?.value) {
    try {
      const agentData = JSON.parse(agentCookie.value)
      if (agentData?.id) return String(agentData.id)
    } catch {
      /* ignore */
    }
  }

  return null
}

async function fetchAgentForPhotoGate(agentId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey || !agentId) return null

  const url = new URL(`${supabaseUrl}/rest/v1/agents`)
  url.searchParams.set('id', `eq.${agentId}`)
  url.searchParams.set('isapproved', 'eq.true')
  url.searchParams.set(
    'select',
    'id,email,profile_image_url,profile_verified,isapproved',
  )
  url.searchParams.set('limit', '1')

  const res = await fetch(url.toString(), {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    signal: AbortSignal.timeout(4000),
  })

  if (!res.ok) return null
  const rows = await res.json()
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

function isExemptAgentApiPath(pathname) {
  return AGENT_API_PHOTO_EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

function isExemptUploadPath(pathname) {
  return AGENT_UPLOAD_PHOTO_EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

function isExemptRegistrationApiPath(pathname) {
  return AGENT_REGISTRATION_API_EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

async function enforceAgentPhotoVerification(request) {
  const { pathname } = request.nextUrl
  const agentId = parseAgentIdFromRequest(request)
  if (!agentId) return null

  const needsAgentApiGate =
    pathname.startsWith('/api/agent/') && !isExemptAgentApiPath(pathname)
  const needsUploadGate =
    !isExemptUploadPath(pathname) &&
    !isExemptRegistrationApiPath(pathname) &&
    pathname.startsWith('/api/') &&
    (pathname.startsWith('/api/upload/') ||
      pathname.startsWith('/api/channel') ||
      pathname.startsWith('/api/videos/') ||
      pathname.startsWith('/api/calls/') ||
      pathname.startsWith('/api/paystack/'))

  const needsAgentPageGate =
    pathname.startsWith('/agent/') && !AGENT_AUTH_PUBLIC_PATHS.has(pathname)

  if (!needsAgentApiGate && !needsUploadGate && !needsAgentPageGate) {
    return null
  }

  if (isExemptUploadPath(pathname)) {
    return null
  }

  const agent = await fetchAgentForPhotoGate(agentId)
  if (!agent) return null

  if (isAgentPhotoVerified(agent)) {
    return null
  }

  if (needsAgentPageGate) {
    if (pathname === AGENT_PHOTO_VERIFICATION_HOLD_PATH) {
      return NextResponse.next()
    }
    const redirectUrl = new URL(AGENT_PHOTO_VERIFICATION_HOLD_PATH, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.json(
    {
      success: false,
      error:
        'Account photo verification required. Upload your profile photo and wait for admin approval before using the platform.',
      code: 'PHOTO_VERIFICATION_REQUIRED',
    },
    { status: 403 },
  )
}

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

  try {
    const photoGateResponse = await enforceAgentPhotoVerification(request)
    if (photoGateResponse) return photoGateResponse
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Agent photo verification gate skipped (${message})`)
  }

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
        signal: AbortSignal.timeout(3000),
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
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Middleware maintenance check skipped (${message})`)
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|assets/|fonts/).*)',
  ],
}
