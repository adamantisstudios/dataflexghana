"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, Wifi, WifiOff, Database, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CriticalStatusNotificationProps {
  connectionHealth: {
    overall: 'healthy' | 'degraded' | 'unhealthy'
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
  }
  onDismiss?: () => void
}

export function CriticalStatusNotification({ 
  connectionHealth, 
  onDismiss 
}: CriticalStatusNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Only show for critical issues (unhealthy status)
  const shouldShow = connectionHealth.overall === 'unhealthy' && !isDismissed

  useEffect(() => {
    if (shouldShow) {
      // Slide in after a brief delay
      const timer = setTimeout(() => setIsVisible(true), 300)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [shouldShow])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    setTimeout(() => {
      onDismiss?.()
    }, 300)
  }

  // Reset dismissed state when connection becomes healthy
  useEffect(() => {
    if (connectionHealth.overall === 'healthy') {
      setIsDismissed(false)
    }
  }, [connectionHealth.overall])

  if (!shouldShow) return null

  const getIssueDetails = () => {
    const issues = []
    if (!connectionHealth.details.network) issues.push({ icon: WifiOff, text: "Network offline" })
    if (!connectionHealth.details.database) issues.push({ icon: Database, text: "Database disconnected" })
    if (!connectionHealth.details.session) issues.push({ icon: Shield, text: "Session expired" })
    if (!connectionHealth.details.realtime.healthy) {
      issues.push({ 
        icon: Wifi, 
        text: `Realtime issues (${connectionHealth.details.realtime.active}/${connectionHealth.details.realtime.total})` 
      })
    }
    return issues
  }

  const issues = getIssueDetails()

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[9999] w-80 max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-full opacity-0 scale-95"
      )}
    >
      <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  Critical Connection Issues
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 hover:bg-red-100" 
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1 mb-3">
                {issues.map((issue, index) => {
                  const Icon = issue.icon
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <Icon className="h-3 w-3 text-red-500" />
                      <span>{issue.text}</span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="h-7 text-xs bg-transparent hover:bg-red-50"
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
