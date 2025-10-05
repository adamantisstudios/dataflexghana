"use client"

import { useState, useEffect } from "react"
import { X, Clock, Wallet, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoginNotificationProps {
  isVisible: boolean
  onClose: () => void
}

export default function LoginNotification({ isVisible, onClose }: LoginNotificationProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Notification Container */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center px-4 pb-4 sm:pb-6">
        <div
          className={`
            relative w-full max-w-md bg-gradient-to-r from-blue-600 to-indigo-700 
            text-white rounded-2xl shadow-2xl border border-blue-500/20 
            pointer-events-auto transform transition-all duration-500 ease-out
            ${isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-full opacity-0 scale-95'
            }
          `}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Content */}
          <div className="p-6 pr-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Welcome Back!
                </h3>
                <p className="text-blue-100 text-sm">
                  Important processing info
                </p>
              </div>
            </div>

            {/* Main Message */}
            <div className="space-y-3 mb-5">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm mb-1">
                      Processing Time
                    </p>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Data orders take <strong>5 minutes to 1 hour</strong> to process (sometimes faster).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm mb-1">
                      Stay Updated
                    </p>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Check your dashboard for updates on order status.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-start gap-3">
                  <Wallet className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm mb-1">
                      Faster Processing
                    </p>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Top up your wallet for faster processing and reduced fees.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={onClose}
              className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg"
            >
              Got it, thanks!
            </Button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-8 -translate-x-8" />
        </div>
      </div>
    </div>
  )
}
