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

// Import the unified functions
import { getStoredAdmin } from "./unified-auth-system"

// ============ CLIENT-SIDE AUTHENTICATION ============

/**
 * Get current admin from localStorage
 * Returns the admin object if authenticated, null otherwise
 */
export function getCurrentAdmin(): any | null {
  if (typeof window === "undefined") return null

  try {
    const adminData = localStorage.getItem("currentAdmin")
    if (!adminData) return null

    const admin = JSON.parse(adminData)

    // Validate admin object has required fields
    if (!admin.id || !admin.name) {
      console.warn("Invalid admin data in localStorage")
      localStorage.removeItem("currentAdmin")
      return null
    }

    return admin
  } catch (error) {
    console.error("Error parsing admin data from localStorage:", error)
    localStorage.removeItem("currentAdmin")
    return null
  }
}

export function getAdminSession(): any | null {
  return getCurrentAdmin()
}

/**
 * Set current admin in localStorage
 */
export function setCurrentAdmin(admin: any): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("currentAdmin", JSON.stringify(admin))
  } catch (error) {
    console.error("Error saving admin data to localStorage:", error)
  }
}

/**
 * Clear current admin from localStorage
 */
export function clearCurrentAdmin(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem("currentAdmin")
  } catch (error) {
    console.error("Error clearing admin data from localStorage:", error)
  }
}

/**
 * Server-side admin authentication for API routes
 * This function works in server-side contexts where localStorage is not available
 * For Pages Router, we'll use a different approach without cookies from next/headers
 */
export async function getCurrentAdminServer(): Promise<AdminUser | null> {
  // For Pages Router, we can't use next/headers cookies
  // API routes should handle authentication differently
  return null
}

// Verify admin session - simplified since we're using localStorage
export async function verifyAdminSession(token?: string): Promise<{ valid: boolean; user?: AdminUser }> {
  const admin = getStoredAdmin()
  return {
    valid: !!admin,
    user: admin || undefined,
  }
}

// Agent functions - now using unified system
export const getAgentToken = () => null // No longer using tokens
export const getAdminToken = () => null // No longer using tokens
