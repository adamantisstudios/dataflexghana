"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"

interface WhatsAppChannelPopupProps {
  onClose?: () => void
  controlled?: boolean
  isVisible?: boolean
}

export default function WhatsAppChannelPopup({
  onClose,
  controlled = false,
  isVisible: controlledVisible = false,
}: WhatsAppChannelPopupProps) {
  const [internalVisible, setInternalVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const isVisible = controlled ? controlledVisible : internalVisible

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener("resize", checkDesktop)

    if (controlled) {
      return () => window.removeEventListener("resize", checkDesktop)
    }

    const showTimer = setTimeout(() => setInternalVisible(true), 7000)
    const hideTimer = setTimeout(() => setInternalVisible(false), 17000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      window.removeEventListener("resize", checkDesktop)
    }
  }, [controlled])

  const dismiss = () => {
    if (controlled) {
      onClose?.()
    } else {
      setInternalVisible(false)
      onClose?.()
    }
  }

  const handleJoinChannel = () => {
    if (isDesktop) {
      window.open("https://web.whatsapp.com/send?phone=+233200000000", "_blank")
    } else {
      window.open("https://whatsapp.com/channel/0029VbBEcM0CBtxHDTZq1h0p", "_blank")
    }
    dismiss()
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 shadow-2xl">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-bold text-green-800">Join Our WhatsApp Channel</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3 ml-7">
                Get latest updates, opportunities, and exclusive offers delivered directly to you
              </p>
              <div className="ml-7 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <Button
                  onClick={handleJoinChannel}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {isDesktop ? "Join on WhatsApp Web" : "Join Channel"}
                </Button>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {!controlled && (
            <div className="mt-3 text-center text-xs text-gray-500">
              This notification will close automatically in 10 seconds
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
