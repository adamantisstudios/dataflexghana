import { supabase } from './supabase-enhanced'
import { sessionManager } from './session-manager'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface RealtimeSubscription {
  id: string
  table: string
  channel: RealtimeChannel | null
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
  filter?: string
  isActive: boolean
  lastActivity: number
  reconnectAttempts: number
  reconnectTimeout?: NodeJS.Timeout
}

export class RealtimeManager {
  private static instance: RealtimeManager
  private subscriptions: Map<string, RealtimeSubscription> = new Map()
  private reconnectInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private readonly RECONNECT_INTERVAL = 30000
  private readonly HEALTH_CHECK_INTERVAL = 30000
  private readonly RECONNECT_DELAY_MS = 30000
  private readonly STALE_SUBSCRIPTION_MS = 300000
  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private isReconnecting: boolean = false
  private monitoringPaused = false

  private boundHandleOnline = () => {
    if (!document.hidden) {
      setTimeout(() => void this.reconnectAll(), 3000)
    }
  }

  private boundHandleOffline = () => {
    this.subscriptions.forEach((subscription) => {
      subscription.isActive = false
    })
  }

  private boundHandleVisibilityChange = () => {
    if (document.hidden) {
      this.pauseHealthMonitoring()
    } else {
      this.resumeHealthMonitoring()
      setTimeout(() => this.performHealthCheck(), 3000)
    }
  }

  private constructor() {
    this.setupConnectionHandlers()
    if (typeof document === 'undefined' || !document.hidden) {
      this.startHealthMonitoring()
    }
  }

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  public subscribe(
    id: string,
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    filter?: string
  ): () => void {
    this.unsubscribe(id)

    const subscription: RealtimeSubscription = {
      id,
      table,
      channel: null,
      callback: (payload) => {
        try {
          subscription.lastActivity = Date.now()
          callback(payload)
        } catch (error) {
          console.error(`[realtime-manager] Callback error for ${table}:`, error)
        }
      },
      filter,
      isActive: false,
      lastActivity: Date.now(),
      reconnectAttempts: 0
    }

    this.subscriptions.set(id, subscription)
    if (!this.monitoringPaused) {
      void this.createChannel(subscription)
    }

    return () => this.unsubscribe(id)
  }

  private async createChannel(subscription: RealtimeSubscription): Promise<void> {
    if (typeof document !== 'undefined' && document.hidden) return

    try {
      const sessionValid = await sessionManager.checkAndRefreshIfNeeded()
      if (!sessionValid) {
        this.scheduleReconnect(subscription)
        return
      }

      const channelName = `${subscription.table}_${subscription.id}_${Date.now()}`
      const channel = supabase.channel(channelName)

      const channelConfig = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: subscription.table,
          ...(subscription.filter && { filter: subscription.filter })
        },
        subscription.callback
      )

      channelConfig.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          subscription.isActive = true
          subscription.reconnectAttempts = 0
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[realtime-manager] Channel error for ${subscription.table}:`, err || 'Unknown error')
          subscription.isActive = false
          setTimeout(() => this.scheduleReconnect(subscription), this.RECONNECT_DELAY_MS)
        } else if (status === 'TIMED_OUT') {
          console.error(`[realtime-manager] Channel timeout for ${subscription.table}:`, err || 'Timed out')
          subscription.isActive = false
          this.scheduleReconnect(subscription)
        } else if (status === 'CLOSED') {
          subscription.isActive = false
          if (this.subscriptions.has(subscription.id) && !document.hidden) {
            setTimeout(() => this.scheduleReconnect(subscription), this.RECONNECT_DELAY_MS)
          }
        }
      })

      subscription.channel = channel
      this.subscriptions.set(subscription.id, subscription)

    } catch (error) {
      console.error(`[realtime-manager] Error creating channel for ${subscription.table}:`, error)
      this.scheduleReconnect(subscription)
    }
  }

  private scheduleReconnect(subscription: RealtimeSubscription): void {
    if (typeof document !== 'undefined' && document.hidden) return

    if (subscription.reconnectTimeout) {
      clearTimeout(subscription.reconnectTimeout)
      subscription.reconnectTimeout = undefined
    }

    if (subscription.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        subscription.reconnectAttempts = 0
        void this.reconnectSubscription(subscription)
      }, this.RECONNECT_DELAY_MS)
      return
    }

    subscription.reconnectAttempts++

    subscription.reconnectTimeout = setTimeout(() => {
      subscription.reconnectTimeout = undefined
      void this.reconnectSubscription(subscription)
    }, this.RECONNECT_DELAY_MS)
  }

  private async reconnectSubscription(subscription: RealtimeSubscription): Promise<void> {
    if (typeof document !== 'undefined' && document.hidden) return

    try {
      if (subscription.channel) {
        await subscription.channel.unsubscribe()
        subscription.channel = null
      }

      subscription.isActive = false
      await this.createChannel(subscription)
    } catch (error) {
      console.error(`[realtime-manager] Error reconnecting ${subscription.table}:`, error)
      this.scheduleReconnect(subscription)
    }
  }

  public async unsubscribe(id: string): Promise<void> {
    const subscription = this.subscriptions.get(id)
    if (!subscription) return

    try {
      if (subscription.reconnectTimeout) {
        clearTimeout(subscription.reconnectTimeout)
        subscription.reconnectTimeout = undefined
      }
      if (subscription.channel) {
        await subscription.channel.unsubscribe()
      }
    } catch (error) {
      console.error(`[realtime-manager] Error unsubscribing from ${subscription.table}:`, error)
    }

    this.subscriptions.delete(id)
  }

  public async reconnectAll(): Promise<void> {
    if (typeof document !== 'undefined' && document.hidden) return

    if (this.isReconnecting) {
      return
    }

    this.isReconnecting = true

    try {
      const sessionValid = await sessionManager.checkAndRefreshIfNeeded()
      if (!sessionValid) {
        console.error('[realtime-manager] Cannot reconnect subscriptions: invalid session')
        return
      }

      const reconnectPromises = Array.from(this.subscriptions.values()).map(async (subscription) => {
        if (!subscription.isActive) {
          await this.reconnectSubscription(subscription)
        }
      })

      await Promise.all(reconnectPromises)
    } catch (error) {
      console.error('[realtime-manager] Error reconnecting subscriptions:', error)
    } finally {
      this.isReconnecting = false
    }
  }

  private startHealthMonitoring(): void {
    if (typeof window === 'undefined' || this.monitoringPaused) return
    this.pauseHealthMonitoring()

    this.healthCheckInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      this.performHealthCheck()
    }, this.HEALTH_CHECK_INTERVAL)

    this.reconnectInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      this.checkForStaleSubscriptions()
    }, this.RECONNECT_INTERVAL)
  }

  private pauseHealthMonitoring(): void {
    this.monitoringPaused = true
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
  }

  private resumeHealthMonitoring(): void {
    this.monitoringPaused = false
    this.startHealthMonitoring()
    this.subscriptions.forEach((subscription) => {
      if (!subscription.isActive && !subscription.channel) {
        void this.createChannel(subscription)
      }
    })
  }

  private performHealthCheck(): void {
    if (typeof document !== 'undefined' && document.hidden) return

    const now = Date.now()

    this.subscriptions.forEach((subscription) => {
      const timeSinceActivity = now - subscription.lastActivity
      if (timeSinceActivity > this.STALE_SUBSCRIPTION_MS && subscription.isActive) {
        void this.reconnectSubscription(subscription)
      }
    })
  }

  private checkForStaleSubscriptions(): void {
    if (typeof document !== 'undefined' && document.hidden) return

    this.subscriptions.forEach((subscription) => {
      if (!subscription.isActive && subscription.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        void this.reconnectSubscription(subscription)
      }
    })
  }

  private setupConnectionHandlers(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', this.boundHandleOnline)
    window.addEventListener('offline', this.boundHandleOffline)
    document.addEventListener('visibilitychange', this.boundHandleVisibilityChange)
  }

  public getSubscriptionStatus(): {
    total: number
    active: number
    inactive: number
    subscriptions: Array<{
      id: string
      table: string
      isActive: boolean
      reconnectAttempts: number
      lastActivity: Date
    }>
  } {
    const subscriptions = Array.from(this.subscriptions.values())

    return {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.isActive).length,
      inactive: subscriptions.filter(s => !s.isActive).length,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        table: s.table,
        isActive: s.isActive,
        reconnectAttempts: s.reconnectAttempts,
        lastActivity: new Date(s.lastActivity)
      }))
    }
  }

  public destroy(): void {
    this.pauseHealthMonitoring()

    this.subscriptions.forEach((subscription) => {
      if (subscription.reconnectTimeout) {
        clearTimeout(subscription.reconnectTimeout)
      }
      if (subscription.channel) {
        subscription.channel.unsubscribe()
      }
    })

    this.subscriptions.clear()

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.boundHandleOnline)
      window.removeEventListener('offline', this.boundHandleOffline)
      document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange)
    }
  }
}

export const realtimeManager = RealtimeManager.getInstance()

export const subscribeToTable = (
  id: string,
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  filter?: string
) => realtimeManager.subscribe(id, table, callback, filter)

export const unsubscribeFromTable = (id: string) => realtimeManager.unsubscribe(id)
export const reconnectAllSubscriptions = () => realtimeManager.reconnectAll()
export const getRealtimeStatus = () => realtimeManager.getSubscriptionStatus()
