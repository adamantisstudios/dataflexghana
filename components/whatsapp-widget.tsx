"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { X, MessageCircle, Send } from "lucide-react"

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState(
    "Hi! I'm interested in learning more about DataFlexAgent and how I can start earning as a data agent. Can you help me get started?",
  )

  const phoneNumber = "+233242799990"

  const sendWhatsAppMessage = () => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
    setIsOpen(false)
  }

  const quickMessages = [
    "I want to become a DataFlexAgent agent",
    "How much can I earn with DataFlexAgent?",
    "What services can I refer clients for?",
    "How do I get approved as an agent?",
    "When do I receive my commissions?",
  ]

  return (
    <>
      {/* WhatsApp Button - Fixed positioning that doesn't affect layout */}
      <div className="fixed bottom-4 left-4 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          {!isOpen && (
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 p-0 border-2 border-white"
              size="sm"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* WhatsApp Chat Widget - Improved positioning */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 bg-black/20 z-50 md:hidden" onClick={() => setIsOpen(false)} />

          {/* Chat Widget */}
          <div className="fixed bottom-4 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto">
            <Card className="shadow-2xl border-0 bg-white">
              <CardHeader className="bg-green-500 text-white rounded-t-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">DataFlex Support</CardTitle>
                      <p className="text-xs text-green-100">We're here to help!</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 mb-1">👋 Hello! How can we help you today?</p>
                  <p className="text-xs text-gray-500">Choose a quick message or type your own:</p>
                </div>

                {/* Quick Message Buttons */}
                <div className="space-y-2">
                  {quickMessages.map((quickMsg, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto py-2 px-2 text-xs leading-tight"
                      onClick={() => setMessage(quickMsg)}
                    >
                      {quickMsg}
                    </Button>
                  ))}
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Your Message:</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={sendWhatsAppMessage}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-sm"
                  disabled={!message.trim()}
                >
                  <Send className="h-3 w-3 mr-2" />
                  Send WhatsApp Message
                </Button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">You'll be redirected to WhatsApp</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
