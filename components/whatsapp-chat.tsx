"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateWhatsAppLink } from "@/utils/whatsapp"

const faqQuestions = [
  "Do you work on Sundays?",
  "How long must I wait for data to be allocated?",
  "What type of sim cards are not supported?",
  "Can I cancel my order after placing it?",
  "Do you offer discounts for bulk purchases?",
]

export function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false)

  const handleQuestionClick = (question: string) => {
    const whatsappUrl = generateWhatsAppLink(question)
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Popup */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-white rounded-lg shadow-xl border overflow-hidden mb-4 animate-in slide-in-from-bottom-2">
          <div className="bg-green-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold">DataFlex Support</h3>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-green-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <p className="text-gray-600 mb-4">Hello! Choose a question below or type your own:</p>
            <div className="space-y-2">
              {faqQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Icon */}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  )
}
