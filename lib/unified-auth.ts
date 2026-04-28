// Unified Authentication System
// Works with both admin and agent authentication using direct database queries

import { supabase } from '@/lib/supabase'

export interface UnifiedUser {
  id: string
  email?: string
  phone_number?: string
  full_name: string
  role: 'admin' | 'agent'
  is_active: boolean
  isapproved?: boolean // For agents
}

// Storage keys
export const ADMIN_STORAGE_KEY = "admin_user"
export const AGENT_STORAGE_KEY = "agent"

/**
 * Get current user (admin or agent) from localStorage
 */
export function getCurrentUser(): UnifiedUser | null {
  if (typeof window === 'undefined') return null

  // Try admin first
  const adminUser = getStoredAdmin()
  if (adminUser) {
    return {
      id: adminUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
      role: 'admin',
      is_active: adminUser.is_active
    }
  }

  // Try agent
  const agentUser = getStoredAgent()
  if (agentUser) {
    return {
      id: agentUser.id,
      email: agentUser.email,
      phone_number: agentUser.phone_number,
      full_name: agentUser.full_name,
      role: 'agent',
      is_active: true,
      isapproved: agentUser.isapproved
    }
  }

  return null
}

/**
 * Get stored admin from localStorage
 */
function getStoredAdmin(): any | null {
  if (typeof window === 'undefined') return null

  try {
    const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (!storedAdmin) return null

    const admin = JSON.parse(storedAdmin)
    if (!admin.id || !admin.email || !admin.is_active) {
      return null
    }

    return admin
  } catch (error) {
    console.error('Error getting stored admin:', error)
    return null
  }
}

/**
 * Get stored agent from localStorage
 */
function getStoredAgent(): any | null {
  if (typeof window === 'undefined') return null

  try {
    const storedAgent = localStorage.getItem(AGENT_STORAGE_KEY)
    if (!storedAgent) return null

    const agent = JSON.parse(storedAgent)
    if (!agent.id || !agent.phone_number || !agent.isapproved) {
      return null
    }

    return agent
  } catch (error) {
    console.error('Error getting stored agent:', error)
    return null
  }
}

/**
 * Check if user has access to savings features
 */
export function canAccessSavings(user: UnifiedUser | null): boolean {
  if (!user) return false
  
  // Admins can access all savings features
  if (user.role === 'admin' && user.is_active) {
    return true
  }
  
  // Agents can access their own savings if approved
  if (user.role === 'agent' && user.isapproved) {
    return true
  }
  
  return false
}

/**
 * Check if user can perform admin operations
 */
export function canPerformAdminOperations(user: UnifiedUser | null): boolean {
  return user?.role === 'admin' && user.is_active === true
}

/**
 * Get user ID for API requests
 */
export function getUserId(): string | null {
  const user = getCurrentUser()
  return user?.id || null
}

/**
 * Get user role
 */
export function getUserRole(): 'admin' | 'agent' | null {
  const user = getCurrentUser()
  return user?.role || null
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return getCurrentUser() !== null
}

/**
 * Logout current user (admin or agent)
 */
export function logout(): void {
  if (typeof window === 'undefined') return

  // Clear both storage keys
  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY)
    localStorage.removeItem(AGENT_STORAGE_KEY)

    // Trigger storage events for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: ADMIN_STORAGE_KEY,
      newValue: null,
      oldValue: null
    }))
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: AGENT_STORAGE_KEY,
      newValue: null,
      oldValue: null
    }))
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const user = getCurrentUser()
  if (!user) return {}

  const headers: Record<string, string> = {}

  if (user.role === 'agent') {
    headers['x-agent-id'] = user.id
  } else if (user.role === 'admin') {
    headers['x-admin-id'] = user.id
  }

  return headers
}

/**
 * Validate savings access for specific agent
 */
export async function validateSavingsAccess(agentId: string): Promise<boolean> {
  const currentUser = getCurrentUser()
  
  if (!currentUser) return false
  
  // Admins can access any agent's savings
  if (currentUser.role === 'admin') {
    return true
  }
  
  // Agents can only access their own savings
  if (currentUser.role === 'agent' && currentUser.id === agentId) {
    return true
  }
  
  return false
}

/**
 * Get redirect path after login based on user role
 */
export function getPostLoginRedirect(role: 'admin' | 'agent'): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'agent':
      return '/agent/dashboard'
    default:
      return '/'
  }
}

/**
 * Get login path based on user role
 */
export function getLoginPath(role: 'admin' | 'agent'): string {
  switch (role) {
    case 'admin':
      return '/admin/login'
    case 'agent':
      return '/agent/login'
    default:
      return '/'
  }
}
