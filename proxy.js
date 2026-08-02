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

function isMaintenanceAssetPath(pathname) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/fonts') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname === '/manifest.json' ||
    pathname === '/site.webmanifest' ||
    pathname === '/browserconfig.xml'
  )
}

function isMaintenancePagePath(pathname) {
  return pathname === '/maintenance' || pathname.startsWith('/api/maintenance')
}

function isAdminAuthPath(pathname) {
  return (
    pathname === '/admin/login' ||
    pathname === '/api/admin/login' ||
    pathname === '/api/admin/verify-2fa' ||
    pathname.startsWith('/api/admin/2fa/')
  )
}

function isAdminRequestPath(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')
}

function hasAdminSession(request) {
  const adminCookie = request.cookies.get('admin_user')
  if (adminCookie?.value) {
    try {
      const adminData = JSON.parse(decodeURIComponent(adminCookie.value))
      if (adminData?.id) return true
    } catch {
      if (adminCookie.value.trim()) return true
    }
  }

  const adminIdCookie = request.cookies.get('admin_id')
  return Boolean(adminIdCookie?.value?.trim())
}

function isMaintenanceExemptPath(pathname) {
  return isMaintenancePagePath(pathname) || isMaintenanceAssetPath(pathname)
}

function applyNoStoreHeaders(response) {
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate')
  response.headers.set('CDN-Cache-Control', 'no-store')
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

async function fetchMaintenanceStatusDirect(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && serviceKey) {
    try {
      const url = new URL(`${supabaseUrl}/rest/v1/maintenance_mode`)
      url.searchParams.set('select', 'is_enabled')
      url.searchParams.set('order', 'created_at.desc')
      url.searchParams.set('limit', '1')

      const res = await fetch(url.toString(), {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        signal: AbortSignal.timeout(4000),
      })

      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows) && rows.length > 0) return rows[0]
      }
    } catch {
      /* fall through to API fallback */
    }
  }

  try {
    const apiUrl = new URL('/api/maintenance', request.nextUrl.origin)
    apiUrl.searchParams.set('v', Date.now().toString())
    const res = await fetch(apiUrl.toString(), {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const payload = await res.json()
    if (payload?.success && payload?.data) {
      return { is_enabled: Boolean(payload.data.isEnabled) }
    }
  } catch {
    return null
  }

  return null
}

function attachRequestPathHeader(request, response) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-url', request.url)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  const nextResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  response.headers.forEach((value, key) => {
    nextResponse.headers.set(key, value)
  })

  return nextResponse
}

function shouldAllowAdminDuringMaintenance(request) {
  const { pathname } = request.nextUrl
  if (isAdminAuthPath(pathname)) return true
  return isAdminRequestPath(pathname) && hasAdminSession(request)
}

function maintenanceBlockedResponse(request, cacheWindow) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return applyNoStoreHeaders(
      NextResponse.json(
        {
          success: false,
          error: 'Site is currently under maintenance. Please try again later.',
          code: 'MAINTENANCE_MODE_ENABLED',
        },
        {
          status: 503,
          headers: {
            'Retry-After': '300',
            'X-Maintenance-Mode': 'enabled',
          },
        },
      ),
    )
  }

  const maintenanceUrl = new URL('/maintenance', request.url)
  maintenanceUrl.searchParams.set('v', cacheWindow.toString())
  const response = applyNoStoreHeaders(NextResponse.redirect(maintenanceUrl, 307))
  response.headers.set('X-Maintenance-Redirect', 'true')
  return response
}

export async function proxy(request) {
  const { pathname } = request.nextUrl

  if (!isMaintenanceExemptPath(pathname)) {
    const now = Date.now()
    const cacheWindow = Math.floor(now / 10000)

    try {
      const maintenanceRow = await fetchMaintenanceStatusDirect(request)

      if (maintenanceRow?.is_enabled) {
        if (shouldAllowAdminDuringMaintenance(request)) {
          const response = applyNoStoreHeaders(NextResponse.next())
          response.headers.set('X-Maintenance-Admin-Bypass', 'true')
          return attachRequestPathHeader(request, response)
        }

        return maintenanceBlockedResponse(request, cacheWindow)
      }

      const response = applyNoStoreHeaders(NextResponse.next())
      response.headers.set('X-Maintenance-Status', 'disabled')
      return attachRequestPathHeader(request, response)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Maintenance check failed closed (${message})`)
      return maintenanceBlockedResponse(request, cacheWindow)
    }
  }

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
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg')
  ) {
    return attachRequestPathHeader(request, NextResponse.next())
  }

  return attachRequestPathHeader(request, NextResponse.next())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|site.webmanifest|browserconfig.xml|robots.txt|sitemap.xml|images/|assets/|fonts/).*)',
  ],
}
