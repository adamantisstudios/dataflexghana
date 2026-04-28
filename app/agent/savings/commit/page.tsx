"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, PiggyBank } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { BackToTop } from "@/components/back-to-top"
import SavingsCommitmentForm from "@/components/agent/savings/SavingsCommitmentForm"
import { getStoredAgent, type Agent } from "@/lib/unified-auth-system"
import { calculateWalletBalance } from "@/lib/earnings-calculator"
import { toast } from "sonner"

interface SavingsPlan {
  id: string
  name: string
  description: string
  interest_rate: number
  minimum_amount: number
  maximum_amount: number | null
  duration_months: number
  early_withdrawal_penalty: number
}

export default function SavingsCommitPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [realTimeWalletBalance, setRealTimeWalletBalance] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<SavingsPlan | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = window.location.search
  const urlParams = new URLSearchParams(searchParams)
  const planId = urlParams.get("planId")
  const amountParam = urlParams.get("amount")

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get agent from localStorage using unified auth system
        const storedAgent = getStoredAgent()

        if (!storedAgent) {
          router.push("/agent/login")
          return
        }

        setAgent(storedAgent)

        // Set amount from URL params
        if (amountParam) {
          setAmount(Number.parseFloat(amountParam))
        }

        try {
          const balance = await calculateWalletBalance(storedAgent.id)
          setRealTimeWalletBalance(balance)
        } catch (err) {
          console.error("Error calculating wallet balance:", err)
          // Fallback to stored balance if calculation fails
          setRealTimeWalletBalance(storedAgent.wallet_balance || 0)
        }

        // Fetch the selected plan if planId is provided
        if (planId) {
          await fetchPlan(planId)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load savings plan")
        toast.error("Failed to load savings plan")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const fetchPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from("savings_plans")
        .select("*")
        .eq("id", planId)
        .eq("is_active", true)
        .single()

      if (error) {
        throw new Error("Savings plan not found or inactive")
      }

      if (!data) {
        throw new Error("Savings plan not found")
      }

      setSelectedPlan(data)
      // Set default amount to minimum if not provided
      if (!amountParam) {
        setAmount(data.minimum_amount)
      }
    } catch (err) {
      console.error("Error fetching plan:", err)
      setError("Failed to load savings plan")
      throw err
    }
  }

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDuration = (months: number) => {
    if (months < 12) {
      return `${months} month${months !== 1 ? "s" : ""}`
    }
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? "s" : ""}`
    }
    return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading commitment form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push("/agent/savings/plans")} variant="outline">
                  Back to Plans
                </Button>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!agent) {
    return null
  }

  if (!planId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">No savings plan selected</p>
              <Button onClick={() => router.push("/agent/savings/plans")}>Select a Plan</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agent/savings/plans" className="text-white hover:text-blue-200 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                  <PiggyBank className="w-full h-full text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Savings Commitment</h1>
                  <p className="text-blue-100 font-medium">
                    {selectedPlan ? `Committing to ${selectedPlan.name}` : "Loading plan..."}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-white font-bold text-lg">{formatCurrency(realTimeWalletBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {selectedPlan ? (
            <SavingsCommitmentForm
              plan={{
                ...selectedPlan,
                formattedDuration: formatDuration(selectedPlan.duration_months),
              }}
              amount={amount}
              agentId={agent.id}
              walletBalance={realTimeWalletBalance}
              onBack={() => router.push("/agent/savings/plans")}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading savings plan...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <BackToTop />
    </div>
  )
}
