"use client"
import { ArrowLeft, RefreshCw, Clock, X, TrendingUp, TrendingDown, Wallet, CheckCircle, Download, Calendar, Plus, Shuffle, Info, Search, DollarSign, ArrowRight, MessageCircle } from 'lucide-react'
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase-client";
import type { Agent } from "@/lib/supabase";
import { getCurrentAgent } from "@/lib/auth"
import { getAgentDisplayBalances } from "@/lib/agent-display-balances"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { calculateWalletTopupPaystackFees, PAYSTACK_LOCAL_FEE_RATE } from "@/lib/paystack-wallet-fees"
import { openPaystackCheckout } from "@/lib/paystack-inline-checkout"
import { WALLET_TOPUP_PAYSTACK_MIN_GHS } from "@/lib/paystack-wallet-topup"

// Extend Window interface for timeout property
declare global {
  interface Window {
    referenceValidationTimeout?: NodeJS.Timeout
  }
}

interface WalletTransaction {
  id: string
  created_at: string
  transaction_type:
    | "credit"
    | "debit"
    | "refund"
    | "adjustment"
    | "deduction"
    | "topup"
    | "withdrawal"
    | "deposit"
    | "penalty"
    | "interest"
    | "commission_deposit"
    | "withdrawal_deduction"
    | "payment_completed"
  amount: number
  description: string
  reference_code: string
  status: "pending" | "approved" | "rejected"
  admin_notes?: string
  source_type?: string
  source_id?: string
}

export default function WalletPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletSummary, setWalletSummary] = useState<any>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [paystackProcessing, setPaystackProcessing] = useState(false)
  const submitLockRef = useRef(false)
  const searchParams = useSearchParams()
  const [referenceValidation, setReferenceValidation] = useState<{
    isValid: boolean
    message: string
    suggestedCode?: string
  }>({ isValid: true, message: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showWalletRewardNotification, setShowWalletRewardNotification] = useState(true)
  const [isWalletRewardNotificationVisible, setIsWalletRewardNotificationVisible] = useState(false)
  const [pendingCommissionWithdrawals, setPendingCommissionWithdrawals] = useState<
    Array<{ id: string; amount: number; status: string; requested_at: string }>
  >([])
  const router = useRouter()

  const MIN_TOPUP_AMOUNT = 100
  const MIN_REFERENCE_LENGTH = 7

  const fetchWalletTransactions = async (agentId: string, limit = 100) => {
    const sessionAgent = getCurrentAgent()
    const headers: Record<string, string> = { cache: "no-store" }
    if (sessionAgent) {
      headers.Authorization = `Bearer ${btoa(JSON.stringify(sessionAgent))}`
    }
    const res = await fetch(
      `/api/agent/wallet/transactions?agentId=${encodeURIComponent(agentId)}&limit=${limit}`,
      { headers },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to load transaction history")
    }
    const json = await res.json()
    return json.transactions || []
  }

  // Generate a 7-character alphanumeric reference code
  const generateReferenceCode = (): string => {
    return Math.random().toString(36).substr(2, 7).toUpperCase()
  }

  // Validate reference code in real-time
  const validateReferenceCode = async (code: string) => {
    const trimmedCode = code.trim()

    // Reset validation state
    setReferenceValidation({ isValid: true, message: "" })

    if (!trimmedCode) {
      return
    }

    // Check minimum length
    if (trimmedCode.length < MIN_REFERENCE_LENGTH) {
      const suggestedCode = generateReferenceCode()
      setReferenceValidation({
        isValid: false,
        message: `Reference code must be at least ${MIN_REFERENCE_LENGTH} characters long`,
        suggestedCode,
      })
      return
    }

    // Check for duplicates in database
    try {
      const { data: existingTransaction, error } = await supabase
        .from("wallet_transactions")
        .select("id, reference_code")
        .eq("reference_code", trimmedCode)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is what we want
        setReferenceValidation({
          isValid: false,
          message: "Unable to validate reference code. Please try again.",
        })
        return
      }

      if (existingTransaction) {
        const suggestedCode = generateReferenceCode()
        setReferenceValidation({
          isValid: false,
          message: "This reference code has already been used",
          suggestedCode,
        })
        return
      }

      // Code is valid
      setReferenceValidation({
        isValid: true,
        message: "Reference code is valid and unique",
      })
    } catch (error) {
      console.error("Error validating reference code:", error)
      setReferenceValidation({
        isValid: false,
        message: "Unable to validate reference code. Please try again.",
      })
    }
  }

  // Handle reference code input change with debounced validation
  const handleReferenceChange = (value: string) => {
    setPaymentReference(value)

    // Clear previous timeout
    if (window.referenceValidationTimeout) {
      clearTimeout(window.referenceValidationTimeout)
    }

    // Set new timeout for validation (debounce)
    window.referenceValidationTimeout = setTimeout(() => {
      validateReferenceCode(value)
    }, 500)
  }

  // Use suggested reference code
  const useSuggestedCode = () => {
    if (referenceValidation.suggestedCode) {
      setPaymentReference(referenceValidation.suggestedCode)
      setReferenceValidation({
        isValid: true,
        message: "Using suggested reference code",
      })
    }
  }

  useEffect(() => {
    const currentAgent = getCurrentAgent()
    if (!currentAgent) {
      router.push("/agent/login")
      return
    }
    setAgent(currentAgent)
    loadWalletData(currentAgent.id)
  }, [router])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, statusFilter, typeFilter])

  // Show wallet reward notification after delay
  useEffect(() => {
    if (!isWalletRewardNotificationVisible) {
      const timer = setTimeout(() => {
        setIsWalletRewardNotificationVisible(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isWalletRewardNotificationVisible])

  useEffect(() => {
    const topup = searchParams.get("topup")
    const message = searchParams.get("message")
    if (topup === "success") {
      toast.success(message || "Wallet topped up successfully")
      if (agent?.id) loadWalletData(agent.id)
      router.replace("/agent/wallet")
    } else if (topup === "failed") {
      toast.error(message || "Top-up failed")
      router.replace("/agent/wallet")
    }
  }, [searchParams, agent?.id, router])

  const loadWalletData = async (agentId: string) => {
    try {

      const sessionAgent = getCurrentAgent()
      const authHeaders: Record<string, string> = {}
      if (sessionAgent) {
        authHeaders.Authorization = `Bearer ${btoa(JSON.stringify(sessionAgent))}`
      }

      const [balancesResult, transactionHistory, withdrawalsResult] = await Promise.allSettled([
        getAgentDisplayBalances(agentId),
        fetchWalletTransactions(agentId, 100),
        fetch(`/api/agent/withdrawals?agentId=${encodeURIComponent(agentId)}&status=pending`, {
          headers: authHeaders,
          cache: "no-store",
        }).then((r) => (r.ok ? r.json() : { pendingWithdrawals: [] })),
      ])

      let finalBalance = 0
      let finalSummary = {
        walletBalance: 0,
        totalTopups: 0,
        totalCommissions: 0,
        availableCommissions: 0,
        totalWithdrawals: 0,
        totalDeductions: 0,
        pendingTransactions: 0,
        lastTransactionDate: null,
      }

      if (balancesResult.status === "fulfilled") {
        const balances = balancesResult.value
        finalBalance = balances.wallet_balance
        finalSummary = {
          walletBalance: balances.wallet_balance,
          totalTopups: 0,
          totalCommissions: balances.total_commission_earned,
          availableCommissions: balances.commission_balance,
          totalWithdrawals: balances.total_paid_out,
          totalDeductions: 0,
          pendingTransactions: balances.pending_payout,
          pendingWithdrawal: balances.pending_payout,
          lastTransactionDate: null,
        }
      } else {
        console.warn("[v0] Display balances failed:", balancesResult.reason)
      }

      if (withdrawalsResult.status === "fulfilled") {
        setPendingCommissionWithdrawals(withdrawalsResult.value.pendingWithdrawals || [])
      } else {
        setPendingCommissionWithdrawals([])
      }

      let finalTransactionHistory: any[] = []
      if (transactionHistory.status === "fulfilled") {
        finalTransactionHistory = transactionHistory.value || []
      } else {
        console.warn("[v0] Transaction history API failed:", transactionHistory.reason)
      }


      setWalletBalance(finalBalance)
      setWalletSummary(finalSummary)
      setTransactions(finalTransactionHistory || [])
    } catch (error) {
      console.error("[v0] Critical error loading wallet data:", error)

      let errorMessage = "Unable to load wallet information. "
      if (error instanceof Error) {
        if (error.message.includes("network") || error.message.includes("connection")) {
          errorMessage += "Please check your internet connection and try again."
        } else if (error.message.includes("permission") || error.message.includes("unauthorized")) {
          errorMessage += "Please log in again to access your wallet."
        } else {
          errorMessage += "Please refresh the page and try again."
        }
      } else {
        errorMessage += "Please refresh the page and try again."
      }

      alert(errorMessage)
      await loadTransactionsFallback(agentId)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactionsFallback = async (agentId: string) => {
    try {

      const transactions = await fetchWalletTransactions(agentId, 100)
      setTransactions(transactions)

      const balance = await getAgentDisplayBalances(agentId).then((b) => b.wallet_balance).catch(() => {
        let manualBalance = 0
        transactions.forEach((transaction) => {
          if (transaction.status === "approved") {
            switch (transaction.transaction_type) {
              case "topup":
              case "refund":
              case "adjustment":
              case "credit":
              case "deposit":
              case "interest":
              case "payment_completed":
                manualBalance += Number(transaction.amount) || 0
                break
              case "deduction":
              case "withdrawal_deduction":
              case "debit":
              case "withdrawal":
              case "penalty":
                manualBalance -= Number(transaction.amount) || 0
                break
              case "commission_deposit":
                break
            }
          }
        })
        return Math.max(manualBalance, 0)
      })

      setWalletBalance(balance)
    } catch (error) {
      console.error("[v0] Fallback loading failed:", error)
      setWalletBalance(0)
      setTransactions([])
      setWalletSummary({
        walletBalance: 0,
        totalTopups: 0,
        totalCommissions: 0,
        totalWithdrawals: 0,
        totalDeductions: 0,
        pendingTransactions: 0,
        lastTransactionDate: null,
      })
      alert("Unable to load wallet information. Please contact support if this persists.")
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.reference_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.transaction_type === typeFilter)
    }

    setFilteredTransactions(filtered)
  }

  const refreshWalletBalance = async () => {
    if (!agent) return

    try {
      const balances = await getAgentDisplayBalances(agent.id)

      setWalletBalance(balances.wallet_balance)
      setWalletSummary({
        walletBalance: balances.wallet_balance,
        totalTopups: 0,
        totalCommissions: balances.total_commission_earned,
        availableCommissions: balances.commission_balance,
        totalWithdrawals: balances.total_paid_out,
        totalDeductions: 0,
        pendingTransactions: balances.pending_payout,
        lastTransactionDate: null,
      })
    } catch (error) {
      console.error("Error refreshing wallet balance:", error)
    }
  }

  const paystackTopUp = async () => {
    if (!agent || paystackProcessing) return
    const amount = Number.parseFloat(topUpAmount)
    if (!Number.isFinite(amount) || amount < WALLET_TOPUP_PAYSTACK_MIN_GHS) {
      toast.error(`Paystack top-up requires at least GH₵${WALLET_TOPUP_PAYSTACK_MIN_GHS}`)
      return
    }

    setPaystackProcessing(true)
    try {
      const res = await fetch("/api/paystack/wallet-topup/initialize", {
        method: "POST",
        headers: {
          ...getAgentAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          email: agent.email,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || "Could not start Paystack payment")
      }

      await openPaystackCheckout({
        accessCode: data.access_code,
        authorizationUrl: data.authorization_url,
        onSuccess: (reference) => {
          window.location.href = `/api/paystack/wallet-topup/callback?reference=${encodeURIComponent(reference)}`
        },
        onClose: () => setPaystackProcessing(false),
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Paystack failed")
      setPaystackProcessing(false)
    }
  }

  const submitTopUp = async () => {
    if (!agent || !topUpAmount || !paymentReference || submitting || submitLockRef.current) return

    const amount = Number.parseFloat(topUpAmount)
    if (amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amount < MIN_TOPUP_AMOUNT) {
      toast.error(`Minimum top-up amount is GH₵ ${MIN_TOPUP_AMOUNT}`)
      return
    }

    const trimmedReference = paymentReference.trim()
    if (!trimmedReference) {
      toast.error("Please enter your payment reference")
      return
    }

    if (trimmedReference.length < MIN_REFERENCE_LENGTH) {
      toast.error(`Reference must be at least ${MIN_REFERENCE_LENGTH} characters`)
      return
    }

    if (!referenceValidation.isValid && referenceValidation.message) {
      toast.error(referenceValidation.message)
      return
    }

    submitLockRef.current = true
    setSubmitting(true)
    try {
      const res = await fetch("/api/agent/wallet/topup/manual", {
        method: "POST",
        headers: {
          ...getAgentAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          payment_reference: trimmedReference,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          const suggestedCode = generateReferenceCode()
          setReferenceValidation({
            isValid: false,
            message: "This reference code has already been used",
            suggestedCode,
          })
        }
        throw new Error(data.error || "Failed to submit top-up request")
      }

      toast.success(data.message || "Top-up submitted! Admin will credit your wallet after verification.")
      setShowTopUpDialog(false)
      setTopUpAmount("")
      setPaymentReference("")
      setReferenceValidation({ isValid: true, message: "" })
      await loadWalletData(agent.id)
    } catch (error) {
      console.error("Error submitting top-up:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(errorMessage)
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  const topUpAmountNum = Number.parseFloat(topUpAmount) || 0
  const showPaystackOption = topUpAmountNum >= WALLET_TOPUP_PAYSTACK_MIN_GHS
  const paystackFees = showPaystackOption ? calculateWalletTopupPaystackFees(topUpAmountNum) : null

  const downloadCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to download")
      return
    }

    const headers = ["Date", "Time", "Type", "Description", "Amount (GH₵)", "Status", "Reference Code", "Admin Notes"]

    const csvData = filteredTransactions.map((transaction) => [
      new Date(transaction.created_at).toLocaleDateString(),
      new Date(transaction.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      transaction.transaction_type === "topup"
        ? "Top-up"
        : transaction.transaction_type === "deduction"
          ? "Purchase"
          : "Refund",
      transaction.description,
      (transaction.amount || 0).toFixed(2),
      transaction.status,
      transaction.reference_code,
      transaction.admin_notes || "",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `wallet-transactions-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending") return <Clock className="h-4 w-4 text-amber-600" />
    if (status === "rejected") return <X className="h-4 w-4 text-red-600" />

    switch (type) {
      case "topup":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "commission_deposit":
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case "deduction":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "withdrawal_deduction":
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      case "refund":
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case "adjustment":
      case "credit":
      case "deposit":
      case "interest":
      case "payment_completed":
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case "debit":
      case "withdrawal":
      case "penalty":
        return <TrendingDown className="h-4 w-4 text-purple-600" />
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAmountColor = (type: string, status: string) => {
    if (status === "rejected") return "text-gray-500"

    switch (type) {
      case "topup":
      case "refund":
      case "commission_deposit":
      case "adjustment":
      case "credit":
      case "deposit":
      case "interest":
      case "payment_completed":
        return "text-green-600"
      case "deduction":
      case "withdrawal_deduction":
      case "debit":
      case "withdrawal":
      case "penalty":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "topup":
        return "Top-up"
      case "commission_deposit":
        return "Commission"
      case "deduction":
        return "Purchase"
      case "withdrawal_deduction":
        return "Withdrawal"
      case "refund":
        return "Refund"
      case "adjustment":
        return "Adjustment"
      case "credit":
        return "Credit"
      case "debit":
        return "Debit"
      case "deposit":
        return "Deposit"
      case "withdrawal":
        return "Withdrawal"
      case "penalty":
        return "Penalty"
      case "interest":
        return "Interest"
      case "payment_completed":
        return "Payment completed"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  // Function to handle WhatsApp redirect with default message
  const handleWhatsAppRedirect = () => {
    const message = encodeURIComponent("I want to load 500 Cedis and above to qualify for the Wallet Topup Reward")
    window.open(`https://wa.me/233246827049?text=${message}`, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading wallet information...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Clean Green Slide-up Notification matching page header */}
        {showWalletRewardNotification && (
          <div
            className={`
              fixed bottom-0 left-0 right-0 z-[55] transform transition-all duration-500 ease-out
              ${isWalletRewardNotificationVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}
              shadow-2xl pb-[max(5.5rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]
            `}
          >
            <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 border-t-4 border-emerald-700">
              <button
                type="button"
                onClick={() => {
                  setIsWalletRewardNotificationVisible(false)
                  setTimeout(() => setShowWalletRewardNotification(false), 300)
                }}
                className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 hover:bg-black/35 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Close notification"
              >
                <X className="h-5 w-5 text-white" />
              </button>

              <div className="container mx-auto px-4">
                <div className="py-5 md:py-6 pr-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                  {/* Left side - Content */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                      <h3 className="text-lg font-bold text-white drop-shadow-lg">💰 Wallet Top-up Rewards</h3>
                    </div>
                    
                    <p className="text-emerald-100 mb-3 text-sm md:text-base">
                      Fund your wallet with <span className="font-semibold text-white">500 GHS or more</span> and earn extra rewards when you pay from wallet!
                    </p>
                    
                    {/* Clean Reward Structure */}
                    <div className="bg-emerald-500/20 backdrop-blur-sm rounded-lg p-3 mb-3 border border-emerald-400/30">
                      <p className="text-sm font-medium text-white mb-2">Reward Structure:</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/10 rounded border border-emerald-300/30 p-2 text-center">
                          <p className="text-xs font-bold text-white">500-1,000 GHS</p>
                          <p className="text-xs text-emerald-200 font-medium">+5-7 GHS Reward</p>
                        </div>
                        <div className="bg-white/10 rounded border border-emerald-300/30 p-2 text-center">
                          <p className="text-xs font-bold text-white">2,000-4,900 GHS</p>
                          <p className="text-xs text-emerald-200 font-medium">+7-10 GHS Reward</p>
                        </div>
                        <div className="bg-white/10 rounded border border-emerald-300/30 p-2 text-center">
                          <p className="text-xs font-bold text-white">5,000+ GHS</p>
                          <p className="text-xs text-emerald-200 font-medium">+10-30 GHS Reward</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-emerald-200">
                      Minimum 500 GHS to qualify • Rewards applied automatically after payment
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex w-full md:w-auto items-center justify-center md:justify-end">
                    <Button
                      onClick={handleWhatsAppRedirect}
                      size="lg"
                      className="w-full md:w-auto bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-5 md:px-6 py-4 md:py-5 text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-200 border border-white/30 rounded-lg flex items-center justify-center gap-2 group"
                    >
                      <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                      Request Top-up
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Subtle animated border */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-white to-transparent">
                <div className="h-full w-1/3 bg-emerald-200 animate-slide-right"></div>
              </div>
            </div>

            {/* Animation styles */}
            <style jsx>{`
              @keyframes slide-right {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(300%); }
              }
              .animate-slide-right {
                animation: slide-right 8s ease-in-out infinite;
              }
            `}</style>
          </div>
        )}

        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl border-b-4 border-emerald-700">
            <div className="container mx-auto px-4 py-4 sm:py-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 shrink-0"
                    >
                      <Link href="/agent/dashboard">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Back to Dashboard</span>
                        <span className="sm:hidden">Back</span>
                      </Link>
                    </Button>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">My Wallet</h1>
                      <p className="text-emerald-100 font-medium text-sm sm:text-base">
                        Manage your wallet balance and transactions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Updated Wallet Balance Section with Summary */}
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-1">Wallet Balance</p>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl sm:text-3xl font-bold text-white">GH₵ {walletBalance.toFixed(2)}</span>
                        <Button
                          onClick={refreshWalletBalance}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20 p-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-emerald-100 text-xs sm:text-sm mt-1">Available for data bundle purchases</p>

                      {/* Show wallet summary if available */}
                      {walletSummary && (walletSummary.pendingTransactions || 0) > 0 && (
                        <div className="mt-2 text-xs text-emerald-100">
                          <p>Pending Transactions: {walletSummary.pendingTransactions || 0}</p>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => setShowTopUpDialog(true)}
                      className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Top Up Wallet
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
            {/* CRITICAL FIX: Enhanced Wallet Summary Cards with proper relationships */}
            <div className="mb-6 sm:mb-8">
              <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Commission For Withdraw</p>
                      <p className="text-2xl sm:text-3xl font-bold">
                        GH₵ {(walletSummary?.availableCommissions || 0).toFixed(2)}
                      </p>
                      <p className="text-emerald-200 text-xs mt-1">Available for withdrawal</p>
                      {(walletSummary?.pendingWithdrawal ?? 0) > 0 && (
                        <p className="text-amber-200 text-xs mt-2">
                          GH₵ {Number(walletSummary.pendingWithdrawal).toFixed(2)} locked in pending payout
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-emerald-400/30 rounded-full p-3">
                        <DollarSign className="h-10 w-10 text-emerald-200" />
                      </div>
                      <Link href="/agent/withdraw">
                        <Button size="sm" variant="secondary" className="bg-white/90 text-emerald-700">
                          Request Withdrawal
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {pendingCommissionWithdrawals.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/90 mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-900 text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Commission Withdrawals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingCommissionWithdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="flex flex-wrap justify-between items-center gap-2 text-sm border-b border-amber-100 pb-2 last:border-0"
                      >
                        <span className="text-amber-800 capitalize">{w.status}</span>
                        <span className="font-medium text-amber-900">GH₵ {Number(w.amount).toFixed(2)}</span>
                        <span className="text-amber-600 text-xs">
                          {new Date(w.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Updated Transaction History with new transaction types */}
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Complete Transaction History
                    </CardTitle>
                    <CardDescription className="text-emerald-600">
                      View all your wallet transactions including commissions, top-ups, and withdrawals
                    </CardDescription>
                  </div>
                  <Button
                    onClick={downloadCSV}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>

                {/* Updated Filters to include new transaction types */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="topup">Top-ups</SelectItem>
                      <SelectItem value="commission_deposit">Commissions</SelectItem>
                      <SelectItem value="deduction">Purchases</SelectItem>
                      <SelectItem value="withdrawal_deduction">Withdrawals</SelectItem>
                      <SelectItem value="refund">Refunds</SelectItem>
                      <SelectItem value="adjustment">Adjustments / admin credits</SelectItem>
                      <SelectItem value="debit">Debits / admin debits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">No Transactions Found</h3>
                    <p className="text-emerald-600 mb-6">
                      {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                        ? "No transactions match your current filters."
                        : "Your wallet transactions will appear here."}
                    </p>
                    <Button
                      onClick={() => setShowTopUpDialog(true)}
                      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Make Your First Top-up
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-emerald-50 hover:bg-emerald-50">
                            <TableHead className="text-emerald-800 font-semibold">Date</TableHead>
                            <TableHead className="text-emerald-800 font-semibold">Type</TableHead>
                            <TableHead className="text-emerald-800 font-semibold">Description</TableHead>
                            <TableHead className="text-emerald-800 font-semibold">Source Details</TableHead>
                            <TableHead className="text-emerald-800 font-semibold">Amount</TableHead>
                            <TableHead className="text-emerald-800 font-semibold">Status</TableHead>
                            <TableHead className="text-emerald-800 font-semibold">Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((transaction) => (
                            <TableRow key={transaction.id} className="hover:bg-emerald-50/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-emerald-500" />
                                  <div>
                                    <div className="font-medium text-emerald-800">
                                      {new Date(transaction.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-emerald-600">
                                      {new Date(transaction.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(transaction.transaction_type, transaction.status)}
                                  <span className="capitalize font-medium text-emerald-800">
                                    {getTransactionTypeLabel(transaction.transaction_type)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  <p className="text-emerald-800 text-sm">{transaction.description}</p>
                                  {transaction.admin_notes && (
                                    <p className="text-xs text-emerald-600 mt-1">Admin: {transaction.admin_notes}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm space-y-1">
                                  {transaction.source_type && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-600 font-medium">Type:</span>
                                      <span className="text-emerald-800">{transaction.source_type}</span>
                                    </div>
                                  )}
                                  {transaction.source_id && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-600 font-medium">Contact:</span>
                                      <span className="text-emerald-800 font-mono text-xs">{transaction.source_id}</span>
                                    </div>
                                  )}
                                  {!transaction.source_type && !transaction.source_id && (
                                    <span className="text-gray-400 text-xs">No source details</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`font-semibold ${getAmountColor(transaction.transaction_type, transaction.status)}`}
                                >
                                  {["topup", "refund", "commission_deposit", "adjustment", "credit", "deposit", "interest", "payment_completed"].includes(
                                    transaction.transaction_type,
                                  )
                                    ? "+"
                                    : "-"}
                                  GH₵ {(transaction.amount || 0).toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(transaction.status)}>
                                  {transaction.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {transaction.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                  {transaction.status === "rejected" && <X className="h-3 w-3 mr-1" />}
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-emerald-50 px-2 py-1 rounded text-emerald-700">
                                  {transaction.reference_code}
                                </code>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards - Updated with source details */}
                    <div className="lg:hidden space-y-4">
                      {filteredTransactions.map((transaction) => (
                        <Card key={transaction.id} className="border-emerald-200 bg-white shadow-sm">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(transaction.transaction_type, transaction.status)}
                                  <div>
                                    <p className="font-medium text-emerald-800 capitalize">
                                      {getTransactionTypeLabel(transaction.transaction_type)}
                                    </p>
                                    <p className="text-xs text-emerald-600">
                                      {new Date(transaction.created_at).toLocaleDateString()} •{" "}
                                      {new Date(transaction.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`font-semibold ${getAmountColor(transaction.transaction_type, transaction.status)}`}
                                  >
                                    {["topup", "refund", "commission_deposit", "adjustment", "credit", "deposit", "interest", "payment_completed"].includes(
                                      transaction.transaction_type,
                                    )
                                      ? "+"
                                      : "-"}
                                    GH₵ {(transaction.amount || 0).toFixed(2)}
                                  </p>
                                  <Badge className={`${getStatusColor(transaction.status)} text-xs`}>
                                    {transaction.status}
                                  </Badge>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-emerald-800">{transaction.description}</p>
                                {transaction.admin_notes && (
                                  <p className="text-xs text-emerald-600 mt-1">Admin: {transaction.admin_notes}</p>
                                )}
                              </div>

                              {/* Source Details Section */}
                              {(transaction.source_type || transaction.source_id) && (
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                  <p className="text-xs font-semibold text-emerald-700 mb-2">Source Details:</p>
                                  <div className="space-y-1">
                                    {transaction.source_type && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-emerald-600">Bundle Type:</span>
                                        <span className="text-xs text-emerald-800 font-medium">
                                          {transaction.source_type}
                                        </span>
                                      </div>
                                    )}
                                    {transaction.source_id && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-emerald-600">Customer Contact:</span>
                                        <span className="text-xs text-emerald-800 font-mono">{transaction.source_id}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t border-emerald-100">
                                <p className="text-xs text-emerald-600">
                                  Reference:{" "}
                                  <code className="bg-emerald-50 px-1 py-0.5 rounded text-emerald-700">
                                    {transaction.reference_code}
                                  </code>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Top-up Dialog — mobile-friendly bottom sheet */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="w-[calc(100vw-0.75rem)] max-w-md gap-0 border-emerald-200 bg-white p-0 overflow-hidden max-h-[92dvh] flex flex-col sm:max-h-[90vh] sm:rounded-lg sm:p-0 [&>button]:text-gray-600 [&>button]:hover:text-gray-900 [&>button]:hover:bg-gray-100 [&>button]:right-3 [&>button]:top-3 max-sm:fixed max-sm:left-1/2 max-sm:top-auto max-sm:bottom-2 max-sm:translate-x-[-50%] max-sm:translate-y-0 max-sm:rounded-2xl">
          <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pb-2 sm:px-5 border-b border-emerald-100">
            <DialogTitle className="text-base sm:text-lg text-emerald-800 flex items-center gap-2">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Top Up Wallet
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-emerald-600">
              Paystack (GH₵{WALLET_TOPUP_PAYSTACK_MIN_GHS}+) or manual MoMo (GH₵{MIN_TOPUP_AMOUNT}+).
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 space-y-3">
            <Alert className="border-amber-200 bg-amber-50 py-2">
              <Info className="h-3.5 w-3.5 text-amber-600" />
              <AlertDescription className="text-amber-800 text-xs leading-relaxed">
                <strong>MoMo:</strong> 0557943392 then submit reference.{" "}
                <strong>Paystack:</strong> instant credit from GH₵{WALLET_TOPUP_PAYSTACK_MIN_GHS}.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="amount" className="text-emerald-700">
                Amount (GH₵)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={MIN_TOPUP_AMOUNT}
                placeholder={`Minimum: ${MIN_TOPUP_AMOUNT}.00`}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500"
              />
              <p className="text-xs text-emerald-600 mt-1">Minimum top-up amount is GH₵ {MIN_TOPUP_AMOUNT}</p>
            </div>

            {showPaystackOption && paystackFees && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                <p className="text-sm font-semibold text-indigo-900">Paystack top-up</p>
                <div className="rounded-md border border-indigo-200 bg-white/80 p-2.5 text-xs sm:text-sm space-y-1">
                  <div className="flex justify-between text-indigo-900">
                    <span>Wallet credit</span>
                    <span className="font-semibold">GH₵{paystackFees.wallet_credit_ghs.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Fee (~{(PAYSTACK_LOCAL_FEE_RATE * 100).toFixed(2)}%)</span>
                    <span>+ GH₵{paystackFees.paystack_fee_ghs.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-indigo-100 pt-1.5 font-semibold text-indigo-950">
                    <span>You pay</span>
                    <span>GH₵{paystackFees.total_payable_ghs.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                  disabled={paystackProcessing}
                  onClick={paystackTopUp}
                >
                  {paystackProcessing
                    ? "Opening Paystack…"
                    : `Pay GH₵${paystackFees.total_payable_ghs.toFixed(2)}`}
                </Button>
              </div>
            )}

            {!showPaystackOption && topUpAmountNum > 0 && topUpAmountNum < WALLET_TOPUP_PAYSTACK_MIN_GHS && (
              <p className="text-xs text-slate-600">
                Enter GH₵{WALLET_TOPUP_PAYSTACK_MIN_GHS} or more to unlock Paystack top-up. Use manual MoMo below for smaller amounts.
              </p>
            )}

            <div className="border-t border-emerald-100 pt-2">
              <p className="text-xs sm:text-sm font-semibold text-emerald-800 mb-2">Manual MoMo</p>
            </div>

            <div>
              <Label htmlFor="reference" className="text-emerald-700">
                Payment reference (MoMo)
              </Label>
              <div className="space-y-2">
                <Input
                  id="reference"
                  placeholder="Transaction ID from your MoMo payment"
                  value={paymentReference}
                  onChange={(e) => handleReferenceChange(e.target.value)}
                  disabled={submitting}
                  className={
                    referenceValidation.isValid
                      ? "border-emerald-200 focus:border-emerald-500"
                      : "border-red-300 focus:border-red-500"
                  }
                />

                {/* Character Counter */}
                <div className="flex justify-between items-center text-xs">
                  <span
                    className={
                      paymentReference.trim().length >= MIN_REFERENCE_LENGTH ? "text-emerald-600" : "text-amber-600"
                    }
                  >
                    {paymentReference.trim().length}/{MIN_REFERENCE_LENGTH} characters minimum
                  </span>
                  {referenceValidation.message && (
                    <span className={referenceValidation.isValid ? "text-emerald-600" : "text-red-600"}>
                      {referenceValidation.message}
                    </span>
                  )}
                </div>

                {/* Suggested Code */}
                {referenceValidation.suggestedCode && !referenceValidation.isValid && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800 mb-2">💡 Suggested reference code:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-sm flex-1">
                        {referenceValidation.suggestedCode}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        onClick={useSuggestedCode}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Enter the same reference ID you used when sending the MoMo payment (minimum {MIN_REFERENCE_LENGTH}{" "}
                characters)
              </p>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-emerald-100 bg-white px-4 py-3 sm:px-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTopUpDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submitTopUp}
              disabled={submitting || paystackProcessing || !topUpAmount || !paymentReference}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 flex-1 sm:flex-none"
            >
              {submitting ? "Submitting…" : "Submit manual"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}