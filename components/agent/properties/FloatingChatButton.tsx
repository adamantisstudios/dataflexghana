"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send } from "lucide-react"
import type { Agent } from "@/lib/supabase"

interface FloatingChatButtonProps {
  agent: Agent
}

export default function FloatingChatButton({ agent }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState("Submit Your Property")

  useEffect(() => {
    const messages = [
      "Submit Your Property",
      "List Your Property Now!",
      "Earn More Commissions",
      "Add Your Listing",
      "Submit Your Property",
    ]

    let messageIndex = 0

    const animationCycle = () => {
      setShowMessage(true)
      setMessageText(messages[messageIndex])

      setTimeout(() => {
        setShowMessage(false)
      }, 3000) // Show message for 3 seconds

      messageIndex = (messageIndex + 1) % messages.length
    }

    // Start immediately
    animationCycle()

    // Then repeat every 8 seconds (3s visible + 5s hidden)
    const interval = setInterval(animationCycle, 8000)

    return () => clearInterval(interval)
  }, [])

  const handleSendRequest = () => {
    if (!description.trim()) return

    const whatsappNumber = "+233242799990"
    const message = `Hello Admin, I'd like to request posting a property.

Agent: ${agent.full_name}
Contact: ${agent.phone_number}
Property: ${description.trim()}`

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")

    setDescription("")
    setIsOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="fixed bottom-6 left-6 z-50">
            {showMessage && (
              <div className="absolute bottom-16 left-0 mb-2 animate-bounce">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap relative">
                  {messageText}
                  {/* Speech bubble arrow */}
                  <div className="absolute -bottom-1 left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-emerald-500"></div>
                </div>
              </div>
            )}

            <Button
              className={`rounded-full w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 ${
                showMessage ? "animate-pulse scale-110" : ""
              }`}
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Property Posting</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800 font-medium mb-2">📋 How to Submit Properties via WhatsApp:</p>
              <ul className="text-xs text-emerald-700 space-y-1">
                <li>• Include property location, type, and price</li>
                <li>• Add photos if available</li>
                <li>• Mention your contact details</li>
                <li>• Properties near you get approved faster!</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600">Describe the property you'd like to request for posting:</p>

            <Textarea
              placeholder="Example: 2 bedroom apartment at Adenta, ₵150,000, furnished, near main road. I can provide photos and owner contact."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSendRequest}
                disabled={!description.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
