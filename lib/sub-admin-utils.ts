import { supabase } from "./supabase"
import type { SubAdminRole, TabAccessInfo } from "./sub-admin-types"

// Get agent's sub-admin role if they have one
export async function getAgentSubAdminRole(agentId: string): Promise<SubAdminRole | null> {
  console.log("[v0] Fetching sub-admin role for agent:", agentId)
  try {
    const { data, error } = await supabase
      .from("admin_sub_roles")
      .select("*")
      .eq("agent_id", agentId)
      .eq("is_active", true)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // No role found
      }
      console.error("[v0] Error fetching sub-admin role:", error)
      return null
    }

    return data as SubAdminRole
  } catch (error) {
    console.error("[v0] Error in getAgentSubAdminRole:", error)
    return null
  }
}

// Check if agent can access a specific tab
export async function canAgentAccessTab(agentId: string, tabId: string): Promise<boolean> {
  const role = await getAgentSubAdminRole(agentId)
  if (!role) return false
  return role.assigned_tabs.includes(tabId)
}

// Get all tabs visible to an agent
export async function getAgentVisibleTabs(agentId: string): Promise<string[]> {
  const role = await getAgentSubAdminRole(agentId)
  return role?.assigned_tabs || []
}

// Check if agent is a sub-admin
export async function isAgentSubAdmin(agentId: string): Promise<boolean> {
  const role = await getAgentSubAdminRole(agentId)
  return role !== null && role.is_active
}

// Get sub-admin info for display
export async function getSubAdminInfo(agentId: string): Promise<TabAccessInfo | null> {
  const role = await getAgentSubAdminRole(agentId)
  if (!role) return null

  return {
    agentId,
    tabId: "", // Not used in this context
    hasAccess: true,
    assignedTabs: role.assigned_tabs,
  }
}

// Get all sub-admin assignments (for admin to view)
export async function getAllSubAdminAssignments(): Promise<SubAdminRole[]> {
  try {
    const { data, error } = await supabase
      .from("admin_sub_roles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching sub-admin assignments:", error)
      return []
    }

    return data as SubAdminRole[]
  } catch (error) {
    console.error("[v0] Error in getAllSubAdminAssignments:", error)
    return []
  }
}

// Log sub-admin changes to audit log
export async function logSubAdminAction(
  actionType: "assign" | "revoke" | "update",
  agentId: string,
  adminId: string,
  assignedTabs: string[] = [],
  reason?: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("admin_sub_roles_audit_log").insert([
      {
        action_type: actionType,
        agent_id: agentId,
        admin_id: adminId,
        assigned_tabs: assignedTabs,
        reason: reason || null,
      },
    ])

    if (error) {
      console.error("[v0] Error logging sub-admin action:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Error in logSubAdminAction:", error)
    return false
  }
}
