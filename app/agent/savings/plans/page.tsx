"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, PiggyBank } from "lucide-react"
import Link from "next/link"
import { BackToTop } from "@/components/back-to-top"
import SavingsPlansSelector from "@/components/agent/savings/SavingsPlansSelector"
import { getStoredAgent, type Agent } from "@/lib/unified-auth-system"
import { calculateWalletBalance } from "@/lib/earnings-calculator"

export default function SavingsPlansPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [realTimeWalletBalance, setRealTimeWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadAgentData = async () => {
      try {
        // Get agent from localStorage using unified auth system
        const storedAgent = getStoredAgent()

        if (!storedAgent) {
          router.push("/agent/login")
          return
        }

        setAgent(storedAgent)

        try {
          const balance = await calculateWalletBalance(storedAgent.id)
          setRealTimeWalletBalance(balance)
        } catch (error) {
          console.error("Error calculating wallet balance:", error)
          // Fallback to stored balance if calculation fails
          setRealTimeWalletBalance(storedAgent.wallet_balance || 0)
        }
      } catch (error) {
        console.error("Error loading agent data:", error)
        router.push("/agent/login")
      } finally {
        setLoading(false)
      }
    }

    loadAgentData()
  }, [router])

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading savings plans...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agent/savings" className="text-white hover:text-blue-200 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                  <PiggyBank className="w-full h-full text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Savings Plans</h1>
                  <p className="text-blue-100 font-medium">Choose the perfect plan for your financial goals</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Wallet Balance</p>
              <p className="text-white font-bold text-lg">{formatCurrency(realTimeWalletBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <SavingsPlansSelector agentId={agent.id} walletBalance={realTimeWalletBalance} />
      </main>

      <BackToTop />
    </div>
  )
}
