"use client"

import { useState, useEffect } from "react"
import { Bell, X, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NotificationData {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  timestamp: Date
  autoClose?: boolean
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface EnhancedNotificationProps {
  notification: NotificationData
  onDismiss: (id: string) => void
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
}

export function EnhancedNotification({
  notification,
  onDismiss,
  position = "bottom-right",
}: EnhancedNotificationProps) {
  const [progress, setProgress] = useState(100)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (notification.autoClose !== false) {
      const duration = notification.duration || 5000
      const interval = 50
      const decrement = (interval / duration) * 100

      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(progressTimer)
            handleDismiss()
            return 0
          }
          return prev - decrement
        })
      }, interval)

      return () => clearInterval(progressTimer)
    }
  }, [notification.autoClose, notification.duration])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(notification.id), 300)
  }

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "info":
      default:
        return <Bell className="h-5 w-5 text-blue-600" />
    }
  }

  const getColorClasses = () => {
    switch (notification.type) {
      case "success":
        return "border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50"
      case "warning":
        return "border-l-amber-500 bg-gradient-to-r from-amber-50 to-orange-50"
      case "error":
        return "border-l-red-500 bg-gradient-to-r from-red-50 to-pink-50"
      case "info":
      default:
        return "border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50"
    }
  }

  const getProgressColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-amber-500"
      case "error":
        return "bg-red-500"
      case "info":
      default:
        return "bg-blue-500"
    }
  }

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  }

  return (
    <div
      className={cn(
        "fixed z-50 w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out",
        positionClasses[position],
        isVisible
          ? "translate-x-0 opacity-100 scale-100"
          : position.includes("right")
            ? "translate-x-full opacity-0 scale-95"
            : "-translate-x-full opacity-0 scale-95",
      )}
    >
      <Card className={cn("border-l-4 shadow-lg", getColorClasses())}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{notification.title}</h4>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200/50" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">{notification.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {notification.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {notification.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={notification.action.onClick}
                    className="h-7 text-xs bg-transparent"
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
          {notification.autoClose !== false && (
            <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-75 ease-linear", getProgressColor())}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Notification Manager Hook
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const addNotification = (notification: Omit<NotificationData, "id" | "timestamp">) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    }
    setNotifications((prev) => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Convenience methods
  const showSuccess = (title: string, message: string, options?: Partial<NotificationData>) => {
    addNotification({ type: "success", title, message, ...options })
  }

  const showError = (title: string, message: string, options?: Partial<NotificationData>) => {
    addNotification({ type: "error", title, message, autoClose: false, ...options })
  }

  const showWarning = (title: string, message: string, options?: Partial<NotificationData>) => {
    addNotification({ type: "warning", title, message, ...options })
  }

  const showInfo = (title: string, message: string, options?: Partial<NotificationData>) => {
    addNotification({ type: "info", title, message, ...options })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}

// Notification Container Component
interface NotificationContainerProps {
  notifications: NotificationData[]
  onDismiss: (id: string) => void
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  maxNotifications?: number
}

export function NotificationContainer({
  notifications,
  onDismiss,
  position = "bottom-right",
  maxNotifications = 5,
}: NotificationContainerProps) {
  const visibleNotifications = notifications.slice(-maxNotifications)

  return (
    <>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            zIndex: 1000 + index,
            transform: `translateY(${index * -10}px)`,
          }}
        >
          <EnhancedNotification notification={notification} onDismiss={onDismiss} position={position} />
        </div>
      ))}
    </>
  )
}
