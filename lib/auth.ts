// Re-export everything from the unified auth system
export * from "./unified-auth-system"

// Keep the original interfaces for backwards compatibility
export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface AdminSession {
  id: string
  admin_id: string
  session_token: string
  expires_at: string
  created_at: string
}

import {
  getStoredAdmin,
  setStoredAdmin,
  clearStoredAdmin,
  type AdminUser as UnifiedAdminUser,
} from "./unified-auth-system"

// ============ CLIENT-SIDE AUTHENTICATION ============
// Delegate to unified-auth-system (admin_user localStorage key)

export function getCurrentAdmin(): UnifiedAdminUser | null {
  return getStoredAdmin()
}

export function getAdminSession(): UnifiedAdminUser | null {
  return getStoredAdmin()
}

export function setCurrentAdmin(admin: UnifiedAdminUser): void {
  setStoredAdmin(admin)
}

export function clearCurrentAdmin(): void {
  clearStoredAdmin()
}

/**
 * Server-side admin authentication for API routes
 * API routes should use authenticateAdmin from @/lib/api-auth
 */
export async function getCurrentAdminServer(): Promise<AdminUser | null> {
  return null
}

export async function verifyAdminSession(_token?: string): Promise<{ valid: boolean; user?: AdminUser }> {
  const admin = getStoredAdmin()
  return {
    valid: !!admin,
    user: admin || undefined,
  }
}

export const getAgentToken = () => null
export const getAdminToken = () => null
