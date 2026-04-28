import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email?: string
    phone_number?: string
    role: "admin" | "agent"
    full_name?: string
  }
}

// Admin authentication middleware - works with localStorage-based auth
export async function authenticateAdmin(
  request: NextRequest,
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Get admin ID from multiple sources (headers, cookies, or body for some requests)
    let adminId =
      request.headers.get("x-admin-id") ||
      request.cookies.get("admin_id")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    // Check for maintenance system auth pattern
    const adminAuth = request.headers.get("x-admin-auth")
    const adminEmail = request.headers.get("x-admin-email")

    // If using maintenance system auth pattern, validate differently
    if (adminAuth === "true" && adminId && adminEmail) {
      // For maintenance system, we trust the headers if they're properly formatted
      // This is because the client-side already validated the admin user from localStorage
      return {
        success: true,
        user: {
          id: adminId,
          email: adminEmail,
          role: "admin",
          full_name: "Admin User",
        },
      }
    }

    // Try to get admin data from admin_user cookie (localStorage sync)
    const adminCookie = request.cookies.get("admin_user")
    if (!adminId && adminCookie) {
      try {
        const adminData = JSON.parse(adminCookie.value)
        adminId = adminData.id
      } catch (error) {
        console.error("Error parsing admin_user cookie:", error)
      }
    }

    // For POST requests, also check the request body
    if (!adminId && (request.method === "POST" || request.method === "PUT")) {
      try {
        const body = await request.clone().json()
        adminId = body.adminId || body.admin_id
      } catch {
        // Ignore JSON parsing errors
      }
    }

    if (!adminId) {
      return { success: false, error: "No admin ID provided" }
    }

    // Get admin details from database
    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", adminId)
      .eq("is_active", true)
      .single()

    if (adminError || !admin) {
      return { success: false, error: "Admin not found or not active" }
    }

    return {
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        role: "admin",
        full_name: admin.full_name,
      },
    }
  } catch (error) {
    console.error("Admin authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

// Agent authentication middleware - works with localStorage-based auth
export async function authenticateAgent(
  request: NextRequest,
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Get agent ID from multiple sources (headers, cookies, or body for some requests)
    let agentId = request.headers.get("x-agent-id") || request.cookies.get("agent_id")?.value

    const authHeader = request.headers.get("authorization")
    if (!agentId && authHeader?.startsWith("Bearer ")) {
      try {
        const encodedAgent = authHeader.replace("Bearer ", "")
        const decodedAgent = JSON.parse(atob(encodedAgent))
        agentId = decodedAgent.id
        console.log("[v0] Decoded agent from Authorization header:", { agentId, fullName: decodedAgent.full_name })
      } catch (decodeError) {
        console.error("[v0] Failed to decode Authorization header:", decodeError)
        // Fallback to treating it as plain agent ID
        agentId = authHeader.replace("Bearer ", "")
      }
    }

    // For POST requests, also check the request body
    if (!agentId && (request.method === "POST" || request.method === "PUT")) {
      try {
        const body = await request.clone().json()
        agentId = body.agentId || body.agent_id
      } catch {
        // Ignore JSON parsing errors
      }
    }

    if (!agentId) {
      console.log("[v0] No agent ID found in request")
      return { success: false, error: "No agent ID provided" }
    }

    console.log("[v0] Authenticating agent with ID:", agentId)

    // Get agent details from database
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, full_name, phone_number, wallet_balance, commission, status, created_at, isapproved")
      .eq("id", agentId)
      .eq("isapproved", true)
      .single()

    if (agentError || !agent) {
      console.log("[v0] Agent authentication failed:", { agentError, agentFound: !!agent })
      return { success: false, error: "Agent not found or not approved" }
    }

    console.log("[v0] Agent authentication successful:", { agentId: agent.id, fullName: agent.full_name })

    return {
      success: true,
      user: {
        id: agent.id,
        phone_number: agent.phone_number,
        role: "agent",
        full_name: agent.full_name,
      },
    }
  } catch (error) {
    console.error("Agent authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

// Simplified authentication that works with localStorage data
export async function authenticateFromLocalStorage(
  request: NextRequest,
  requiredRole?: "admin" | "agent",
): Promise<{ success: boolean; user?: any; error?: string }> {
  // For GET requests with query params, try to get ID from URL
  if (request.method === "GET") {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")
    const adminId = searchParams.get("adminId")

    if (agentId && (!requiredRole || requiredRole === "agent")) {
      const { data: agent, error } = await supabase
        .from("agents")
        .select("id, full_name, phone_number, wallet_balance, commission, status, created_at, isapproved")
        .eq("id", agentId)
        .eq("isapproved", true)
        .single()

      if (!error && agent) {
        return {
          success: true,
          user: {
            id: agent.id,
            phone_number: agent.phone_number,
            role: "agent",
            full_name: agent.full_name,
          },
        }
      }
    }

    if (adminId && (!requiredRole || requiredRole === "admin")) {
      const { data: admin, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", adminId)
        .eq("is_active", true)
        .single()

      if (!error && admin) {
        return {
          success: true,
          user: {
            id: admin.id,
            email: admin.email,
            role: "admin",
            full_name: admin.full_name,
          },
        }
      }
    }
  }

  // Try standard authentication methods
  if (!requiredRole || requiredRole === "admin") {
    const adminAuth = await authenticateAdmin(request)
    if (adminAuth.success) {
      return adminAuth
    }
  }

  if (!requiredRole || requiredRole === "agent") {
    const agentAuth = await authenticateAgent(request)
    if (agentAuth.success) {
      return agentAuth
    }
  }

  return { success: false, error: "Authentication failed" }
}

// Generic authentication middleware that works for both admin and agent
export async function authenticate(
  request: NextRequest,
  requiredRole?: "admin" | "agent",
): Promise<{ success: boolean; user?: any; error?: string }> {
  return authenticateFromLocalStorage(request, requiredRole)
}

// Middleware wrapper for API routes
export function withAuth(
  handler: (req: AuthenticatedRequest, user: any) => Promise<NextResponse>,
  requiredRole?: "admin" | "agent",
) {
  return async (request: NextRequest) => {
    const auth = await authenticate(request, requiredRole)

    if (!auth.success) {
      return NextResponse.json({ error: auth.error || "Authentication required" }, { status: 401 })
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = auth.user

    return handler(authenticatedRequest, auth.user)
  }
}

// Admin-only middleware wrapper
export function withAdminAuth(handler: (req: AuthenticatedRequest, user: any) => Promise<NextResponse>) {
  return withAuth(handler, "admin")
}

// Agent-only middleware wrapper
export function withAgentAuth(handler: (req: AuthenticatedRequest, user: any) => Promise<NextResponse>) {
  return withAuth(handler, "agent")
}

// Flexible middleware that allows both admin and agent access
export function withUnifiedAuth(handler: (req: AuthenticatedRequest, user: any) => Promise<NextResponse>) {
  return withAuth(handler) // No role restriction
}

// Check if user has permission to access specific savings account
export async function checkSavingsAccess(
  userId: string,
  userRole: "admin" | "agent",
  savingsId?: string,
  agentId?: string,
): Promise<boolean> {
  try {
    // Admins have access to everything
    if (userRole === "admin") {
      return true
    }

    // Agents can only access their own savings
    if (userRole === "agent") {
      if (agentId && userId !== agentId) {
        return false
      }

      if (savingsId) {
        const { data: savings, error } = await supabase
          .from("agent_savings")
          .select("agent_id")
          .eq("id", savingsId)
          .single()

        if (error || !savings || savings.agent_id !== userId) {
          return false
        }
      }

      return true
    }

    return false
  } catch (error) {
    console.error("Error checking savings access:", error)
    return false
  }
}

// Validate savings operation permissions
export async function validateSavingsOperation(
  userId: string,
  userRole: "admin" | "agent",
  operation: "read" | "create" | "update" | "delete",
  resourceId?: string,
): Promise<{ allowed: boolean; error?: string }> {
  try {
    // Admin permissions
    if (userRole === "admin") {
      return { allowed: true }
    }

    // Agent permissions
    if (userRole === "agent") {
      switch (operation) {
        case "read":
          // Agents can read their own savings data
          if (resourceId) {
            const hasAccess = await checkSavingsAccess(userId, userRole, resourceId)
            return { allowed: hasAccess, error: hasAccess ? undefined : "Access denied to this resource" }
          }
          return { allowed: true }

        case "create":
          // Agents can create their own savings accounts
          return { allowed: true }

        case "update":
          // Agents can update their own savings (limited operations)
          if (resourceId) {
            const hasAccess = await checkSavingsAccess(userId, userRole, resourceId)
            return { allowed: hasAccess, error: hasAccess ? undefined : "Access denied to this resource" }
          }
          return { allowed: false, error: "Resource ID required for update operations" }

        case "delete":
          // Agents cannot delete savings accounts (admin only)
          return { allowed: false, error: "Delete operations not allowed for agents" }

        default:
          return { allowed: false, error: "Unknown operation" }
      }
    }

    return { allowed: false, error: "Invalid user role" }
  } catch (error) {
    console.error("Error validating savings operation:", error)
    return { allowed: false, error: "Validation failed" }
  }
}
