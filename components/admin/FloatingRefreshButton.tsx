"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { connectionManager, type ConnectionStatus } from '@/lib/connection-manager'
import { realtimeManager } from '@/lib/realtime-manager'
import { sessionManager } from '@/lib/session-manager'
import { cn } from '@/lib/utils'

interface FloatingRefreshButtonProps {
  onRefresh?: () => Promise<void> | void
  className?: string
  showConnectionStatus?: boolean
}

export function FloatingRefreshButton({
  onRefresh,
  className,
  showConnectionStatus = true
}: FloatingRefreshButtonProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    connectionManager.getConnectionStatus()
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [healthStatus, setHealthStatus] = useState(connectionManager.getHealthStatus())

  useEffect(() => {
    const unsubscribe = connectionManager.addConnectionListener((status) => {
      setConnectionStatus(status)
      setHealthStatus(connectionManager.getHealthStatus())
    })
    return unsubscribe
  }, [])

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    setShowSuccess(false)

    try {
      console.log('Starting comprehensive refresh...')

      // Step 1: Force session refresh
      console.log('Refreshing session...')
      await sessionManager.refreshSession()

      // Step 2: Force connection reconnect
      console.log('Reconnecting database...')
      await connectionManager.forceReconnect()

      // Step 3: Reconnect all realtime subscriptions
      console.log('Reconnecting realtime subscriptions...')
      await realtimeManager.reconnectAll()

      // Step 4: Call custom refresh function if provided
      if (onRefresh) {
        console.log('Executing custom refresh...')
        await onRefresh()
      }

      setShowSuccess(true)

      // Update health status
      setHealthStatus(connectionManager.getHealthStatus())

      console.log('Comprehensive refresh completed successfully')

      // Hide success indicator after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Comprehensive refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getConnectionColor = () => {
    if (showSuccess) {
      return 'bg-green-500 hover:bg-green-600'
    }

    switch (healthStatus.overall) {
      case 'healthy':
        return 'bg-green-500 hover:bg-green-600'
      case 'degraded':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'unhealthy':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getButtonText = () => {
    if (showSuccess) return 'Refreshed!'
    if (isRefreshing) return 'Refreshing...'
    return 'Refresh All'
  }

  const getButtonIcon = () => {
    if (showSuccess) {
      return <CheckCircle2 className="h-5 w-5" />
    }
    return (
      <RefreshCw
        className={cn(
          "h-5 w-5",
          isRefreshing && "animate-spin"
        )}
      />
    )
  }

  return (
    <div className={cn(
      "fixed bottom-6 left-6 z-40",
      className
    )}>
      {/* Simple Refresh Button */}
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing}
        size="lg"
        className={cn(
          "rounded-full shadow-lg transition-all duration-200 hover:scale-105",
          getConnectionColor(),
          "text-white border-0"
        )}
        title="Complete system refresh - reconnects database, session, and realtime"
      >
        {getButtonIcon()}
        <span className="ml-2 hidden sm:inline">
          {getButtonText()}
        </span>
      </Button>
    </div>
  )
}

// Hook for easy integration with enhanced functionality
export function useFloatingRefresh(refreshCallback?: () => Promise<void> | void) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    connectionManager.getConnectionStatus()
  )
  const [healthStatus, setHealthStatus] = useState(connectionManager.getHealthStatus())

  useEffect(() => {
    const unsubscribe = connectionManager.addConnectionListener((status) => {
      setConnectionStatus(status)
      setHealthStatus(connectionManager.getHealthStatus())
    })
    return unsubscribe
  }, [])

  const refresh = async () => {
    // Comprehensive refresh
    await sessionManager.refreshSession()
    await connectionManager.forceReconnect()
    await realtimeManager.reconnectAll()

    if (refreshCallback) {
      await refreshCallback()
    }
  }

  return {
    connectionStatus,
    healthStatus,
    refresh,
    isConnected: connectionStatus.isConnected,
    isOnline: connectionStatus.isOnline,
    isSessionValid: connectionStatus.isSessionValid,
    reconnectAttempts: connectionStatus.reconnectAttempts,
    realtimeStatus: connectionStatus.realtimeStatus,
    overallHealth: healthStatus.overall
  }
}
