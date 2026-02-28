"use client"
import { useState } from "react"
import { X, Bell, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DomesticWorkerNotificationProps {
  isOpen: boolean
  onClose: () => void
  type?: "request" | "match" | "update" | "alert"
  title: string
  message: string
  workerName?: string
  clientName?: string
  actionLabel?: string
  actionUrl?: string
  onAction?: () => void
}

const notificationIcons = {
  request: <Bell className="h-5 w-5 text-blue-600" />,
  match: <CheckCircle className="h-5 w-5 text-green-600" />,
  update: <Clock className="h-5 w-5 text-amber-600" />,
  alert: <AlertCircle className="h-5 w-5 text-red-600" />,
}

const notificationColors = {
  request: "bg-blue-50 border-blue-200",
  match: "bg-green-50 border-green-200",
  update: "bg-amber-50 border-amber-200",
  alert: "bg-red-50 border-red-200",
}

export function DomesticWorkerNotification({
  isOpen,
  onClose,
  type = "request",
  title,
  message,
  workerName,
  clientName,
  actionLabel,
  actionUrl,
  onAction,
}: DomesticWorkerNotificationProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  const handleClose = () => {
    setIsAnimatingOut(true)
    setTimeout(() => {
      onClose()
      setIsAnimatingOut(false)
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
        isAnimatingOut ? "translate-y-full" : "translate-y-0",
      )}
    >
      <div className="bg-black/20 backdrop-blur-sm absolute inset-0" onClick={handleClose} />

      <div className={cn("relative m-4 rounded-lg border shadow-lg", notificationColors[type])}>
        <div className="p-4 sm:p-6 space-y-3">
          {/* Header with icon and close button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-0.5">{notificationIcons[type]}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-700 mt-1 leading-relaxed">{message}</p>

                {(workerName || clientName) && (
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    {workerName && <p>Worker: {workerName}</p>}
                    {clientName && <p>Client: {clientName}</p>}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Action button if provided */}
          {(actionLabel || onAction) && (
            <div className="flex gap-2 pt-2 border-t border-current border-opacity-10">
              <Button
                onClick={() => {
                  if (onAction) {
                    onAction()
                  } else if (actionUrl) {
                    window.location.href = actionUrl
                  }
                  handleClose()
                }}
                className={cn("flex-1 text-xs sm:text-sm h-8 sm:h-9", {
                  "bg-blue-600 hover:bg-blue-700": type === "request",
                  "bg-green-600 hover:bg-green-700": type === "match",
                  "bg-amber-600 hover:bg-amber-700": type === "update",
                  "bg-red-600 hover:bg-red-700": type === "alert",
                })}
              >
                {actionLabel || "View Details"}
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9 bg-transparent"
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
