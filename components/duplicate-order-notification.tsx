// Beautiful duplicate order detection notification component
// Fits seamlessly with the app design and shows cooldown timer

"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface DuplicateOrderNotificationProps {
  bundleName: string
  recipientPhone: string
  minutesUntilAllowed: number
  onClose: () => void
  onDismiss: () => void
}

export function DuplicateOrderNotification({
  bundleName,
  recipientPhone,
  minutesUntilAllowed,
  onClose,
  onDismiss,
}: DuplicateOrderNotificationProps) {
  const [remainingTime, setRemainingTime] = useState(minutesUntilAllowed)

  useEffect(() => {
    if (remainingTime <= 0) {
      onDismiss()
      return
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [remainingTime, onDismiss])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-2xl animate-in zoom-in-95 duration-300">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Duplicate Order Detected</h3>
                <p className="text-amber-100 text-sm">Same order recently placed</p>
              </div>
            </div>
            <Button
              onClick={() => {
                onClose()
                onDismiss()
              }}
              className="text-white/80 hover:text-white transition-colors h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Order Details */}
            <div className="bg-white rounded-lg p-4 border border-amber-200 space-y-3">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">DATA BUNDLE</p>
                <p className="text-sm font-semibold text-gray-900">{bundleName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">RECIPIENT NUMBER</p>
                <p className="text-sm font-mono font-semibold text-gray-900">{recipientPhone}</p>
              </div>
            </div>

            {/* Cooldown Timer */}
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-4 border border-amber-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <p className="font-medium text-amber-900">Wait Before Reordering</p>
              </div>
              <div className="ml-11">
                <p className="text-2xl font-bold text-amber-600 mb-1">
                  {remainingTime} {remainingTime === 1 ? "minute" : "minutes"}
                </p>
                <p className="text-xs text-amber-800">
                  To prevent accidental duplicate orders, please wait before placing the same order again.
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <p className="text-xs text-orange-800 leading-relaxed">
                <strong>Why this protection?</strong> This safeguard prevents accidental duplicate orders and system
                abuse. If you intentionally need multiple bundles, place the order after the waiting period.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-amber-200 flex gap-2">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 h-auto"
            >
              Got it
            </Button>
            <Button
              onClick={() => {
                onClose()
                onDismiss()
              }}
              variant="outline"
              className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium py-2 h-auto"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
