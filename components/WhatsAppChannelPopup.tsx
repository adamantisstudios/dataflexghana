"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

export default function WhatsAppChannelPopup() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show notification 7 seconds after page load
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 7000)

    // Auto-close after 10 seconds (from when it appears)
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, 17000) // 7000ms delay + 10000ms display time

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const handleJoinChannel = () => {
    // Open WhatsApp channel
    window.open("https://whatsapp.com/channel/0029VbBEcM0CBtxHDTZq1h0p", "_blank")
    setIsVisible(false)
  }

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Notification Container */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 shadow-2xl">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">

              {/* Content Section */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-bold text-green-800">Join Our WhatsApp Channel</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3 max-w-md mx-auto">
                  Get latest updates, opportunities, and exclusive offers delivered directly to you
                </p>
              </div>

              {/* Call to Action Button (moved above the image) */}
              <div className="w-full sm:w-auto">
                <Button
                  onClick={handleJoinChannel}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Join Channel
                </Button>
              </div>

              {/* Image Section (YouTube-style thumbnail) */}
              <div className="w-full sm:w-[400px] h-[225px] rounded-lg overflow-hidden shadow-md">
                <img
                  src="/images/whatsappchannelpop.jpg"
                  alt="DataFlex Ghana WhatsApp Channel"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>

            </div>

            {/* Auto-close indicator */}
            <div className="mt-3 text-center text-xs text-gray-500">
              This notification will close automatically in 10 seconds
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
