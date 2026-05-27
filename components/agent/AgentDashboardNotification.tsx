"use client"

import { useState, useEffect, useCallback } from "react"
import { X } from "lucide-react"
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
      className={`fixed top-14 left-0 right-0 z-40 px-4 pt-2 transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative mx-auto w-full max-w-md rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 transition-colors hover:text-gray-600"
          type="button"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-6">
          <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap break-words">
            {linkifyMessage(notification.message)}
          </p>
        </div>
      </div>
    </div>
  )
}
