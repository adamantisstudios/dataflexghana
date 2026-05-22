"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { linkifyMessage } from "@/lib/linkify-message"

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
      <div className="bg-slate-100/95 border-b border-slate-200 shadow-lg backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:py-5 max-w-4xl">
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-md p-4 sm:p-5">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              type="button"
              aria-label="Dismiss notification"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3 pr-10">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">{notification.title}</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                  {linkifyMessage(notification.message)}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-700"
                  >
                    Dismiss
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
