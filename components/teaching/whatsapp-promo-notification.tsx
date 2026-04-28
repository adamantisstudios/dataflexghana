"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WhatsAppPromoNotificationProps {
  memberId: string
  userType?: "member" | "admin" | "teacher"
}

export function WhatsAppPromoNotification({ memberId, userType = "member" }: WhatsAppPromoNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [dismissTimer, setDismissTimer] = useState<NodeJS.Timeout | null>(null)
  const [visibilityTimer, setVisibilityTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const storageKey = `whatsapp-promo-shown-${memberId}-${userType}`
    const lastShownTime = localStorage.getItem(storageKey)
    const now = Date.now()
    const FIVE_MINUTES = 5 * 60 * 1000

    let shouldShow = false

    if (!lastShownTime) {
      shouldShow = true
    } else {
      const lastShownTimeNum = Number.parseInt(lastShownTime, 10)
      const timeSinceLastShown = now - lastShownTimeNum

      if (timeSinceLastShown >= FIVE_MINUTES) {
        shouldShow = true
      }
    }

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        localStorage.setItem(storageKey, now.toString())

        const autoTimer = setTimeout(() => {
          setIsVisible(false)
        }, 5000)

        setDismissTimer(autoTimer)

        const recurringTimer = setInterval(() => {
          setIsVisible((prev) => !prev)
        }, FIVE_MINUTES)

        setVisibilityTimer(recurringTimer)
      }, 300)

      return () => {
        clearTimeout(timer)
        if (dismissTimer) clearTimeout(dismissTimer)
        if (visibilityTimer) clearInterval(visibilityTimer)
      }
    }
  }, [isMounted, memberId, userType, dismissTimer, visibilityTimer])

  const handleWhatsAppClick = () => {
    const phoneNumber = "233242799990"
    const message = "I want to know more about the educational and platform resources for sale. Where should i start"
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
    setIsVisible(false)
    if (dismissTimer) clearTimeout(dismissTimer)
  }

  const handleClose = () => {
    setIsVisible(false)
    if (dismissTimer) clearTimeout(dismissTimer)
  }

  if (!isMounted) return null

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
            <div className="flex flex-col items-center gap-4 sm:gap-6 text-center relative">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 p-1 hover:bg-green-100 rounded-full transition-colors"
                aria-label="Close notification"
              >
                <X className="h-5 w-5 text-green-600" />
              </button>

              {/* Content Section */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-bold text-green-800">Unlock Premium Resources</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3 max-w-md mx-auto">
                  Get access to exclusive educational materials: past question PDFs, video tutorials, and audio lessons
                </p>
              </div>

              {/* Call to Action Button */}
              <div className="w-full sm:w-auto">
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              </div>

              {/* Image Section */}
              <div className="w-full sm:w-[400px] h-[225px] rounded-lg overflow-hidden shadow-md">
                <img
                  src="/images/whatsappchannelpop.jpg"
                  alt="Educational Resources"
                  className="w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    console.log("[v0] Image failed to load:", e)
                  }}
                />
              </div>
            </div>

            <div className="mt-3 text-center text-xs text-gray-500">
              This notification appears every 5 minutes and closes automatically
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
