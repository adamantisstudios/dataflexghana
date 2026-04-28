import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip maintenance check for admin routes, agent login, registration pages, API routes, and static assets
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

  try {
    // Check maintenance mode status with controlled cache busting
    const baseUrl = request.nextUrl.origin
    
    // Use a more controlled cache busting approach
    const now = Date.now()
    const cacheWindow = Math.floor(now / 10000) // 10-second cache window
    
    const maintenanceResponse = await fetch(`${baseUrl}/api/maintenance?v=${cacheWindow}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    if (maintenanceResponse.ok) {
      const maintenanceData = await maintenanceResponse.json()
      
      if (maintenanceData.success && maintenanceData.data.isEnabled) {
        // Check if user is admin (bypass maintenance mode)
        const adminCookie = request.cookies.get('admin_user')
        if (adminCookie) {
          console.log('Admin user detected, bypassing maintenance mode')
          return NextResponse.next()
        }

        // Check for special agent cookie (new method)
        const specialAgentCookie = request.cookies.get('special_agent')
        const agentPhoneCookie = request.cookies.get('agent_phone')
        if (specialAgentCookie && agentPhoneCookie) {
          const phoneNumber = decodeURIComponent(agentPhoneCookie.value)
          if (phoneNumber === '+233546460945') {
            console.log('Special test agent detected via cookie, bypassing maintenance mode')
            return NextResponse.next()
          }
        }

        // Check if user is the special maintenance test agent (+233546460945) - legacy methods
        const agentCookie = request.cookies.get('agent')
        if (agentCookie) {
          try {
            const agentData = JSON.parse(agentCookie.value)
            // Allow the special maintenance test agent to bypass maintenance mode
            if (agentData.phone_number === '+233546460945' || agentData.phone === '+233546460945') {
              console.log('Special test agent detected, bypassing maintenance mode')
              return NextResponse.next()
            }
          } catch (error) {
            console.error('Error parsing agent cookie:', error)
          }
        }

        // Check for alternative agent authentication methods
        const agentAuth = request.cookies.get('agent_auth')
        if (agentAuth) {
          try {
            const authData = JSON.parse(agentAuth.value)
            if (authData.phone_number === '+233546460945' || authData.phone === '+233546460945') {
              console.log('Special test agent (alt auth) detected, bypassing maintenance mode')
              return NextResponse.next()
            }
          } catch (error) {
            console.error('Error parsing agent auth cookie:', error)
          }
        }

        // Check for user session that might contain phone number
        const userSession = request.cookies.get('user_session')
        if (userSession) {
          try {
            const sessionData = JSON.parse(userSession.value)
            if (sessionData.phone_number === '+233546460945' || sessionData.phone === '+233546460945') {
              console.log('Special test user session detected, bypassing maintenance mode')
              return NextResponse.next()
            }
          } catch (error) {
            console.error('Error parsing user session cookie:', error)
          }
        }

        console.log('Maintenance mode active, redirecting to maintenance page')
        
        // Redirect to maintenance page with controlled cache busting
        const maintenanceUrl = new URL('/maintenance', request.url)
        maintenanceUrl.searchParams.set('v', cacheWindow.toString())

        const response = NextResponse.redirect(maintenanceUrl)
        
        // Add headers to prevent caching of the redirect
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        
        // Add a header to indicate this is a maintenance redirect
        response.headers.set('X-Maintenance-Redirect', 'true')

        return response
      } else {
        // Maintenance is disabled - ensure no caching issues
        const response = NextResponse.next()
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('X-Maintenance-Status', 'disabled')
        return response
      }
    } else {
      console.error('Failed to check maintenance mode status:', maintenanceResponse.status)
    }
  } catch (error) {
    console.error('Middleware maintenance check error:', error)
    // If there's an error checking maintenance mode, allow the request to continue
    // This prevents the site from being completely inaccessible due to middleware errors
  }

  return NextResponse.next()
}
