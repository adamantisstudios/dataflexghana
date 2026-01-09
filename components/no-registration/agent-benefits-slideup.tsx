"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Award, Sparkles, Users, Shield, PiggyBank, Zap, TrendingUp, CreditCard } from "lucide-react"
import Link from "next/link"

export function AgentBenefitsSlideup() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const benefits = [
    { icon: Sparkles, text: "Free Sales Training", color: "text-yellow-600" },
    { icon: Users, text: "10,000+ Active Agents", color: "text-blue-600" },
    { icon: Shield, text: "24/7 Admin Support", color: "text-purple-600" },
    { icon: PiggyBank, text: "Personal Assistant", color: "text-orange-600" },
    { icon: Zap, text: "Instant Opportunities", color: "text-red-600" },
    { icon: TrendingUp, text: "Earn in 24 Hours", color: "text-green-600" },
    { icon: CreditCard, text: "Discounted Costs", color: "text-indigo-600" },
    { icon: Award, text: "Extra Commissions", color: "text-pink-600" },
  ]

  useEffect(() => {
    const showNotification = () => {
      setIsAnimating(true)
      setIsVisible(true)
      setTimeout(() => setIsAnimating(false), 300)
    }

    // Show initially after 30 seconds
    const initialTimer = setTimeout(showNotification, 30000)

    // Show every 30 seconds after that
    const intervalTimer = setInterval(showNotification, 180000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(intervalTimer)
    }
  }, [])

  const handleDismiss = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsAnimating(false)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div
        className={`pointer-events-auto mx-4 mb-4 bg-white rounded-t-2xl shadow-2xl border-t-4 border-green-600 overflow-hidden transition-all duration-300 ${
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 sm:h-6 sm:w-6" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Become an Agent Today</h3>
              <p className="text-xs sm:text-sm text-green-100">Unlock exclusive benefits & start earning</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-green-700 rounded-lg transition-colors ml-2 flex-shrink-0"
            aria-label="Close notification"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 bg-white">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm sm:text-base">
                <benefit.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${benefit.color} flex-shrink-0`} />
                <span className="font-medium text-gray-700">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            asChild
            onClick={handleDismiss}
            size="sm"
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-5 sm:py-6 text-sm sm:text-base"
          >
            <Link href="/agent/register">Register Now & Start Earning</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
