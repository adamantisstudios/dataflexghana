"use client"

import { useState, useEffect } from "react"
import { X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function WhatsAppChannelPopup() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 5000) // Show after 5 seconds

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden animate-in zoom-in-95">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="bg-green-600 text-white p-6 text-center">
            <h3 className="text-xl font-bold">Join Our WhatsApp Channel</h3>
          </div>
        </div>

        <div className="p-6 text-center">
          <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
            <Image src="/assets/whatsapp-channel.jpg" alt="WhatsApp Channel" fill className="object-cover" />
          </div>
          <p className="text-gray-600 mb-6">Get amazing discounted rates and stay updated with our latest offers!</p>
          <a href="https://whatsapp.com/channel/0029VbA1ejaJENxwZ6puZs11" target="_blank" rel="noopener noreferrer">
            <Button className="bg-green-600 hover:bg-green-700 w-full">
              <MessageCircle className="mr-2 h-4 w-4" />
              Join Now
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
