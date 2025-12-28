import { getAgentSubAdminRole, getAgentVisibleTabs } from "./sub-admin-utils"

// Dynamically filter TAB_CONFIG based on agent's sub-admin role
export async function filterTabsForSubAdmin(agentId: string, allTabs: any[]) {
  console.log("[v0] filterTabsForSubAdmin: filtering for agent", agentId)
  const visibleTabs = await getAgentVisibleTabs(agentId)

  // If agent has no assigned tabs, they shouldn't see anything except dashboard
  if (!visibleTabs || visibleTabs.length === 0) {
    console.log("[v0] filterTabsForSubAdmin: No tabs assigned, returning only dashboard")
    return allTabs.filter((tab) => tab.id === "dashboard")
  }

  // Even if somehow assigned, we double check here if we want to protect the management tab specifically
  const filtered = allTabs.filter((tab) => tab.id === "dashboard" || visibleTabs.includes(tab.id))

  console.log(
    "[v0] filterTabsForSubAdmin: Returning filtered tabs:",
    filtered.map((t) => t.id),
  )
  return filtered
}

// Check if agent is sub-admin and should have restricted access
export async function isRestrictedSubAdmin(agentId: string): Promise<boolean> {
  const role = await getAgentSubAdminRole(agentId)
  return role !== null && role.is_active
}
