"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase, type Agent, type Referral, type DataOrder } from "@/lib/supabase"
import { ArrowLeft, Banknote, Clock, CheckCircle, Trash2, RefreshCw, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"
import { getStoredAgent } from "@/lib/unified-auth-system"

export default function WithdrawPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [dataOrders, setDataOrders] = useState<DataOrder[]>([])
  const [wholesaleCommissions, setWholesaleCommissions] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [amount, setAmount] = useState("")
  const [momoNumber, setMomoNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [monthlyWithdrawals, setMonthlyWithdrawals] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [commissionBreakdown, setCommissionBreakdown] = useState<any[]>([])
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false)
  const [pendingWithdrawalInfo, setPendingWithdrawalInfo] = useState<any>(null)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [forceShowForm, setForceShowForm] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertConfig, setAlertConfig] = useState({
    type: "success" as "success" | "error" | "warning",
    title: "",
    message: "",
    onClose: () => {},
  })
  const router = useRouter()

  const MIN_WITHDRAWAL_AMOUNT = 10
  const MAX_MONTHLY_WITHDRAWALS = 5

  const handleRefreshData = async () => {
    if (!agent) return

    setRefreshing(true)
    try {
      const { getAgentCommissionSummary } = await import("@/lib/commission-earnings")
      const commissionSummary = await getAgentCommissionSummary(agent.id)

      const availableForWithdrawal = commissionSummary.availableForWithdrawal || 0
      setAvailableBalance(availableForWithdrawal)

      const breakdown = [
        {
          source_type: "referral",
          total_amount: commissionSummary.referralCommissions || 0,
        },
        {
          source_type: "data_order",
          total_amount: commissionSummary.dataOrderCommissions || 0,
        },
        {
          source_type: "wholesale_order",
          total_amount: commissionSummary.wholesaleCommissions || 0,
        },
      ]
      setCommissionBreakdown(breakdown)

      console.log("✅ Withdrawal page commission data refreshed:", {
        availableForWithdrawal,
        breakdown: breakdown.map((b) => `${b.source_type}: ${b.total_amount}`).join(", "),
      })
    } catch (error) {
      console.error("Error refreshing earnings data:", error)
      alert("Failed to refresh earnings data. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (!agentData) {
      router.push("/agent/login")
      return
    }

    const parsedAgent = JSON.parse(agentData)
    setAgent(parsedAgent)
    setMomoNumber(parsedAgent.momo_number)

    loadEarnings(parsedAgent.id)
      .catch((error) => {
        console.error("Failed to load earnings:", error)
        setLoadingError("Failed to load earnings data. You can still use the withdrawal form.")
        setAvailableBalance(0)
        setMonthlyWithdrawals(0)
      })
      .finally(() => {
        setInitialLoading(false)
      })
  }, [router])

  const loadEarnings = async (agentId: string) => {
    try {
      let commissionSummary
      try {
        const { getAgentCommissionSummary } = await import("@/lib/commission-earnings")
        commissionSummary = await getAgentCommissionSummary(agentId)

        console.log("✅ Agent Withdrawal using unified commission system:", {
          agentId,
          totalCommissions: commissionSummary.totalCommissions,
          availableCommissions: commissionSummary.availableCommissions,
          pendingPayout: commissionSummary.pendingPayout,
          totalPaidOut: commissionSummary.totalPaidOut,
          referralCommissions: commissionSummary.referralCommissions,
          dataOrderCommissions: commissionSummary.dataOrderCommissions,
          wholesaleCommissions: commissionSummary.wholesaleCommissions,
        })
      } catch (error) {
        console.error("Failed to load unified commission system, using fallback:", error)
        commissionSummary = await calculateLegacyBalance(agentId)
      }

      const availableForWithdrawal = commissionSummary.availableForWithdrawal || 0
      setAvailableBalance(availableForWithdrawal)

      const breakdown = [
        {
          source_type: "referral",
          total_amount: commissionSummary.referralCommissions || 0,
        },
        {
          source_type: "data_order",
          total_amount: commissionSummary.dataOrderCommissions || 0,
        },
        {
          source_type: "wholesale_order",
          total_amount: commissionSummary.wholesaleCommissions || 0,
        },
      ]
      setCommissionBreakdown(breakdown)

      await Promise.allSettled([
        loadReferrals(agentId),
        loadDataOrders(agentId),
        loadWholesaleCommissions(agentId),
        loadWithdrawals(agentId),
      ])

      console.log("✅ Withdrawal page commission data loaded:", {
        availableForWithdrawal,
        breakdown: breakdown.map((b) => `${b.source_type}: ${b.total_amount}`).join(", "),
      })
    } catch (error) {
      console.error("Error loading earnings:", error)
      setLoadingError("Failed to load commission data. Some information may be outdated.")
    }
  }

  const calculateLegacyBalance = async (agentId: string) => {
    try {
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("totalcommissions, totalpaidout")
        .eq("id", agentId)
        .single()

      if (!agentError && agentData) {
        const totalCommissions = Number(agentData.totalcommissions) || 0
        const totalPaidOut = Number(agentData.totalpaidout) || 0
        const availableBalance = Math.max(totalCommissions - totalPaidOut, 0)

        console.log("Using stored agent commission data as fallback:", {
          totalCommissions,
          totalPaidOut,
          availableBalance,
        })

        return {
          availableCommissions: availableBalance,
          totalCommissions,
          totalPaidOut,
          referralCommissions: 0, // Cannot break down from stored totals
          dataOrderCommissions: 0,
          wholesaleCommissions: 0,
        }
      }

      const [referralsData, dataOrdersData, wholesaleData] = await Promise.all([
        supabase
          .from("referrals")
          .select(`*, services (commission_amount)`)
          .eq("agent_id", agentId)
          .eq("status", "completed")
          .eq("commission_paid", false),
        supabase
          .from("data_orders")
          .select("commission_amount")
          .eq("agent_id", agentId)
          .eq("status", "completed")
          .eq("commission_paid", false),
        supabase
          .from("wholesale_orders")
          .select("commission_amount")
          .eq("agent_id", agentId)
          .eq("status", "delivered")
          .eq("commission_paid", false),
      ])

      const referralTotal = (referralsData.data || []).reduce((sum, r) => sum + (r.services?.commission_amount || 0), 0)
      const dataOrderTotal = (dataOrdersData.data || []).reduce((sum, o) => sum + (o.commission_amount || 0), 0)
      const wholesaleTotal = (wholesaleData.data || []).reduce((sum, w) => sum + (w.commission_amount || 0), 0)

      const totalPooled = referralTotal + dataOrderTotal + wholesaleTotal

      console.log("✅ Legacy commission pooling:", {
        referralTotal,
        dataOrderTotal,
        wholesaleTotal,
        totalPooled,
      })

      return {
        availableCommissions: totalPooled,
        referralCommissions: referralTotal,
        dataOrderCommissions: dataOrderTotal,
        wholesaleCommissions: wholesaleTotal,
      }
    } catch (error) {
      console.error("Legacy balance calculation failed:", error)
      return {
        availableCommissions: 0,
        referralCommissions: 0,
        dataOrderCommissions: 0,
        wholesaleCommissions: 0,
      }
    }
  }

  const calculateLegacyCommissionBreakdown = async (agentId: string) => {
    try {
      const { data: referralsData } = await supabase
        .from("referrals")
        .select(`*, services (title, commission_amount)`)
        .eq("agent_id", agentId)
        .eq("status", "completed")
        .eq("commission_paid", false)

      const { data: dataOrdersData } = await supabase
        .from("data_orders")
        .select("commission_amount")
        .eq("agent_id", agentId)
        .eq("status", "completed")
        .eq("commission_paid", false)

      const referralsCommission = (referralsData || []).reduce(
        (sum, r) => sum + (r.services?.commission_amount || 0),
        0,
      )
      const dataOrdersCommission = (dataOrdersData || []).reduce((sum, o) => sum + (o.commission_amount || 0), 0)

      return { referralsCommission, dataOrdersCommission }
    } catch (error) {
      console.error("Legacy commission breakdown calculation failed:", error)
      return { referralsCommission: 0, dataOrdersCommission: 0 }
    }
  }

  const loadReferrals = async (agentId: string) => {
    try {
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select(`
          *,
          services (title, commission_amount)
        `)
        .eq("agent_id", agentId)
        .eq("status", "completed")

      if (referralsError) throw referralsError
      setReferrals(referralsData || [])
    } catch (error) {
      console.error("Error loading referrals:", error)
      setReferrals([])
    }
  }

  const loadDataOrders = async (agentId: string) => {
    try {
      const { data: dataOrdersData, error: dataOrdersError } = await supabase
        .from("data_orders")
        .select(`
          *,
          data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price)
        `)
        .eq("agent_id", agentId)
        .eq("status", "completed")

      if (dataOrdersError) throw dataOrdersError
      setDataOrders(dataOrdersData || [])
    } catch (error) {
      console.error("Error loading data orders:", error)
      setDataOrders([])
    }
  }

  const loadWholesaleCommissions = async (agentId: string) => {
    try {
      const { data: wholesaleData, error: wholesaleError } = await supabase
        .from("wholesale_orders")
        .select(`
          *,
          wholesale_products (name, price)
        `)
        .eq("agent_id", agentId)
        .eq("status", "delivered")

      if (wholesaleError) throw wholesaleError
      setWholesaleCommissions(wholesaleData || [])
    } catch (error) {
      console.error("Error loading wholesale orders:", error)
      setWholesaleCommissions([])
    }
  }

  const loadWithdrawals = async (agentId: string) => {
    try {
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("agent_id", agentId)
        .order("requested_at", { ascending: false })

      if (withdrawalsError) throw withdrawalsError

      const activeWithdrawals = (withdrawalsData || []).filter((w) => w.status !== "paid")

      // Check for pending withdrawals
      const pendingWithdrawals = activeWithdrawals.filter((w) =>
        ["requested", "processing", "pending"].includes(w.status),
      )

      if (pendingWithdrawals.length > 0) {
        setHasPendingWithdrawal(true)
        setPendingWithdrawalInfo(pendingWithdrawals[0])
      } else {
        setHasPendingWithdrawal(false)
        setPendingWithdrawalInfo(null)
      }

      // Calculate monthly withdrawals (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyCount = activeWithdrawals.filter((w) => {
        const withdrawalDate = new Date(w.requested_at)
        return withdrawalDate.getMonth() === currentMonth && withdrawalDate.getFullYear() === currentYear
      }).length

      setWithdrawals(activeWithdrawals)
      setMonthlyWithdrawals(monthlyCount)
    } catch (error) {
      console.error("Error loading withdrawals:", error)
      setWithdrawals([])
      setMonthlyWithdrawals(0)
    }
  }

  const referralEarnings = referrals.reduce((sum, r) => sum + (r.services?.commission_amount || 0), 0)
  const dataOrderEarnings = dataOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0)
  const wholesaleEarnings = wholesaleCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0)

  const totalAvailable = Math.max(availableBalance, 0)

  const getDisplayBreakdown = () => {
    const breakdown = {
      referral: 0,
      data_order: 0,
      wholesale: 0,
    }

    // Use commission breakdown from unified system
    if (commissionBreakdown && commissionBreakdown.length > 0) {
      commissionBreakdown.forEach((item) => {
        const sourceType = item.source_type
        const amount = Number(item.total_amount) || 0

        if (sourceType === "referral") {
          breakdown.referral = amount
        } else if (sourceType === "data_order") {
          breakdown.data_order = amount
        } else if (sourceType === "wholesale_order") {
          breakdown.wholesale = amount
        }
      })
    }

    console.log("✅ Withdrawal page commission breakdown:", {
      breakdown,
      totalAvailable,
      availableBalance,
    })

    return breakdown
  }

  const displayBreakdown = getDisplayBreakdown()

  const canWithdraw = () => {
    const withdrawAmount = Number.parseFloat(amount)
    return (
      withdrawAmount >= MIN_WITHDRAWAL_AMOUNT &&
      withdrawAmount <= totalAvailable &&
      monthlyWithdrawals < MAX_MONTHLY_WITHDRAWALS &&
      !hasPendingWithdrawal // CRITICAL: Prevent withdrawal if there's already a pending request
    )
  }

  const getWithdrawalError = () => {
    const withdrawAmount = Number.parseFloat(amount)

    if (hasPendingWithdrawal && pendingWithdrawalInfo) {
      return `You have a pending withdrawal of GH₵${Number(pendingWithdrawalInfo.amount).toFixed(2)} (${pendingWithdrawalInfo.status}). Please wait for it to be processed before submitting a new request.`
    }

    if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      return `Minimum withdrawal amount is GH₵ ${MIN_WITHDRAWAL_AMOUNT}`
    }

    if (withdrawAmount > totalAvailable) {
      return "Amount exceeds available balance"
    }

    if (monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS) {
      return `You have reached the monthly limit of ${MAX_MONTHLY_WITHDRAWALS} withdrawals`
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent) return

    const withdrawAmount = Number.parseFloat(amount)

    if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      showCustomAlert("warning", "Minimum Amount Required", `Minimum withdrawal amount is GH₵ ${MIN_WITHDRAWAL_AMOUNT}`)
      return
    }

    if (withdrawAmount > totalAvailable) {
      showCustomAlert(
        "error",
        "Insufficient Balance",
        `Insufficient commission balance.\n\nAvailable: GH₵ ${totalAvailable.toFixed(2)}\nRequested: GH₵ ${withdrawAmount.toFixed(2)}`,
      )
      return
    }

    if (monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS) {
      showCustomAlert(
        "warning",
        "Monthly Limit Reached",
        `You have reached the monthly limit of ${MAX_MONTHLY_WITHDRAWALS} withdrawals`,
      )
      return
    }

    if (hasPendingWithdrawal) {
      showCustomAlert(
        "warning",
        "Pending Withdrawal",
        "You have a pending withdrawal. Please wait for it to be processed before submitting a new request.",
      )
      return
    }

    setLoading(true)

    try {
      const agent = getStoredAgent()
      if (!agent) {
        throw new Error("Agent session not found. Please log in again.")
      }

      console.log("[v0] Withdrawal request details:", {
        agentId: agent.id,
        amount: withdrawAmount,
        momoNumber: momoNumber,
        totalAvailable: totalAvailable,
        hasPendingWithdrawal: hasPendingWithdrawal,
        monthlyWithdrawals: monthlyWithdrawals,
      })

      const response = await fetch("/api/agent/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${btoa(JSON.stringify(agent))}`,
        },
        body: JSON.stringify({
          agent_id: agent.id,
          amount: withdrawAmount,
          momo_number: momoNumber,
        }),
      })

      console.log("[v0] Withdrawal API response status:", response.status)

      const responseText = await response.text()
      console.log("[v0] Withdrawal API response body:", responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[v0] Failed to parse response JSON:", parseError)
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`)
      }

      if (!response.ok) {
        console.error("[v0] Withdrawal request failed:", {
          status: response.status,
          error: result.error,
          details: result,
        })
        throw new Error(result.error || `HTTP ${response.status}: Failed to submit withdrawal request`)
      }

      if (!result.success) {
        console.error("[v0] Withdrawal processing failed:", result)
        throw new Error(result.error || "Failed to submit withdrawal request")
      }

      console.log("[v0] Withdrawal request successful:", result)

      showCustomAlert(
        "success",
        "Request Submitted Successfully!",
        "Your withdrawal request has been submitted and will be reviewed by our team.\n\nProcessing time: approximately 3 hours.\n\nYou will receive a confirmation once processed.",
      )

      await loadEarnings(agent.id)

      setAmount("")
    } catch (error) {
      console.error("[v0] Error in withdrawal submission:", error)

      let errorMessage = "Failed to submit withdrawal request.\n\n"

      if (error instanceof Error) {
        if (error.message.includes("Insufficient commission balance")) {
          errorMessage += `You don't have enough commission balance for this withdrawal.\n\nAvailable: GH₵ ${totalAvailable.toFixed(2)}`
        } else if (error.message.includes("Agent ID is required") || error.message.includes("Agent ID mismatch")) {
          errorMessage += "There was an issue with your account authentication. Please log out and log back in."
        } else if (error.message.includes("Mobile money number is required")) {
          errorMessage += "Please provide a valid mobile money number."
        } else if (error.message.includes("pending withdrawal")) {
          errorMessage += "You have a pending withdrawal request. Please wait for it to be processed first."
        } else if (error.message.includes("same amount")) {
          errorMessage += "You recently requested this same amount. Please wait 24 hours or choose a different amount."
        } else if (error.message.includes("timeout") || error.message.includes("network")) {
          errorMessage += "Network error. Please check your connection and try again."
        } else if (error.message.includes("HTTP 401")) {
          errorMessage += "Authentication failed. Please log out and log back in."
        } else if (error.message.includes("HTTP 403")) {
          errorMessage += "Access denied. Please verify your account permissions."
        } else if (error.message.includes("HTTP 500")) {
          errorMessage += "Server error occurred. Please try again in a few minutes."
        } else {
          errorMessage += error.message
        }
      } else {
        errorMessage += "Please try again or contact support if the problem persists."
      }

      showCustomAlert("error", "Submission Failed", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClearWithdrawalHistory = async () => {
    if (!agent) return
    setClearing(true)

    try {
      const { error } = await supabase.from("withdrawals").delete().eq("agent_id", agent.id)

      if (error) throw error

      alert("Withdrawal history cleared successfully!")
      loadEarnings(agent.id)
    } catch (error) {
      console.error("Error clearing withdrawal history:", error)
      alert("Failed to clear withdrawal history. Please try again.")
    } finally {
      setClearing(false)
    }
  }

  const handleClearPaidCommissions = async () => {
    if (!agent) return
    setClearing(true)

    try {
      const { error: referralError } = await supabase
        .from("referrals")
        .delete()
        .eq("agent_id", agent.id)
        .eq("status", "completed")
        .eq("commission_paid", true)

      if (referralError) throw referralError

      const { error: dataOrderError } = await supabase
        .from("data_orders")
        .delete()
        .eq("agent_id", agent.id)
        .eq("status", "completed")
        .eq("commission_paid", true)

      if (dataOrderError) throw dataOrderError

      alert("Paid commission records cleared successfully!")
      loadEarnings(agent.id)
    } catch (error) {
      console.error("Error clearing paid commissions:", error)
      alert("Failed to clear paid commission records. Please try again.")
    } finally {
      setClearing(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getWithdrawalStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "requested":
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const CustomAlert = ({
    isOpen,
    onClose,
    type,
    title,
    message,
  }: {
    isOpen: boolean
    onClose: () => void
    type: "success" | "error" | "warning"
    title: string
    message: string
  }) => {
    if (!isOpen) return null

    const getIcon = () => {
      switch (type) {
        case "success":
          return (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )
        case "error":
          return (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )
        case "warning":
          return (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          )
      }
    }

    const getColors = () => {
      switch (type) {
        case "success":
          return "text-green-600 bg-green-50 hover:bg-green-100 focus:ring-green-500"
        case "error":
          return "text-red-600 bg-red-50 hover:bg-red-100 focus:ring-red-500"
        case "warning":
          return "text-yellow-600 bg-yellow-50 hover:bg-yellow-100 focus:ring-yellow-500"
      }
    }

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
            <div>
              {getIcon()}
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 whitespace-pre-line">{message}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${getColors()}`}
                onClick={onClose}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const showCustomAlert = (type: "success" | "error" | "warning", title: string, message: string) => {
    setAlertConfig({
      type,
      title,
      message,
      onClose: () => setShowAlert(false),
    })
    setShowAlert(true)
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/agent/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden xs:inline ml-1">Back to Dashboard</span>
                  <span className="xs:hidden ml-1">Back</span>
                </Link>
              </Button>
            </div>

            <Card className="w-full">
              <CardContent className="text-center py-6 sm:py-8 px-4 sm:px-6">
                <RefreshCw className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Loading Withdrawal Page</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Please wait while we load your commission data...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (totalAvailable <= 0 && withdrawals.length === 0 && !forceShowForm && !loadingError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/agent/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden xs:inline ml-1">Back to Dashboard</span>
                  <span className="xs:hidden ml-1">Back</span>
                </Link>
              </Button>
            </div>

            <Card className="w-full">
              <CardContent className="text-center py-6 sm:py-8 px-4 sm:px-6">
                <Banknote className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg sm:text-xl font-semibold mb-2">No Available Balance</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  You don't have any unpaid commissions available for withdrawal.
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  If you have completed referrals that should be available for withdrawal, try refreshing your data.
                </p>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={handleRefreshData} disabled={refreshing} size="sm" className="w-full sm:w-auto">
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                      {refreshing ? "Refreshing..." : "Refresh Data"}
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                      <Link href="/agent/dashboard">Back to Dashboard</Link>
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setForceShowForm(true)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto bg-transparent"
                    >
                      Show Withdrawal Form Anyway
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={clearing}
                          className="w-full sm:w-auto bg-transparent"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Paid Records
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">
                            Clear Paid Commission Records
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            This will permanently delete all completed referrals and data orders that have been marked
                            as paid. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearPaidCommissions} className="w-full sm:w-auto">
                            Clear Records
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agent/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden xs:inline ml-1">Back to Dashboard</span>
                <span className="xs:hidden ml-1">Back</span>
              </Link>
            </Button>
          </div>

          {loadingError && (
            <Alert className="mb-4 sm:mb-6 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Loading Warning:</strong> {loadingError}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <Card className="w-full">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium text-gray-600">Available Balance</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">GH₵ {totalAvailable.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Ready for withdrawal</p>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium text-gray-600">Monthly Withdrawals</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {monthlyWithdrawals}/{MAX_MONTHLY_WITHDRAWALS}
                </div>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="w-full sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium text-gray-600">Minimum Amount</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">GH₵ {MIN_WITHDRAWAL_AMOUNT}</div>
                <p className="text-xs text-gray-500 mt-1">Per withdrawal</p>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Restrictions Notice */}
          <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p className="font-semibold text-sm sm:text-base">💳 Withdrawal Guidelines</p>
                <ul className="text-xs sm:text-sm list-disc list-inside ml-2 space-y-1">
                  <li>
                    Minimum withdrawal amount: <strong>GH₵ {MIN_WITHDRAWAL_AMOUNT}</strong>
                  </li>
                  <li>
                    Maximum <strong>{MAX_MONTHLY_WITHDRAWALS} withdrawals per month</strong>
                  </li>
                  <li>
                    Processing time: <strong>Approximately 3 hours</strong>
                  </li>
                  <li>All completed commissions will be included in your withdrawal</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS && (
            <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <AlertDescription className="text-red-800">
                <p className="font-semibold text-sm sm:text-base">Monthly Withdrawal Limit Reached</p>
                <p className="text-xs sm:text-sm">
                  You have reached the maximum of {MAX_MONTHLY_WITHDRAWALS} withdrawals for this month. Please wait
                  until next month to make additional withdrawal requests.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content - Mobile First Layout */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Withdrawal Form */}
            <div className="w-full space-y-4 sm:space-y-6">
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-lg sm:text-xl">Request Withdrawal</CardTitle>
                  <CardDescription className="text-sm">
                    Withdraw your available commission earnings to your mobile money account.
                  </CardDescription>
                  {hasPendingWithdrawal && pendingWithdrawalInfo && (
                    <Alert className="mt-4 border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        <strong>Pending Withdrawal:</strong> You have a withdrawal request of GH₵
                        {Number(pendingWithdrawalInfo.amount).toFixed(2)}
                        that is currently <span className="font-semibold">{pendingWithdrawalInfo.status}</span>. Please
                        wait for it to be processed before submitting a new request.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="w-full">
                      <Label htmlFor="amount" className="text-sm font-medium">
                        Amount (GH₵)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min={MIN_WITHDRAWAL_AMOUNT}
                        max={totalAvailable}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min: ${MIN_WITHDRAWAL_AMOUNT}, Max: ${totalAvailable.toFixed(2)}`}
                        disabled={monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS}
                        className="w-full mt-1"
                      />
                      {amount && getWithdrawalError() && (
                        <p className="text-xs sm:text-sm text-red-600 mt-1">{getWithdrawalError()}</p>
                      )}
                    </div>

                    <div className="w-full">
                      <Label htmlFor="momo_number" className="text-sm font-medium">
                        Mobile Money Number
                      </Label>
                      <Input
                        id="momo_number"
                        type="tel"
                        required
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        placeholder="+233123456789"
                        disabled={monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS}
                        className="w-full mt-1"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !canWithdraw()} size="default">
                      {loading ? "Processing..." : "Request Withdrawal"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Available Earnings Breakdown */}
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Available Earnings</CardTitle>
                      <CardDescription className="text-sm">Breakdown of your unpaid commissions</CardDescription>
                    </div>
                    <Button
                      onClick={handleRefreshData}
                      size="sm"
                      variant="outline"
                      disabled={refreshing}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-3 sm:space-y-4">
                    {commissionBreakdown.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-2">Commission System Breakdown:</p>
                        {commissionBreakdown.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs text-gray-700">
                            <span>
                              {item.source_type.replace("_", " ")}: {item.count_items} items
                            </span>
                            <span>GH₵ {Number(item.total_amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-t-2 border-gray-300">
                      <span className="font-bold text-sm sm:text-base">Total Available</span>
                      <span className="font-bold text-base sm:text-lg">GH₵ {totalAvailable.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Withdrawal History */}
            <div className="w-full space-y-4 sm:space-y-6">
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Withdrawal History</CardTitle>
                      <CardDescription className="text-sm">
                        Your recent withdrawal requests and their status
                      </CardDescription>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={clearing}
                          className="w-full sm:w-auto bg-transparent"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">Clear Withdrawal History</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            This will permanently delete all your withdrawal records. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearWithdrawalHistory} className="w-full sm:w-auto">
                            Clear History
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-sm sm:text-base">No withdrawal history yet</p>
                      <p className="text-xs sm:text-sm text-gray-500">Your withdrawal requests will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {withdrawals.map((withdrawal) => (
                        <div
                          key={withdrawal.id}
                          className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            {getWithdrawalStatusIcon(withdrawal.status)}
                            <div>
                              <p className="font-medium text-sm sm:text-base">GH₵ {withdrawal.amount.toFixed(2)}</p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {formatTimestamp(withdrawal.requested_at)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              withdrawal.status === "paid"
                                ? "default"
                                : withdrawal.status === "requested"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={`text-xs ${
                              withdrawal.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : withdrawal.status === "requested"
                                  ? "bg-orange-100 text-orange-800"
                                  : ""
                            }`}
                          >
                            {withdrawal.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Clear Paid Records */}
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-lg sm:text-xl">Data Management</CardTitle>
                  <CardDescription className="text-sm">Clean up your commission records</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full bg-transparent" disabled={clearing}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Paid Commission Records
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">
                          Clear Paid Commission Records
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          This will permanently delete all completed referrals and data orders that have been marked as
                          paid. This helps keep your dashboard clean but cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearPaidCommissions} className="w-full sm:w-auto">
                          Clear Records
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <CustomAlert
        isOpen={showAlert}
        onClose={alertConfig.onClose}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  )
}
