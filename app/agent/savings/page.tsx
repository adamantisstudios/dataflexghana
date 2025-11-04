"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PiggyBank, TrendingUp, Download, Target, Wallet, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { getStoredAgent, type Agent } from "@/lib/unified-auth-system"
import { savingsApi } from "@/lib/api-client-enhanced"
import { BackToTop } from "@/components/back-to-top"
import SavingsDashboard from "@/components/agent/savings/SavingsDashboard"
import SavingsPlansSelector from "@/components/agent/savings/SavingsPlansSelector"
import SavingsProgressTracker from "@/components/agent/savings/SavingsProgressTracker"
import { calculateWalletBalance } from "@/lib/earnings-calculator"

export default function AgentSavingsPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [activeSavings, setActiveSavings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [currentWalletBalance, setCurrentWalletBalance] = useState(0)
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
          setCurrentWalletBalance(balance)
          console.log("✅ Savings page: Updated wallet balance from unified system:", balance)
        } catch (error) {
          console.error("Error calculating wallet balance:", error)
          // Fallback to stored balance
          setCurrentWalletBalance(storedAgent.wallet_balance || 0)
        }

        // Load savings data using the new API client
        const savingsResponse = await savingsApi.getAgentSavings(storedAgent.id)

        if (savingsResponse.error) {
          console.error("Error loading savings:", savingsResponse.error)
        } else {
          setActiveSavings(savingsResponse.data || [])
        }
      } catch (error) {
        console.error("Error loading agent data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAgentData()
  }, [router])

  const refreshWalletBalance = async () => {
    if (!agent) return

    try {
      const balance = await calculateWalletBalance(agent.id)
      setCurrentWalletBalance(balance)
      console.log("🔄 Refreshed wallet balance:", balance)
    } catch (error) {
      console.error("Error refreshing wallet balance:", error)
    }
  }

  // Handle tab changes without navigation
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading savings dashboard...</p>
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
              <Link href="/agent/dashboard" className="text-white hover:text-blue-200 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                  <PiggyBank className="w-full h-full text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                    <span>Savings Dashboard</span>
                  </h1>
                  <p className="text-blue-100 font-medium flex items-center gap-2 mt-1">
                    <Target className="h-4 w-4" />
                    <span>Build your financial future with smart savings</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                <div className="flex items-center gap-2 text-white">
                  <Wallet className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Wallet Balance</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={refreshWalletBalance}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-lg font-bold text-white">GH₵ {currentWalletBalance?.toFixed(2) || "0.00"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl p-1">
            <TabsTrigger
              value="dashboard"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
            >
              <Wallet className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="plans"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
            >
              <Target className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Plans</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Progress</span>
            </TabsTrigger>
            <TabsTrigger
              value="withdraw"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Withdraw</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SavingsDashboard
              agentId={agent.id}
              walletBalance={currentWalletBalance}
              onBalanceUpdate={refreshWalletBalance}
            />
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <SavingsPlansSelector
              agentId={agent.id}
              walletBalance={currentWalletBalance}
              onBalanceUpdate={refreshWalletBalance}
            />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {/* Progress Tracker */}
            {activeSavings && activeSavings.length > 0 && (
              <SavingsProgressTracker agentId={agent.id} savingsId={activeSavings[0].id} />
            )}
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <div className="text-center py-12">
              <Download className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Request Withdrawal</h3>
              <p className="text-gray-500 mb-6">Withdraw funds from your savings accounts</p>
              <Button asChild>
                <Link href="/agent/savings/withdraw">
                  <Download className="mr-2 h-4 w-4" />
                  Go to Withdrawal Page
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <BackToTop />
    </div>
  )
}
