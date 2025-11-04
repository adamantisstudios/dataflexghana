"use client"
import { useState } from "react"
import { MessageCircle, X, Users, Briefcase, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function DomesticWorkersWhatsAppDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(true)
  const router = useRouter()

  const handleRegisterAsWorker = () => {
    router.push("/register-worker") // Redirect to your new page
    setIsOpen(false)
  }

  const handleWhatsAppClick = (message: string) => {
    const phoneNumber = "+233242799990"
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
    setIsOpen(false)
  }

  const employerMessage = `Hi! I'm looking to hire a domestic worker and need assistance with:
• Finding qualified candidates
• Understanding the hiring process
• Discussing rates and terms
• Scheduling interviews
Could you please help me find the right domestic worker for my needs? Thank you!`

  if (!showFloatingButton) return null

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
          <div className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-50"></div>
          <Button
            onClick={() => setIsOpen(true)}
            className="relative h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-2xl hover:shadow-3xl transition-all duration-300 group animate-bounce"
            size="icon"
          >
            <MessageCircle className="h-8 w-8 text-white group-hover:scale-125 transition-transform duration-300" />
          </Button>
          <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-lg p-3 max-w-xs animate-bounce hidden lg:block">
            <div className="text-sm font-medium text-green-800">Need Help?</div>
            <div className="text-xs text-green-600">Chat with us on WhatsApp!</div>
            <div className="absolute bottom-0 right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white transform translate-y-full"></div>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-green-600" />
                Get Started with WhatsApp
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFloatingButton(false)}
                className="h-6 w-6 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-600 text-sm">Connect with us instantly on WhatsApp for personalized assistance:</p>
            {/* Job Seeker Option */}
            <div className="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Looking for Work?</h3>
                  <p className="text-sm text-green-600 mt-1">
                    Register as a domestic worker and find employment opportunities
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRegisterAsWorker}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Register Now
              </Button>
            </div>
            {/* Employer Option */}
            <div className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Need to Hire?</h3>
                  <p className="text-sm text-blue-600 mt-1">Find qualified domestic workers for your household needs</p>
                </div>
              </div>
              <Button
                onClick={() => handleWhatsAppClick(employerMessage)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Find Workers
              </Button>
            </div>
            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>Quick response guaranteed</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Available Monday - Saturday, 8AM - 6PM</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={() => setShowFloatingButton(false)} variant="ghost" className="flex-1 text-gray-500">
              Don't Show Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
