"use client"

import { X, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface LocationNotificationProps {
  searchedLocation: string
  resultCount: number
  onDismiss: () => void
}

export default function LocationBasedNotification({
  searchedLocation,
  resultCount,
  onDismiss,
}: LocationNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (searchedLocation && resultCount > 0) {
      setIsVisible(true)
    }
  }, [searchedLocation, resultCount])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
  }

  if (!isVisible || resultCount === 0 || !searchedLocation) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 via-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-xl p-4 md:p-5 mb-6 flex items-start gap-3 shadow-md hover:shadow-lg transition-all animate-in slide-in-from-top-2 duration-300 border border-blue-100">
      <div className="flex-shrink-0 mt-0.5">
        <AlertCircle className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base font-semibold text-blue-900 text-balance">
          Showing results of candidates living near{" "}
          <span className="font-bold text-blue-700 break-words">{searchedLocation}</span>
        </p>
        <p className="text-xs md:text-sm text-blue-700 mt-2 font-medium">
          {resultCount} qualified professional{resultCount !== 1 ? "s" : ""} found
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors p-1.5 hover:bg-blue-100 rounded-lg"
        aria-label="Dismiss notification"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
