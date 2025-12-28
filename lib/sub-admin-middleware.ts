import { getAgentSubAdminRole, getAgentVisibleTabs } from "./sub-admin-utils"

// Dynamically filter TAB_CONFIG based on agent's sub-admin role
export async function filterTabsForSubAdmin(agentId: string, allTabs: any[]) {
  const visibleTabs = await getAgentVisibleTabs(agentId)

  // If no sub-admin role, return all tabs (regular admin)
  if (visibleTabs.length === 0) {
    return allTabs
  }

  // Filter tabs to only show assigned ones
  return allTabs.filter((tab) => visibleTabs.includes(tab.id))
}

// Check if agent is sub-admin and should have restricted access
export async function isRestrictedSubAdmin(agentId: string): Promise<boolean> {
  const role = await getAgentSubAdminRole(agentId)
  return role !== null && role.is_active
}
