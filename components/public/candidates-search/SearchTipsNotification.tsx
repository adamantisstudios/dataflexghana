/**
 * Search Tips Notification - Enhanced Google-style slide-up notification
 * Persists visibility state and auto-hides after 5 seconds of inactivity
 */
"use client"
import { useState, useEffect, useRef } from "react"
import { X, Lightbulb, ChevronDown, ChevronUp } from "lucide-react"

export default function SearchTipsNotification() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const hasShownTips = localStorage.getItem("searchTipsShown")
    if (!hasShownTips) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        localStorage.setItem("searchTipsShown", "true")
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current)

      inactivityTimerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
    }

    const handleMouseMove = () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current)
      moveTimerRef.current = setTimeout(() => {
        resetInactivityTimer()
      }, 100)
    }

    const handleScroll = () => {
      resetInactivityTimer()
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("scroll", handleScroll)
    resetInactivityTimer()

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("scroll", handleScroll)
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-lg z-50">
      {/* Slide-up animation container */}
      <div
        className={`transition-all duration-500 ease-out origin-bottom ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 flex-shrink-0" />
              <h3 className="font-semibold text-sm">Search Tips & Tricks</h3>
            </div>
            <button
              className="p-1 hover:bg-white/20 rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setIsVisible(false)
              }}
              aria-label="Close tips"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Expandable Content */}
          <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[500px]" : "max-h-0"}`}>
            <div className="px-4 py-4 space-y-3">
              {/* Combined Search */}
              <div className="bg-white/70 rounded-lg p-3 border border-blue-200">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">Combined Search</h4>
                <ul className="text-xs text-blue-800 space-y-1.5">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>
                      <strong>Job title + location:</strong> "Marketing Manager, Accra"
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>
                      <strong>Technical skills:</strong> "Python, Lagos" or "React Developer"
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>
                      <strong>Education + field:</strong> "Bachelor, Finance" or "MBA"
                    </span>
                  </li>
                </ul>
              </div>

              {/* Single Keyword Search */}
              <div className="bg-white/70 rounded-lg p-3 border border-blue-200">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">Single Keyword Search</h4>
                <ul className="text-xs text-blue-800 space-y-1.5">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>Job titles: "Developer", "Designer", "Manager"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>Locations: "Accra", "Kumasi", "Tema", "Takoradi"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>Skills: "Excel", "Project Management", "Sales"</span>
                  </li>
                </ul>
              </div>

              {/* Pro Tip */}
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3 border border-blue-300">
                <p className="text-xs text-blue-900 leading-relaxed">
                  <strong>Pro Tip:</strong> Use comma-separated terms for precise matches, or space-separated for
                  broader results.
                </p>
              </div>
            </div>
          </div>

          {/* Collapse/Expand Toggle */}
          <div className="bg-blue-50 px-4 py-2 border-t border-blue-200 flex justify-center mt-auto">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide Tips
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show Tips
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
