"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  MessageCircle,
  Award,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  Share2,
} from "lucide-react"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { toast } from "sonner"

export default function RegistrationCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [agentId, setAgentId] = useState<string>("")
  const [agentName, setAgentName] = useState<string>("New Agent")
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [whatsappSent, setWhatsappSent] = useState(false)

  useEffect(() => {
    const id = searchParams.get("agentId")
    const name = searchParams.get("name")

    if (id) {
      setAgentId(id)
    }
    if (name) {
      setAgentName(decodeURIComponent(name))
    }

    // Auto-send WhatsApp after a short delay
    const timer = setTimeout(() => {
      handleSendWhatsApp()
    }, 1000)

    return () => clearTimeout(timer)
  }, [searchParams])

  const handleSendWhatsApp = () => {
    const timestamp = new Date().toLocaleString("en-US", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit", 
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
    
    const message = `✅ *REGISTRATION PAYMENT SUCCESSFUL*

Hello ${agentName},

Your agent registration payment has been successfully processed and verified!

*Payment Confirmation Details:*
Agent Name: ${agentName}
Agent ID: ${agentId}
Amount Paid: ₵47.00
Status: ✅ Active & Verified
Payment Date: ${timestamp}

*Account Status:*
Your account is now fully activated and you can:
• Access your agent dashboard immediately
• View available opportunities
• Start publishing properties
• Begin earning commissions
• Track your earnings in real-time

*What's Next:*
1. Access your dashboard using your Agent ID
2. Complete your profile setup
3. Upload your profile photo
4. Explore available properties and earning opportunities
5. Start publishing and earning

*Benefits You Now Have:*
🎁 Free ₵5 wallet topup
💰 Commission on every sale
📈 Real-time earnings tracking
🤝 Premium agent features

Welcome to the Dataflex Ghana family! 🎉

If you have any questions or need support, please contact us through this chat.

Best regards,
Dataflex Ghana Admin Team
Support: +233 242 799 990`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
    setWhatsappSent(true)
    toast.success("Opening WhatsApp with your payment confirmation...")
  }

  const handleGoToDashboard = () => {
    // Ensure WhatsApp message was sent before allowing dashboard access
    if (!whatsappSent) {
      toast.error("Please send the WhatsApp confirmation first")
      handleSendWhatsApp()
      return
    }
    setIsRedirecting(true)
    // Redirect to agent dashboard
    router.push("/agent/dashboard")
  }

  const agentBenefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Earnings",
      description: "Start earning from day one with multiple income streams",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Unlimited Growth",
      description: "Scale your earnings with commission and referral bonuses",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community Support",
      description: "Join a network of successful agents making real money",
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Premium Features",
      description: "Access exclusive tools and resources for agents",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Success Header */}
          <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-16 h-16 text-emerald-600 animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Registration Complete!</h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Congratulations, {agentName}! Your account is now active and verified.
            </p>
          </div>

          {/* Main Card */}
          <Card className="shadow-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Payment Confirmed
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                Your ₵47 registration fee has been successfully processed
              </p>
            </div>

            <CardContent className="pt-8 space-y-8">
              {/* Account Status */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Agent Status:</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Active & Verified
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Account Type:</span>
                  <span className="text-gray-900 font-semibold">Premium Agent</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Registration Date:</span>
                  <span className="text-gray-900 font-semibold">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* WhatsApp Status */}
              <div className={`border rounded-lg p-6 flex items-start gap-4 ${
                whatsappSent 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-blue-50 border-blue-200"
              }`}>
                <MessageCircle className={`h-6 w-6 flex-shrink-0 mt-1 ${
                  whatsappSent ? "text-emerald-600" : "text-blue-600"
                }`} />
                <div>
                  <p className={`font-semibold mb-1 ${
                    whatsappSent ? "text-emerald-900" : "text-blue-900"
                  }`}>
                    {whatsappSent 
                      ? "✓ WhatsApp Message Sent" 
                      : "Opening WhatsApp Confirmation"}
                  </p>
                  <p className={`text-sm ${
                    whatsappSent ? "text-emerald-800" : "text-blue-800"
                  }`}>
                    Your registration confirmation has been sent to WhatsApp. Share this with our admin to proceed.
                  </p>
                </div>
              </div>

              {/* Benefits Grid */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600" />
                  Your Agent Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agentBenefits.map((benefit, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="text-emerald-600">{benefit.icon}</div>
                      <h4 className="font-semibold text-gray-900">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleSendWhatsApp}
                  variant="outline"
                  className="w-full h-12 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Resend WhatsApp Confirmation
                </Button>

                <Button
                  onClick={handleGoToDashboard}
                  disabled={isRedirecting}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isRedirecting ? (
                    <>
                      <div className="animate-spin">⏳</div>
                      <span>Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Go to Dashboard</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">📌 Important:</p>
                <p>After clicking the WhatsApp button, share the confirmation message with our admin team. They will review your details and complete your onboarding process.</p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Footer */}
          <div className="text-center text-sm text-gray-600">
            <p>🔒 Your data is secure and encrypted • Payment verified by Paystack</p>
          </div>
        </div>
      </div>
    </div>
  )
}
