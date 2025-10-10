"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, MessageCircle } from "lucide-react"

export default function WhatsAppChannelPopup() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleJoinChannel = () => {
    // Open WhatsApp channel
    window.open("https://whatsapp.com/channel/0029VbBEcM0CBtxHDTZq1h0p", "_blank")
    setIsOpen(false)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-sm mx-auto border-2 border-green-200 p-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Join Our Channel
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="relative rounded-lg overflow-hidden">
            <img
              src="/images/whatsappchannelpop.jpg"
              alt="DataFlex Ghana WhatsApp Channel"
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 to-transparent"></div>
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Stay Updated!</h3>
            <p className="text-gray-600 text-sm">Get latest updates and opportunities</p>

            <div className="space-y-2">
              <Button
                onClick={handleJoinChannel}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-sm py-3"
                size="sm"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Join WhatsApp Channel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
