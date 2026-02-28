import { supabase } from "./supabase"
import { sessionManager } from "./session-manager"
import { realtimeManager } from "./realtime-manager"

export interface ConnectionStatus {
  isOnline: boolean
  isConnected: boolean
  isSessionValid: boolean
  lastConnected: number
  reconnectAttempts: number
  maxReconnectAttempts: number
  realtimeStatus: {
    total: number
    active: number
    inactive: number
  }
}

export class ConnectionManager {
  private static instance: ConnectionManager
  private connectionStatus: ConnectionStatus = {
    isOnline: typeof window !== "undefined" ? (navigator?.onLine ?? true) : true,
    isConnected: true,
    isSessionValid: true,
    lastConnected: Date.now(),
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    realtimeStatus: { total: 0, active: 0, inactive: 0 },
  }

  private connectionCheckInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private listeners: Set<(status: ConnectionStatus) => void> = new Set()

  private readonly CONNECTION_CHECK_INTERVAL = 10000 // 10 seconds (more frequent)
  private readonly RECONNECT_DELAY_BASE = 1000 // 1 second base delay
  private readonly MAX_RECONNECT_DELAY = 30000 // 30 seconds max delay

  private constructor() {
    this.initializeConnectionMonitoring()
  }

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  private initializeConnectionMonitoring(): void {
    if (typeof window === "undefined") return

    // Monitor online/offline status
    window.addEventListener("online", this.handleOnline.bind(this))
    window.addEventListener("offline", this.handleOffline.bind(this))

    // Monitor tab visibility for connection recovery
    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this))

    // Start periodic connection checks
    this.startConnectionChecks()
  }

  private handleOnline(): void {
    console.log("Network connection restored")
    this.connectionStatus.isOnline = true
    this.attemptReconnection()
  }

  private handleOffline(): void {
    console.log("Network connection lost")
    this.connectionStatus.isOnline = false
    this.connectionStatus.isConnected = false
    this.connectionStatus.isSessionValid = false
    this.updateRealtimeStatus()
    this.notifyListeners()
  }

  private handleVisibilityChange(): void {
    if (!document.hidden && this.connectionStatus.isOnline) {
      console.log("Tab became visible, checking connection status...")
      // Delay to allow for network stabilization
      setTimeout(() => {
        this.checkConnection()
      }, 2000)
    }
  }

  private startConnectionChecks(): void {
    if (this.connectionCheckInterval) return

    this.connectionCheckInterval = setInterval(async () => {
      await this.checkConnection()
    }, this.CONNECTION_CHECK_INTERVAL)
  }

  private async checkConnection(): Promise<boolean> {
    if (!this.connectionStatus.isOnline) {
      return false
    }

    try {
      // First check session validity
      const sessionStatus = await sessionManager.validateSession()
      const wasSessionValid = this.connectionStatus.isSessionValid
      this.connectionStatus.isSessionValid = sessionStatus.isValid

      // If session became invalid, attempt refresh only if we have a session to refresh
      if (!sessionStatus.isValid && wasSessionValid) {
        console.log("Session became invalid, checking if refresh is possible...")

        // Check if we actually have a session before attempting refresh
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          console.log("Session exists, attempting refresh...")
          const refreshed = await sessionManager.refreshSession()
          this.connectionStatus.isSessionValid = refreshed
        } else {
          console.log("No session available - cannot refresh")
          this.connectionStatus.isSessionValid = false
        }
      }

      // Quick connection test with minimal data
      const { error } = await supabase.from("agents").select("id").limit(1)

      const isConnected = !error || !this.isConnectionError(error)

      // Update connection status
      const wasConnected = this.connectionStatus.isConnected
      this.connectionStatus.isConnected = isConnected

      if (isConnected && !wasConnected) {
        // Connection restored
        console.log("Database connection restored")
        this.connectionStatus.lastConnected = Date.now()
        this.connectionStatus.reconnectAttempts = 0

        // Reconnect realtime subscriptions
        await realtimeManager.reconnectAll()

        this.updateRealtimeStatus()
        this.notifyListeners()
      } else if (!isConnected && wasConnected) {
        // Connection lost
        console.log("Database connection lost")
        this.attemptReconnection()
      }

      // Always update realtime status
      this.updateRealtimeStatus()

      return isConnected && this.connectionStatus.isSessionValid
    } catch (error) {
      console.error("Connection check failed:", error)
      if (this.connectionStatus.isConnected) {
        this.connectionStatus.isConnected = false
        this.attemptReconnection()
      }
      return false
    }
  }

  private isConnectionError(error: any): boolean {
    if (!error) return false

    const errorMessage = error.message?.toLowerCase() || ""
    const errorCode = error.code || ""

    return (
      errorCode === "PGRST301" || // Connection error
      errorMessage.includes("network") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("fetch")
    )
  }

  private updateRealtimeStatus(): void {
    const status = realtimeManager.getSubscriptionStatus()
    this.connectionStatus.realtimeStatus = {
      total: status.total,
      active: status.active,
      inactive: status.inactive,
    }
  }

  private async attemptReconnection(): Promise<void> {
    if (this.connectionStatus.reconnectAttempts >= this.connectionStatus.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached")
      this.notifyListeners()
      return
    }

    this.connectionStatus.reconnectAttempts++

    // Calculate exponential backoff delay
    const delay = Math.min(
      this.RECONNECT_DELAY_BASE * Math.pow(2, this.connectionStatus.reconnectAttempts - 1),
      this.MAX_RECONNECT_DELAY,
    )

    console.log(
      `Attempting reconnection ${this.connectionStatus.reconnectAttempts}/${this.connectionStatus.maxReconnectAttempts} in ${delay}ms`,
    )

    this.notifyListeners() // Notify about reconnection attempt

    this.reconnectTimeout = setTimeout(async () => {
      try {
        // First ensure session is valid
        const sessionValid = await sessionManager.checkAndRefreshIfNeeded()
        if (!sessionValid) {
          console.log("Session invalid during reconnection attempt")
          // Try again if not at max attempts
          if (this.connectionStatus.reconnectAttempts < this.connectionStatus.maxReconnectAttempts) {
            this.attemptReconnection()
          }
          return
        }

        // Test connection
        const connected = await this.checkConnection()
        if (!connected) {
          // Retry if not at max attempts
          if (this.connectionStatus.reconnectAttempts < this.connectionStatus.maxReconnectAttempts) {
            this.attemptReconnection()
          }
        } else {
          // Success - reconnect realtime subscriptions
          await realtimeManager.reconnectAll()
        }
      } catch (error) {
        console.error("Reconnection attempt failed:", error)
        if (this.connectionStatus.reconnectAttempts < this.connectionStatus.maxReconnectAttempts) {
          this.attemptReconnection()
        }
      }
    }, delay)
  }

  public async forceReconnect(): Promise<boolean> {
    console.log("Force reconnecting...")

    // Reset reconnection attempts
    this.connectionStatus.reconnectAttempts = 0

    // Clear any existing reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    try {
      // Ensure session is valid first
      const sessionValid = await sessionManager.checkAndRefreshIfNeeded()
      if (!sessionValid) {
        console.log("Session refresh failed during force reconnect")
        // Try to refresh session
        const refreshed = await sessionManager.refreshSession()
        if (!refreshed) {
          return false
        }
      }

      // Test connection
      const connected = await this.checkConnection()
      if (!connected) {
        this.attemptReconnection()
        return false
      }

      // Force reconnect realtime subscriptions
      await realtimeManager.reconnectAll()

      // Update status
      this.updateRealtimeStatus()
      this.notifyListeners()

      return true
    } catch (error) {
      console.error("Force reconnect failed:", error)
      return false
    }
  }

  public getConnectionStatus(): ConnectionStatus {
    // Update realtime status before returning
    this.updateRealtimeStatus()
    return { ...this.connectionStatus }
  }

  public addConnectionListener(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    const status = this.getConnectionStatus()
    this.listeners.forEach((listener) => {
      try {
        listener(status)
      } catch (error) {
        console.error("Error notifying connection listener:", error)
      }
    })
  }

  /**
   * Get detailed connection health information
   */
  public getHealthStatus(): {
    overall: "healthy" | "degraded" | "unhealthy"
    details: {
      network: boolean
      database: boolean
      session: boolean
      realtime: {
        total: number
        active: number
        healthy: boolean
      }
    }
  } {
    const status = this.getConnectionStatus()
    const realtimeHealthy =
      status.realtimeStatus.total === 0 || status.realtimeStatus.active / status.realtimeStatus.total >= 0.8

    const healthy = status.isOnline && status.isConnected && status.isSessionValid && realtimeHealthy
    const degraded = status.isOnline && (status.isConnected || status.isSessionValid) && !healthy

    return {
      overall: healthy ? "healthy" : degraded ? "degraded" : "unhealthy",
      details: {
        network: status.isOnline,
        database: status.isConnected,
        session: status.isSessionValid,
        realtime: {
          total: status.realtimeStatus.total,
          active: status.realtimeStatus.active,
          healthy: realtimeHealthy,
        },
      },
    }
  }

  public destroy(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
      this.connectionCheckInterval = null
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline.bind(this))
      window.removeEventListener("offline", this.handleOffline.bind(this))
      document.removeEventListener("visibilitychange", this.handleVisibilityChange.bind(this))
    }

    this.listeners.clear()
  }
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance()
