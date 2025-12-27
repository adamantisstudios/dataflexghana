import { getAgentVisibleTabs, isAgentSubAdmin } from "./sub-admin-utils"

// Filter TAB_CONFIG based on user role
export async function getFilteredTabConfig(agentId: string, isAdmin: boolean, fullTabConfig: any[]): Promise<any[]> {
  // Full admins see all tabs
  if (isAdmin) {
    return fullTabConfig
  }

  // Check if agent is a sub-admin
  const isSubAdmin = await isAgentSubAdmin(agentId)
  if (!isSubAdmin) {
    return [] // Not a sub-admin, no tabs
  }

  // Get visible tabs for sub-admin
  const visibleTabIds = await getAgentVisibleTabs(agentId)

  // Filter tabs based on assigned tabs
  return fullTabConfig.filter((tab) => visibleTabIds.includes(tab.id))
}
