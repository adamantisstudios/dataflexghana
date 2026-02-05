"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"

export default function AgentDashboardNotification() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Timer to show notification after 7 seconds
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 7000)

    // Timer to hide notification after 17 seconds total (7s delay + 10s visible)
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, 17000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      {/* Notification Container */}
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-2xl">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Content Section */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-800">Important Updates</h3>
              </div>
              <p className="text-sm text-gray-700 max-w-2xl">
                Check your data orders status, pending wallet top-ups, and commission updates. Stay updated with your
                earnings and account activity.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 sm:flex-none border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
              >
                Dismiss
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
              >
                Got it
              </Button>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
