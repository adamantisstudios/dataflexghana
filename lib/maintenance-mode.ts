import { supabase } from '@/lib/supabase'
export interface MaintenanceMode {
  isEnabled: boolean
  title: string
  message: string
  estimatedCompletion?: string | null
  countdownEnabled: boolean
  countdownEndTime?: string | null
  updatedAt: string
}
export interface MaintenanceLog {
  id: string
  action: 'enabled' | 'disabled' | 'updated'
  admin_id?: string
  admin_email?: string
  previous_state?: any
  new_state?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}
// Cache for maintenance mode status to reduce database calls
let maintenanceCache: {
  data: MaintenanceMode | null
  timestamp: number
} = {
  data: null,
  timestamp: 0
}
const CACHE_DURATION = 30 * 1000 // 30 seconds
// Special test account phone number
export const SPECIAL_TEST_PHONE = '+233546460945'
/**
 * Check if the site is currently in maintenance mode
 * Uses caching to reduce database load
 */
export async function checkMaintenanceMode(): Promise<MaintenanceMode | null> {
  const now = Date.now()
  // Return cached data if it's still fresh
  if (maintenanceCache.data && (now - maintenanceCache.timestamp) < CACHE_DURATION) {
    return maintenanceCache.data
  }
  try {
    const { data, error } = await supabase
      .from('maintenance_mode')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error) {
      console.error('Error checking maintenance mode:', error)
      return null
    }
    const maintenanceData: MaintenanceMode = {
      isEnabled: data.is_enabled,
      title: data.title,
      message: data.message,
      estimatedCompletion: data.estimated_completion,
      countdownEnabled: data.countdown_enabled,
      countdownEndTime: data.countdown_end_time,
      updatedAt: data.updated_at
    }
    // Update cache
    maintenanceCache = {
      data: maintenanceData,
      timestamp: now
    }
    return maintenanceData
  } catch (error) {
    console.error('Maintenance mode check error:', error)
    return null
  }
}
/**
 * Clear the maintenance mode cache
 * Call this after updating maintenance mode settings
 */
export function clearMaintenanceCache(): void {
  maintenanceCache = {
    data: null,
    timestamp: 0
  }
}
/**
 * Check if current user is admin and should bypass maintenance mode
 */
export function isAdminUser(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const adminUser = localStorage.getItem('admin_user')
    return !!adminUser
  } catch {
    return false
  }
}
/**
 * Check if current user is the special test account that should bypass maintenance mode
 */
export function isSpecialTestAccount(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // Check various possible storage locations for the phone number
    const agentData = localStorage.getItem('agent')
    if (agentData) {
      const parsed = JSON.parse(agentData)
      if (parsed.phone_number === SPECIAL_TEST_PHONE || parsed.phone === SPECIAL_TEST_PHONE) {
        return true
      }
    }
    const agentAuth = localStorage.getItem('agent_auth')
    if (agentAuth) {
      const parsed = JSON.parse(agentAuth)
      if (parsed.phone_number === SPECIAL_TEST_PHONE || parsed.phone === SPECIAL_TEST_PHONE) {
        return true
      }
    }
    const userSession = localStorage.getItem('user_session')
    if (userSession) {
      const parsed = JSON.parse(userSession)
      if (parsed.phone_number === SPECIAL_TEST_PHONE || parsed.phone === SPECIAL_TEST_PHONE) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}
/**
 * Check if current user should bypass maintenance mode (admin or special test account)
 */
export function shouldBypassMaintenance(): boolean {
  return isAdminUser() || isSpecialTestAccount()
}
/**
 * Update maintenance mode settings (Admin only)
 */
export async function updateMaintenanceMode(settings: {
  isEnabled: boolean
  title?: string
  message?: string
  estimatedCompletion?: string | null
  countdownEnabled?: boolean
  countdownEndTime?: string | null
}): Promise<{ success: boolean; error?: string; data?: MaintenanceMode }> {
  try {
    // Get admin user from localStorage for authentication
    let adminUser = null
    if (typeof window !== 'undefined') {
      try {
        const storedAdmin = localStorage.getItem('admin_user')
        if (storedAdmin) {
          adminUser = JSON.parse(storedAdmin)
        }
      } catch (error) {
        console.error('Error parsing admin user:', error)
      }
    }

    if (!adminUser) {
      return { success: false, error: 'Admin authentication required' }
    }

    const response = await fetch('/api/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': 'true',
        'x-admin-id': adminUser.id || adminUser.user_id || 'admin',
        'x-admin-email': adminUser.email || 'admin@example.com',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(settings),
    })

    const result = await response.json()
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to update maintenance mode' }
    }

    // Clear cache after successful update and force browser cache refresh
    clearMaintenanceCache()

    // Clear browser cache for maintenance API endpoint
    if (typeof window !== 'undefined') {
      try {
        // Force refresh of maintenance status across all tabs
        localStorage.setItem('maintenance_updated', Date.now().toString())
        localStorage.setItem('maintenance_status', JSON.stringify({
          isEnabled: settings.isEnabled,
          timestamp: Date.now()
        }))

        // Clear any cached responses
        if ('caches' in window) {
          caches.delete('maintenance-cache').catch(() => {})
          // Also clear the default cache
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('maintenance') || cacheName.includes('api')) {
                caches.delete(cacheName).catch(() => {})
              }
            })
          }).catch(() => {})
        }

        // Broadcast maintenance status change to other tabs
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('maintenance-status')
          channel.postMessage({
            type: 'maintenance-updated',
            isEnabled: settings.isEnabled,
            timestamp: Date.now()
          })
          channel.close()
        }
      } catch (error) {
        console.error('Error clearing browser cache:', error)
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error updating maintenance mode:', error)
    return { success: false, error: 'Network error occurred' }
  }
}
/**
 * Fetch maintenance mode logs (Admin only)
 */
export async function getMaintenanceLogs(page = 1, limit = 20): Promise<{
  success: boolean
  error?: string
  data?: MaintenanceLog[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> {
  try {
    // Get admin user from localStorage for authentication
    let adminUser = null
    if (typeof window !== 'undefined') {
      try {
        const storedAdmin = localStorage.getItem('admin_user')
        if (storedAdmin) {
          adminUser = JSON.parse(storedAdmin)
        }
      } catch (error) {
        console.error('Error parsing admin user:', error)
      }
    }
    if (!adminUser) {
      return { success: false, error: 'Admin authentication required' }
    }
    const response = await fetch(`/api/maintenance/logs?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': 'true',
        'x-admin-id': adminUser.id || adminUser.user_id || 'admin',
        'x-admin-email': adminUser.email || 'admin@example.com',
      },
    })
    
    const result = await response.json()
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch maintenance logs' }
    }
    return { success: true, data: result.data, pagination: result.pagination }
  } catch (error) {
    console.error('Error fetching maintenance logs:', error)
    return { success: false, error: 'Network error occurred' }
  }
}
/**
 * Format time remaining for countdown
 */
export function formatTimeRemaining(endTime: string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
} {
  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const total = end - now
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds, total }
}
/**
 * Client-side maintenance mode check with bypass logic
 */
export async function checkMaintenanceModeClient(): Promise<{
  isInMaintenance: boolean
  shouldBypass: boolean
  maintenanceData?: MaintenanceMode
}> {
  try {
    const response = await fetch('/api/maintenance', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      return { isInMaintenance: false, shouldBypass: false }
    }
    const result = await response.json()
    const maintenanceData = result.data
    if (!result.success || !maintenanceData.isEnabled) {
      return { isInMaintenance: false, shouldBypass: false, maintenanceData }
    }
    const shouldBypass = shouldBypassMaintenance()
    
    return {
      isInMaintenance: true,
      shouldBypass,
      maintenanceData
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error)
    return { isInMaintenance: false, shouldBypass: false }
  }
}
