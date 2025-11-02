/**
 * Search Tips Notification - Enhanced Google-style slide-up notification
 * Helps users understand multi-keyword search capabilities
 */
"use client"
import { useState, useEffect } from "react"
import { X, Lightbulb, ChevronDown, ChevronUp } from "lucide-react"

export default function SearchTipsNotification() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

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
              {/* Multi-Keyword Search */}
              <div className="bg-white/70 rounded-lg p-3 border border-blue-200">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Multi-Keyword Search</h4>
                <ul className="text-xs text-blue-800 space-y-1.5">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">→</span>
                    <span>
                      <strong>Combine keywords:</strong> "Marketing Manager, Accra" (job title + location)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">→</span>
                    <span>
                      <strong>Search skills:</strong> "Python, Lagos" (technical skill + location)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">→</span>
                    <span>
                      <strong>Education focus:</strong> "Bachelor, Finance" (qualification + field)
                    </span>
                  </li>
                </ul>
              </div>

              {/* Simple Search */}
              <div className="bg-white/70 rounded-lg p-3 border border-blue-200">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">🔍 Simple Search</h4>
                <ul className="text-xs text-blue-800 space-y-1.5">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">→</span>
                    <span>
                      <strong>Job title:</strong> "Software Developer", "Nurse", "Chef"
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">→</span>
                    <span>
                      <strong>Location:</strong> "Accra", "Kumasi", "Tema", "Madina"
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">→</span>
                    <span>
                      <strong>Skills:</strong> "Excel", "Sales", "Project Management"
                    </span>
                  </li>
                </ul>
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3 border border-blue-300">
                <p className="text-xs text-blue-900">
                  <strong>💪 Pro Tip:</strong> Comma-separated searches find candidates matching ALL keywords (more precise). Space-separated searches find candidates matching ANY keyword (broader results).
                </p>
              </div>
            </div>
          </div>

          {/* Collapse/Expand Toggle - Always below Pro Tip */}
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
