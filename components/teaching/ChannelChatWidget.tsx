"use client"
import { useState, useEffect } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export function ChannelChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(
      () => {
        setIsVisible((prev) => !prev)
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    try {
      setIsSending(true)

      const phoneNumber = "233246827049"
      const formattedMessage = `📚 *EDUCATIONAL CONTENT REQUEST*\n\n${message}\n\nPlease contact me with more information about purchasing formatted past questions, notes, and PDF books from teachers.`
      const encodedMessage = encodeURIComponent(formattedMessage)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

      // Open WhatsApp in a new window
      window.open(whatsappUrl, "_blank")

      toast.success("Opening WhatsApp to send your message!")
      setMessage("")
      setIsExpanded(false)
      setTimeout(() => setIsOpen(false), 2000)
    } catch (error) {
      console.error("[v0] Error opening WhatsApp:", error)
      toast.error("Failed to open WhatsApp. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* Chat Widget Button */}
      <div className="fixed bottom-6 left-4 z-40 sm:left-6">
        {!isOpen ? (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-12 w-12 rounded-full bg-green-500 text-white shadow-md transition-all hover:bg-green-600 hover:shadow-lg"
            title="Chat with admin about educational content"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-green-600 to-green-500 p-4 text-white">
              <div>
                <h3 className="font-semibold text-sm">Educational Content</h3>
                <p className="text-xs text-blue-100">Buy formatted notes & books</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 p-0 text-white hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              {!isExpanded ? (
                <>
                  <p className="text-xs text-gray-700">
                    📚 Looking for well-formatted past questions, study notes, or PDF books from experienced teachers?
                  </p>
                  <p className="text-xs text-gray-600">
                    We can connect you with quality educational resources. Click below to request more information.
                  </p>
                  <Button onClick={() => setIsExpanded(true)} className="h-11 w-full bg-green-500 text-sm text-white hover:bg-green-600">
                    Request Now
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-700 font-medium">What are you interested in?</p>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., Past questions for WAEC Math..."
                    className="h-11 text-sm text-gray-900"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    <Button onClick={() => setIsExpanded(false)} variant="outline" className="h-11 flex-1 text-sm text-gray-900">
                      Back
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !message.trim()}
                      className="h-11 flex-1 bg-green-500 text-sm text-white hover:bg-green-600"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {isSending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
