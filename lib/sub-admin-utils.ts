/**
 * Sub-Admin Utilities
 * Provides helper functions for managing sub-admin roles and permissions
 */

export interface SubAdminRole {
  id: string
  name: string
  permissions: string[]
  isRestricted?: boolean
}

export interface AdminTabs {
  id: string
  label: string
  icon?: any
  requiresPermission?: string
}

/**
 * Check if an admin is a restricted sub-admin
 * Restricted sub-admins have limited access to features
 */
export function isRestrictedSubAdmin(adminRole?: string | null): boolean {
  if (!adminRole) return false;
  
  // List of restricted sub-admin roles
  const restrictedRoles = ['sub_admin', 'limited_admin', 'support_admin']
  
  return restrictedRoles.some(role => 
    adminRole?.toLowerCase().includes(role.toLowerCase())
  )
}

/**
 * Filter tabs based on sub-admin permissions
 * Returns only tabs that the current admin should have access to
 */
export function filterTabsForSubAdmin(
  allTabs: AdminTabs[],
  adminRole?: string | null,
  adminPermissions?: string[]
): AdminTabs[] {
  // If not a restricted sub-admin, return all tabs
  if (!isRestrictedSubAdmin(adminRole)) {
    return allTabs
  }

  // Define which tabs are restricted for sub-admins
  const restrictedTabIds = [
    'agents_management',
    'sub_admin_management',
    'system_settings',
    'admin_actions_log'
  ]

  // Filter tabs
  return allTabs.filter(tab => {
    // Allow if tab is not in restricted list
    if (!restrictedTabIds.includes(tab.id)) {
      return true
    }

    // Allow if admin has specific permission
    if (adminPermissions && tab.requiresPermission) {
      return adminPermissions.includes(tab.requiresPermission)
    }

    return false
  })
}

/**
 * Get default permissions for a sub-admin role
 */
export function getSubAdminDefaultPermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'support_admin': ['view_tickets', 'respond_tickets', 'view_agents'],
    'limited_admin': ['view_dashboard', 'view_agents', 'view_transactions'],
    'sub_admin': ['view_dashboard', 'view_agents', 'manage_agents', 'view_transactions'],
    'full_admin': [
      'manage_admins',
      'manage_agents',
      'manage_transactions',
      'manage_system',
      'view_all_data'
    ]
  }

  return permissionMap[role.toLowerCase()] || []
}

/**
 * Check if a sub-admin can perform a specific action
 */
export function canSubAdminPerformAction(
  action: string,
  adminPermissions?: string[]
): boolean {
  if (!adminPermissions) {
    return false
  }

  // Define which actions require which permissions
  const actionPermissionMap: Record<string, string> = {
    'approve_agent': 'manage_agents',
    'suspend_agent': 'manage_agents',
    'view_agent_details': 'view_agents',
    'process_transaction': 'manage_transactions',
    'view_transaction': 'view_transactions',
    'manage_admins': 'manage_admins',
    'system_settings': 'manage_system'
  }

  const requiredPermission = actionPermissionMap[action]
  if (!requiredPermission) {
    return true // Allow if action not in restriction map
  }

  return adminPermissions.includes(requiredPermission)
}
