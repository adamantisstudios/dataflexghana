"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface SearchAdsOverlayProps {
  onClose: () => void
}

export function SearchAdsOverlay({ onClose }: SearchAdsOverlayProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Mobile: slide up from bottom
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pointer-events-none md:hidden">
        <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />

        <div className="relative pointer-events-auto w-full max-w-sm bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 pb-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
            aria-label="Close ad"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Ad image container */}
          <div className="w-full aspect-[9/16] overflow-hidden rounded-t-2xl bg-gray-100">
            <img src="/edited.jpg" alt="DataFlex Advertisement" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    )
  }

  // Desktop: slide in from right sidebar
  return (
    <div className="fixed right-0 top-20 z-50 pointer-events-none hidden md:block">
      <div className="fixed inset-0 bg-black/20 pointer-events-auto" onClick={onClose} />

      <div className="relative pointer-events-auto mr-4 w-80 bg-white rounded-2xl shadow-2xl animate-in slide-in-from-right-4 p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
          aria-label="Close ad"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Ad image container */}
        <div className="w-full aspect-[9/16] overflow-hidden rounded-xl bg-gray-100">
          <img src="/edited.jpg" alt="DataFlex Advertisement" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  )
}
