import { getAgentSubAdminRole, getAgentVisibleTabs } from "./sub-admin-utils"

// Dynamically filter TAB_CONFIG based on agent's sub-admin role
export async function filterTabsForSubAdmin(agentId: string, allTabs: any[]) {
  const visibleTabs = await getAgentVisibleTabs(agentId)
  console.log("[v0] middleware: visibleTabs from DB:", visibleTabs)

  if (visibleTabs.length === 0) {
    console.log("[v0] middleware: No tabs assigned for sub-admin:", agentId)
    return []
  }

  // Filter tabs to only show assigned ones
  const filteredTabs = allTabs.filter((tab) => visibleTabs.includes(tab.id))

  // User request: "only the tab assigned to them"
  // If no assigned tabs are found in the config, we might need a fallback, but per request, we should follow assignment

  if (filteredTabs.length === 0 && visibleTabs.length > 0) {
    console.warn("[v0] middleware: Assigned tabs found in DB but not in TAB_CONFIG:", visibleTabs)
  }

  return filteredTabs
}

// Check if agent is sub-admin and should have restricted access
export async function isRestrictedSubAdmin(agentId: string): Promise<boolean> {
  const role = await getAgentSubAdminRole(agentId)
  return role !== null && role.is_active
}

export async function canSubAdminAccessPath(agentId: string, path: string): Promise<boolean> {
  // If it's just the main admin page, all sub-admins can access it (tabs will be filtered)
  if (path === "/admin" || path === "/admin/") return true

  const visibleTabs = await getAgentVisibleTabs(agentId)

  // Map sub-paths to tab IDs
  // This ensures that even if they try to navigate directly to a sub-page, they are blocked
  const tabRouteMap: Record<string, string> = {
    "/admin/agents": "agents",
    "/admin/agent-management": "agent-management",
    "/admin/sub-admin-management": "sub-admin-management",
    "/admin/manual-registration": "manual-registration",
    "/admin/wholesale": "wholesale",
    "/admin/properties": "properties",
    "/admin/blogs": "blogs",
    "/admin/services": "services",
    "/admin/data": "data",
    "/admin/orders": "orders",
    "/admin/referrals": "referrals",
    "/admin/payouts": "payouts",
    "/admin/wallets": "wallets",
    "/admin/savings": "savings",
    "/admin/compliance": "compliance",
    "/admin/professional-writing": "professional-writing",
    "/admin/maintenance": "maintenance",
    "/admin/invitation-management": "invitation-management",
    "/admin/online-courses": "online-courses",
    "/admin/audio-management": "audio-management",
    "/admin/link-cache": "link-cache",
    "/admin/teacher-hub": "teacher-hub",
  }

  // Find the matching tab ID for the current path
  const matchedTabId = Object.entries(tabRouteMap).find(([route]) => path.startsWith(route))?.[1]

  // If the path isn't mapped, it might be a general admin path or a new feature
  // We allow it for now, but strictly check mapped restricted tabs
  if (!matchedTabId) return true

  return visibleTabs.includes(matchedTabId)
}
