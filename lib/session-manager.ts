import { supabase } from './supabase'

export interface SessionStatus {
  isValid: boolean
  isExpired: boolean
  expiresAt: number | null
  needsRefresh: boolean
}

export class SessionManager {
  private static instance: SessionManager
  private sessionCheckInterval: NodeJS.Timeout | null = null
  private refreshTimeout: NodeJS.Timeout | null = null
  private lastSessionCheck: number = 0
  private readonly SESSION_CHECK_INTERVAL = 30000 // 30 seconds (less frequent to reduce noise)
  private readonly SESSION_REFRESH_THRESHOLD = 600000 // 10 minutes before expiry
  private readonly PROACTIVE_REFRESH_THRESHOLD = 1800000 // 30 minutes before expiry
  private isRefreshing: boolean = false
  private refreshPromise: Promise<boolean> | null = null

  private constructor() {
    this.startSessionMonitoring()
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Check if the current session is valid and not expired
   */
  public async validateSession(): Promise<SessionStatus> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.warn('Session validation error:', error.message)
        return {
          isValid: false,
          isExpired: true,
          expiresAt: null,
          needsRefresh: false // Don't attempt refresh on error
        }
      }

      if (!session) {
        // No session available - this is normal for logged out users
        return {
          isValid: false,
          isExpired: false,
          expiresAt: null,
          needsRefresh: false
        }
      }

      const now = Date.now()
      const expiresAt = session.expires_at ? session.expires_at * 1000 : null
      const isExpired = expiresAt ? now >= expiresAt : false
      const needsRefresh = expiresAt ? (expiresAt - now) < this.SESSION_REFRESH_THRESHOLD : false

      return {
        isValid: !isExpired,
        isExpired,
        expiresAt,
        needsRefresh
      }
    } catch (error) {
      console.warn('Session validation failed:', error)
      return {
        isValid: false,
        isExpired: true,
        expiresAt: null,
        needsRefresh: false
      }
    }
  }

  /**
   * Refresh the current session
   */
  public async refreshSession(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.performRefresh()

    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        console.warn('No session available for refresh')
        return false
      }

      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: session.refresh_token
      })

      if (refreshError) {
        console.warn('Session refresh failed:', refreshError.message)
        return false
      }

      if (data.session) {
        console.log('Session refreshed successfully')
        return true
      }

      return false
    } catch (error) {
      console.warn('Session refresh error:', error)
      return false
    }
  }

  /**
   * Start monitoring session status
   */
  private startSessionMonitoring(): void {
    // Clear any existing interval
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
    }

    this.sessionCheckInterval = setInterval(async () => {
      try {
        const status = await this.validateSession()
        
        // Only log if there's an actual session to manage
        if (status.isValid || status.needsRefresh) {
          if (status.needsRefresh && !this.isRefreshing) {
            console.log('Session needs refresh, attempting refresh...')
            await this.refreshSession()
          }
        }
      } catch (error) {
        // Silently handle errors to avoid console spam
        console.debug('Session monitoring error:', error)
      }
    }, this.SESSION_CHECK_INTERVAL)
  }

  /**
   * Stop session monitoring
   */
  public stopMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
      this.sessionCheckInterval = null
    }

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }

  /**
   * Check if session monitoring is active
   */
  public isMonitoring(): boolean {
    return this.sessionCheckInterval !== null
  }

  /**
   * Get session status without triggering refresh
   */
  public async getSessionStatus(): Promise<SessionStatus> {
    return this.validateSession()
  }

  /**
   * Force a session check and refresh if needed
   */
  public async checkAndRefreshIfNeeded(): Promise<boolean> {
    const status = await this.validateSession()
    
    if (status.needsRefresh && !this.isRefreshing) {
      return this.refreshSession()
    }
    
    return status.isValid
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sessionManager.stopMonitoring()
  })

  // Handle visibility changes to reduce unnecessary checks when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Tab became visible, check session health
      console.log('Tab became visible, checking session health...')
      sessionManager.checkAndRefreshIfNeeded().catch(error => {
        console.debug('Session check failed:', error)
      })
    }
  })
}
