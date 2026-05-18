/**
 * API Authentication Utilities
 * Provides authentication helpers for API routes
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "./supabase-base"

export interface AuthResult {
  success: boolean
  user?: any
  error?: string
}

function parseAdminIdFromBearer(token: string): { id: string } | null {
  if (!token) return null
  try {
    const decoded = JSON.parse(atob(token))
    if (decoded?.id) return { id: String(decoded.id) }
  } catch {
    // Bearer may be a raw admin UUID
    if (/^[0-9a-f-]{36}$/i.test(token)) {
      return { id: token }
    }
  }
  return null
}

/**
 * Authenticate admin user from request headers, cookies, or body (fallback)
 */
export async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    let adminData: { id: string } | null = null

    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      adminData = parseAdminIdFromBearer(authHeader.substring(7).trim())
    }

    if (!adminData?.id) {
      const headerAdminId = request.headers.get("x-admin-id")
      if (headerAdminId) {
        adminData = { id: headerAdminId }
      }
    }

    if (!adminData?.id) {
      const adminCookie = request.cookies.get("admin_user")
      if (adminCookie?.value) {
        try {
          const parsed = JSON.parse(adminCookie.value)
          if (parsed?.id) adminData = { id: String(parsed.id) }
        } catch (error) {
          console.error("Failed to parse admin_user cookie:", error)
        }
      }
    }

    if (!adminData?.id) {
      const adminIdCookie = request.cookies.get("admin_id")
      if (adminIdCookie?.value) {
        adminData = { id: adminIdCookie.value }
      }
    }

    if (
      !adminData?.id &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
    ) {
      try {
        const body = await request.clone().json()
        const bodyAdminId = body?.admin_id ?? body?.adminId
        if (bodyAdminId) {
          adminData = { id: String(bodyAdminId) }
        }
      } catch {
        // ignore JSON parse errors
      }
    }

    if (!adminData?.id) {
      return {
        success: false,
        error: "Admin authentication required. Please log in again.",
      }
    }

    const { data: admin, error } = await getAdminClient()
      .from("admin_users")
      .select("*")
      .eq("id", adminData.id)
      .eq("is_active", true)
      .single()

    if (error || !admin) {
      return {
        success: false,
        error: "Invalid or expired admin session. Please log in again.",
      }
    }

    return {
      success: true,
      user: admin,
    }
  } catch (error) {
    console.error("Admin authentication error:", error)
    return {
      success: false,
      error: "Authentication failed",
    }
  }
}

/**
 * Authenticate agent user from request headers or body
 */
export async function authenticateAgent(request: NextRequest, agentId?: string): Promise<AuthResult> {
  try {
    let targetAgentId = agentId

    if (!targetAgentId) {
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7)
          const agentData = JSON.parse(atob(token))
          targetAgentId = agentData.id
        } catch (error) {
          console.error("Failed to parse agent auth header:", error)
        }
      }
    }

    if (!targetAgentId) {
      targetAgentId =
        request.headers.get("x-agent-id") ||
        request.cookies.get("agent_id")?.value ||
        undefined
    }

    if (!targetAgentId) {
      const agentCookie = request.cookies.get("agent")
      if (agentCookie) {
        try {
          const agentData = JSON.parse(agentCookie.value)
          targetAgentId = agentData.id
        } catch (error) {
          console.error("Failed to parse agent cookie:", error)
        }
      }
    }

    if (!targetAgentId) {
      return {
        success: false,
        error: "Agent authentication required",
      }
    }

    const { data: agent, error } = await getAdminClient()
      .from("agents")
      .select("*")
      .eq("id", targetAgentId)
      .eq("isapproved", true)
      .single()

    if (error || !agent) {
      return {
        success: false,
        error: "Invalid agent session or agent not approved",
      }
    }

    return {
      success: true,
      user: agent,
    }
  } catch (error) {
    console.error("Agent authentication error:", error)
    return {
      success: false,
      error: "Authentication failed",
    }
  }
}

export function createAuthErrorResponse(error: string, status: number = 401) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status },
  )
}

export type AdminSessionResult =
  | { ok: true; admin: Record<string, unknown> }
  | { ok: false; response: NextResponse }

/**
 * Require a verified admin session for admin API routes.
 * Returns 401 NextResponse when missing or invalid.
 */
export async function requireAdminSession(request: NextRequest): Promise<AdminSessionResult> {
  const auth = await authenticateAdmin(request)
  if (!auth.success || !auth.user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: auth.error || "Admin authentication required. Please log in again.",
        },
        { status: 401 },
      ),
    }
  }
  return { ok: true, admin: auth.user }
}

/**
 * Middleware wrapper for admin-only routes
 */
export function withAdminAuth(handler: (request: NextRequest, admin: any) => Promise<Response>) {
  return async (request: NextRequest) => {
    const authResult = await authenticateAdmin(request)

    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error || "Admin authentication required")
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
      return createAuthErrorResponse(authResult.error || "Agent authentication required")
    }

    return handler(request, authResult.user)
  }
}
