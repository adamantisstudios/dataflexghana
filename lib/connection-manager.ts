import { supabase } from "@/lib/supabase-client"
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
  private visibilityResumeTimeout: NodeJS.Timeout | null = null
  private listeners: Set<(status: ConnectionStatus) => void> = new Set()
  private monitoringPaused = false

  private readonly CONNECTION_CHECK_INTERVAL = 30000
  private readonly RECONNECT_DELAY_MS = 30000
  private readonly VISIBILITY_RESUME_DELAY_MS = 3000

  private boundHandleOnline = this.handleOnline.bind(this)
  private boundHandleOffline = this.handleOffline.bind(this)
  private boundHandleVisibilityChange = this.handleVisibilityChange.bind(this)

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

    window.addEventListener("online", this.boundHandleOnline)
    window.addEventListener("offline", this.boundHandleOffline)
    document.addEventListener("visibilitychange", this.boundHandleVisibilityChange)

    if (!document.hidden) {
      this.startConnectionChecks()
    }
  }

  private handleOnline(): void {
    this.connectionStatus.isOnline = true
    if (!document.hidden) {
      this.attemptReconnection()
    }
  }

  private handleOffline(): void {
    this.connectionStatus.isOnline = false
    this.connectionStatus.isConnected = false
    this.connectionStatus.isSessionValid = false
    this.updateRealtimeStatus()
    this.notifyListeners()
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.pauseConnectionChecks()
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }
      if (this.visibilityResumeTimeout) {
        clearTimeout(this.visibilityResumeTimeout)
        this.visibilityResumeTimeout = null
      }
      return
    }

    if (this.connectionStatus.isOnline) {
      this.resumeConnectionChecks()
      if (this.visibilityResumeTimeout) {
        clearTimeout(this.visibilityResumeTimeout)
      }
      this.visibilityResumeTimeout = setTimeout(() => {
        this.visibilityResumeTimeout = null
        void this.checkConnection()
      }, this.VISIBILITY_RESUME_DELAY_MS)
    }
  }

  private pauseConnectionChecks(): void {
    this.monitoringPaused = true
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
      this.connectionCheckInterval = null
    }
  }

  private resumeConnectionChecks(): void {
    this.monitoringPaused = false
    this.startConnectionChecks()
  }

  private startConnectionChecks(): void {
    if (this.monitoringPaused || typeof document !== "undefined" && document.hidden) return
    if (this.connectionCheckInterval) return

    this.connectionCheckInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return
      void this.checkConnection()
    }, this.CONNECTION_CHECK_INTERVAL)
  }

  private async checkConnection(): Promise<boolean> {
    if (!this.connectionStatus.isOnline || (typeof document !== "undefined" && document.hidden)) {
      return false
    }

    try {
      const sessionStatus = await sessionManager.validateSession()
      const wasSessionValid = this.connectionStatus.isSessionValid
      this.connectionStatus.isSessionValid = sessionStatus.isValid

      if (!sessionStatus.isValid && wasSessionValid) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          const refreshed = await sessionManager.refreshSession()
          this.connectionStatus.isSessionValid = refreshed
        } else {
          this.connectionStatus.isSessionValid = false
        }
      }

      const { error } = await supabase.from("agents").select("id").limit(1)

      const isConnected = !error || !this.isConnectionError(error)

      const wasConnected = this.connectionStatus.isConnected
      this.connectionStatus.isConnected = isConnected

      if (isConnected && !wasConnected) {
        this.connectionStatus.lastConnected = Date.now()
        this.connectionStatus.reconnectAttempts = 0
        await realtimeManager.reconnectAll()
        this.updateRealtimeStatus()
        this.notifyListeners()
      } else if (!isConnected && wasConnected) {
        this.attemptReconnection()
      }

      this.updateRealtimeStatus()

      return isConnected && this.connectionStatus.isSessionValid
    } catch (error) {
      console.error("[connection-manager] Connection check failed:", error)
      if (this.connectionStatus.isConnected) {
        this.connectionStatus.isConnected = false
        this.attemptReconnection()
      }
      return false
    }
  }

  private isConnectionError(error: { message?: string; code?: string } | null): boolean {
    if (!error) return false

    const errorMessage = error.message?.toLowerCase() || ""
    const errorCode = error.code || ""

    return (
      errorCode === "PGRST301" ||
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
    if (typeof document !== "undefined" && document.hidden) return

    if (this.connectionStatus.reconnectAttempts >= this.connectionStatus.maxReconnectAttempts) {
      console.error("[connection-manager] Max reconnection attempts reached")
      this.notifyListeners()
      return
    }

    this.connectionStatus.reconnectAttempts++
    this.notifyListeners()

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null
      if (typeof document !== "undefined" && document.hidden) return

      try {
        const sessionValid = await sessionManager.checkAndRefreshIfNeeded()
        if (!sessionValid) {
          if (this.connectionStatus.reconnectAttempts < this.connectionStatus.maxReconnectAttempts) {
            this.attemptReconnection()
          }
          return
        }

        const connected = await this.checkConnection()
        if (!connected) {
          if (this.connectionStatus.reconnectAttempts < this.connectionStatus.maxReconnectAttempts) {
            this.attemptReconnection()
          }
        } else {
          await realtimeManager.reconnectAll()
        }
      } catch (error) {
        console.error("[connection-manager] Reconnection attempt failed:", error)
        if (this.connectionStatus.reconnectAttempts < this.connectionStatus.maxReconnectAttempts) {
          this.attemptReconnection()
        }
      }
    }, this.RECONNECT_DELAY_MS)
  }

  public async forceReconnect(): Promise<boolean> {
    this.connectionStatus.reconnectAttempts = 0

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    try {
      const sessionValid = await sessionManager.checkAndRefreshIfNeeded()
      if (!sessionValid) {
        const refreshed = await sessionManager.refreshSession()
        if (!refreshed) {
          return false
        }
      }

      const connected = await this.checkConnection()
      if (!connected) {
        this.attemptReconnection()
        return false
      }

      await realtimeManager.reconnectAll()
      this.updateRealtimeStatus()
      this.notifyListeners()

      return true
    } catch (error) {
      console.error("[connection-manager] Force reconnect failed:", error)
      return false
    }
  }

  public getConnectionStatus(): ConnectionStatus {
    this.updateRealtimeStatus()
    return { ...this.connectionStatus }
  }

  public addConnectionListener(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(listener)

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
        console.error("[connection-manager] Error notifying connection listener:", error)
      }
    })
  }

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
    this.pauseConnectionChecks()

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.visibilityResumeTimeout) {
      clearTimeout(this.visibilityResumeTimeout)
      this.visibilityResumeTimeout = null
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.boundHandleOnline)
      window.removeEventListener("offline", this.boundHandleOffline)
      document.removeEventListener("visibilitychange", this.boundHandleVisibilityChange)
    }

    this.listeners.clear()
  }
}

export const connectionManager = ConnectionManager.getInstance()
