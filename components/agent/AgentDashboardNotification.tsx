"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"

type Frequency = "once_per_day" | "once_per_session" | "always"

interface AgentNotification {
  id: string
  title: string
  message: string
  frequency: Frequency
}

interface Dismissal {
  notification_id: string
  dismissed_at: string
}

interface Props {
  agentId?: string
}

function shouldShowNotification(
  notification: AgentNotification,
  dismissals: Dismissal[],
  agentId: string,
): boolean {
  const dismissal = dismissals.find((d) => d.notification_id === notification.id)
  if (!dismissal) return true

  if (notification.frequency === "always") return true

  const dismissedAt = new Date(dismissal.dismissed_at)

  if (notification.frequency === "once_per_day") {
    return dismissedAt.toDateString() !== new Date().toDateString()
  }

  if (notification.frequency === "once_per_session") {
    const key = `notif_dismissed_session_${agentId}_${notification.id}`
    return sessionStorage.getItem(key) !== "1"
  }

  return true
}

export default function AgentDashboardNotification({ agentId }: Props) {
  const [notification, setNotification] = useState<AgentNotification | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!agentId) return

    try {
      const res = await fetch(`/api/agent/notifications?agentId=${agentId}`, {
        headers: getAgentAuthHeaders(),
      })
      if (!res.ok) return

      const data = await res.json()
      const list: AgentNotification[] = data.notifications || []
      const dismissals: Dismissal[] = data.dismissals || []

      const next = list.find((n) => shouldShowNotification(n, dismissals, agentId))
      if (next) {
        setNotification(next)
        setTimeout(() => setIsVisible(true), 2000)
      }
    } catch (err) {
      console.error("Failed to load agent notifications:", err)
    }
  }, [agentId])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleDismiss = async () => {
    if (!notification || !agentId) {
      setIsVisible(false)
      return
    }

    if (notification.frequency === "once_per_session") {
      sessionStorage.setItem(`notif_dismissed_session_${agentId}_${notification.id}`, "1")
    }

    setIsVisible(false)

    try {
      await fetch("/api/agent/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ notification_id: notification.id, agentId }),
      })
    } catch (err) {
      console.error("Failed to dismiss notification:", err)
    }
  }

  if (!notification) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-2xl">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-800">{notification.title}</h3>
              </div>
              <p className="text-sm text-gray-700 max-w-2xl whitespace-pre-wrap">{notification.message}</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1 sm:flex-none border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
              >
                Dismiss
              </Button>
              <Button
                onClick={handleDismiss}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
              >
                Got it
              </Button>
            </div>

            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 hover:bg-blue-100 rounded-lg transition-colors"
              type="button"
            >
              <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
