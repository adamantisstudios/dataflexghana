import { enhancedSupabase } from './supabase-enhanced'
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
  private readonly RECONNECT_INTERVAL = 30000 // 30 seconds
  private readonly HEALTH_CHECK_INTERVAL = 60000 // 1 minute
  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private isReconnecting: boolean = false

  private constructor() {
    this.startHealthMonitoring()
    this.setupConnectionHandlers()
  }

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  /**
   * Subscribe to real-time changes on a table
   */
  public subscribe(
    id: string,
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    filter?: string
  ): () => void {
    console.log(`🔄 Setting up real-time subscription for ${table} (${id})`)

    // Remove existing subscription if it exists
    this.unsubscribe(id)

    const subscription: RealtimeSubscription = {
      id,
      table,
      channel: null,
      callback: (payload) => {
        try {
          console.log(`📨 Real-time update received for ${table}:`, payload)
          subscription.lastActivity = Date.now()
          callback(payload)
        } catch (error) {
          console.error(`❌ Error in callback for ${table}:`, error)
        }
      },
      filter,
      isActive: false,
      lastActivity: Date.now(),
      reconnectAttempts: 0
    }

    this.subscriptions.set(id, subscription)
    this.createChannel(subscription)

    // Return unsubscribe function
    return () => this.unsubscribe(id)
  }

  /**
   * Create a real-time channel for a subscription
   */
  private async createChannel(subscription: RealtimeSubscription): Promise<void> {
    try {
      // Ensure session is valid before creating channel
      const sessionValid = await sessionManager.checkAndRefreshIfNeeded()
      if (!sessionValid) {
        console.warn(`⚠️ Cannot create channel for ${subscription.table}: invalid session`)
        this.scheduleReconnect(subscription)
        return
      }

      const channelName = `${subscription.table}_${subscription.id}_${Date.now()}`
      console.log(`🔗 Creating channel: ${channelName}`)
      
      const channel = enhancedSupabase.channel(channelName)

      // Configure the channel based on filter
      let channelConfig = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: subscription.table,
          ...(subscription.filter && { filter: subscription.filter })
        },
        subscription.callback
      )

      // Set up channel event handlers with better error handling
      channelConfig.subscribe((status, err) => {
        console.log(`📡 Channel ${channelName} status:`, status)

        if (status === 'SUBSCRIBED') {
          subscription.isActive = true
          subscription.reconnectAttempts = 0
          console.log(`✅ Successfully subscribed to ${subscription.table} changes`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Channel error for ${subscription.table}:`, err || 'Unknown channel error')
          subscription.isActive = false
          // Don't immediately reconnect on channel errors, wait a bit
          setTimeout(() => this.scheduleReconnect(subscription), 2000)
        } else if (status === 'TIMED_OUT') {
          console.error(`⏰ Channel timeout for ${subscription.table}:`, err || 'Connection timed out')
          subscription.isActive = false
          this.scheduleReconnect(subscription)
        } else if (status === 'CLOSED') {
          console.log(`🔒 Channel closed for ${subscription.table}`)
          subscription.isActive = false
          // Only reconnect if this wasn't an intentional close
          if (this.subscriptions.has(subscription.id)) {
            setTimeout(() => this.scheduleReconnect(subscription), 1000)
          }
        }
      })

      subscription.channel = channel
      this.subscriptions.set(subscription.id, subscription)

    } catch (error) {
      console.error(`💥 Error creating channel for ${subscription.table}:`, error)
      // Provide more specific error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Channel creation failed: ${errorMessage}`)
      this.scheduleReconnect(subscription)
    }
  }

  /**
   * Schedule reconnection for a failed subscription
   */
  private scheduleReconnect(subscription: RealtimeSubscription): void {
    if (subscription.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.warn(`Max reconnect attempts reached for ${subscription.table}. Will retry after longer delay.`)
      // Instead of giving up, schedule a longer delay and reset attempts
      setTimeout(() => {
        subscription.reconnectAttempts = 0
        this.reconnectSubscription(subscription)
      }, 30000) // 30 second delay before resetting
      return
    }

    const delay = Math.min(1000 * Math.pow(2, subscription.reconnectAttempts), 30000) // Exponential backoff, max 30s
    subscription.reconnectAttempts++
    
    console.log(`Scheduling reconnect for ${subscription.table} in ${delay}ms (attempt ${subscription.reconnectAttempts})`)
    
    subscription.reconnectTimeout = setTimeout(() => {
      this.reconnectSubscription(subscription)
    }, delay)
  }

  /**
   * Reconnect a specific subscription
   */
  private async reconnectSubscription(subscription: RealtimeSubscription): Promise<void> {
    try {
      // Clean up existing channel
      if (subscription.channel) {
        await subscription.channel.unsubscribe()
        subscription.channel = null
      }

      subscription.isActive = false
      await this.createChannel(subscription)
    } catch (error) {
      console.error(`Error reconnecting ${subscription.table}:`, error)
      this.scheduleReconnect(subscription)
    }
  }

  /**
   * Unsubscribe from a real-time subscription
   */
  public async unsubscribe(id: string): Promise<void> {
    const subscription = this.subscriptions.get(id)
    if (!subscription) return

    console.log(`Unsubscribing from ${subscription.table} (${id})`)

    try {
      if (subscription.channel) {
        await subscription.channel.unsubscribe()
      }
    } catch (error) {
      console.error(`Error unsubscribing from ${subscription.table}:`, error)
    }

    this.subscriptions.delete(id)
  }

  /**
   * Reconnect all active subscriptions
   */
  public async reconnectAll(): Promise<void> {
    if (this.isReconnecting) {
      console.log('Reconnection already in progress')
      return
    }

    this.isReconnecting = true
    console.log('Reconnecting all real-time subscriptions...')

    try {
      // Ensure session is valid first
      const sessionValid = await sessionManager.checkAndRefreshIfNeeded()
      if (!sessionValid) {
        console.warn('Cannot reconnect subscriptions: invalid session')
        return
      }

      const reconnectPromises = Array.from(this.subscriptions.values()).map(async (subscription) => {
        if (!subscription.isActive) {
          await this.reconnectSubscription(subscription)
        }
      })

      await Promise.all(reconnectPromises)
      console.log('All subscriptions reconnected')
    } catch (error) {
      console.error('Error reconnecting subscriptions:', error)
    } finally {
      this.isReconnecting = false
    }
  }

  /**
   * Start health monitoring for subscriptions
   */
  private startHealthMonitoring(): void {
    if (typeof window === 'undefined') return

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.HEALTH_CHECK_INTERVAL)

    this.reconnectInterval = setInterval(() => {
      this.checkForStaleSubscriptions()
    }, this.RECONNECT_INTERVAL)
  }

  /**
   * Perform health check on all subscriptions
   */
  private performHealthCheck(): void {
    const now = Date.now()
    let inactiveCount = 0

    this.subscriptions.forEach((subscription) => {
      if (!subscription.isActive) {
        inactiveCount++
      }

      // Check for stale subscriptions (no activity for 5 minutes)
      const timeSinceActivity = now - subscription.lastActivity
      if (timeSinceActivity > 300000 && subscription.isActive) {
        console.warn(`Subscription ${subscription.table} appears stale, reconnecting...`)
        this.reconnectSubscription(subscription)
      }
    })

    if (inactiveCount > 0) {
      console.log(`Health check: ${inactiveCount} inactive subscriptions detected`)
    }
  }

  /**
   * Check for stale subscriptions and attempt reconnection
   */
  private checkForStaleSubscriptions(): void {
    this.subscriptions.forEach((subscription) => {
      if (!subscription.isActive && subscription.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        console.log(`Attempting to reconnect stale subscription: ${subscription.table}`)
        this.reconnectSubscription(subscription)
      }
    })
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (typeof window === 'undefined') return

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('Network connection restored, reconnecting subscriptions...')
      setTimeout(() => this.reconnectAll(), 1000)
    })

    window.addEventListener('offline', () => {
      console.log('Network connection lost')
      this.subscriptions.forEach((subscription) => {
        subscription.isActive = false
      })
    })

    // Handle visibility change (tab focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('Tab became visible, checking subscription health...')
        setTimeout(() => this.performHealthCheck(), 2000)
      }
    })
  }

  /**
   * Get subscription status
   */
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

  /**
   * Clean up all subscriptions and intervals
   */
  public destroy(): void {
    console.log('Destroying realtime manager...')

    // Unsubscribe from all channels
    this.subscriptions.forEach((subscription) => {
      if (subscription.channel) {
        subscription.channel.unsubscribe()
      }
    })

    this.subscriptions.clear()

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }

    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.reconnectAll)
      window.removeEventListener('offline', () => {})
      document.removeEventListener('visibilitychange', this.performHealthCheck)
    }
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance()

// Utility functions for easy access
export const subscribeToTable = (
  id: string,
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  filter?: string
) => realtimeManager.subscribe(id, table, callback, filter)

export const unsubscribeFromTable = (id: string) => realtimeManager.unsubscribe(id)
export const reconnectAllSubscriptions = () => realtimeManager.reconnectAll()
export const getRealtimeStatus = () => realtimeManager.getSubscriptionStatus()
