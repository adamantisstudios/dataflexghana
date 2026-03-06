/**
 * API Authentication Utilities
 * Provides authentication helpers for API routes
 */

import { NextRequest } from 'next/server'
import { supabase } from './supabase'

export interface AuthResult {
  success: boolean
  user?: any
  error?: string
}

/**
 * Authenticate admin user from request headers
 */
export async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for admin session cookie or authorization header
    const authHeader = request.headers.get('authorization')
    const adminCookie = request.cookies.get('admin_user')
    
    let adminData = null
    
    // Try authorization header first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        adminData = JSON.parse(atob(token))
      } catch (error) {
        console.error('Failed to parse admin auth header:', error)
      }
    }
    
    // Try admin cookie if header failed
    if (!adminData && adminCookie) {
      try {
        adminData = JSON.parse(adminCookie.value)
      } catch (error) {
        console.error('Failed to parse admin cookie:', error)
      }
    }
    
    if (!adminData || !adminData.id) {
      return {
        success: false,
        error: 'Admin authentication required'
      }
    }
    
    // Verify admin exists and is active
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', adminData.id)
      .eq('is_active', true)
      .single()
    
    if (error || !admin) {
      return {
        success: false,
        error: 'Invalid admin session'
      }
    }
    
    return {
      success: true,
      user: admin
    }
  } catch (error) {
    console.error('Admin authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

/**
 * Authenticate agent user from request headers or body
 */
export async function authenticateAgent(request: NextRequest, agentId?: string): Promise<AuthResult> {
  try {
    let targetAgentId = agentId
    
    // If no agentId provided, try to get from auth header
    if (!targetAgentId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7)
          const agentData = JSON.parse(atob(token))
          targetAgentId = agentData.id
        } catch (error) {
          console.error('Failed to parse agent auth header:', error)
        }
      }
    }
    
    // Try agent cookie if still no ID
    if (!targetAgentId) {
      const agentCookie = request.cookies.get('agent')
      if (agentCookie) {
        try {
          const agentData = JSON.parse(agentCookie.value)
          targetAgentId = agentData.id
        } catch (error) {
          console.error('Failed to parse agent cookie:', error)
        }
      }
    }
    
    if (!targetAgentId) {
      return {
        success: false,
        error: 'Agent authentication required'
      }
    }
    
    // Verify agent exists and is approved
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', targetAgentId)
      .eq('isapproved', true)
      .single()
    
    if (error || !agent) {
      return {
        success: false,
        error: 'Invalid agent session or agent not approved'
      }
    }
    
    return {
      success: true,
      user: agent
    }
  } catch (error) {
    console.error('Agent authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

/**
 * Create authentication response for failed auth
 */
export function createAuthErrorResponse(error: string, status: number = 401) {
  return new Response(
    JSON.stringify({
      success: false,
      error
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Middleware wrapper for admin-only routes
 */
export function withAdminAuth(handler: (request: NextRequest, admin: any) => Promise<Response>) {
  return async (request: NextRequest) => {
    const authResult = await authenticateAdmin(request)
    
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error || 'Admin authentication required')
    }
    
    return handler(request, authResult.user)
  }
}

/**
 * Middleware wrapper for agent-only routes
 */
export function withAgentAuth(handler: (request: NextRequest, agent: any) => Promise<Response>) {
  return async (request: NextRequest) => {
    const authResult = await authenticateAgent(request)
    
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error || 'Agent authentication required')
    }
    
    return handler(request, authResult.user)
  }
}
