"use client"

import type React from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useMemo, memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { supabase, type Agent } from "@/lib/supabase"
import { createSafeWalletTransactionWithRef } from "@/lib/wallet-transaction-types"
import { getStoredAdmin } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Wallet,
  Search,
  Filter,
  Plus,
  Download,
  Check,
  Ban,
  Trash2,
  TrendingUp,
  RefreshCw,
  DollarSign,
} from "lucide-react"
import { FloatingRefreshButton } from "@/components/admin/FloatingRefreshButton"
import { connectionManager } from "@/lib/connection-manager"
import { reverseWalletTopup } from "@/lib/wallet-reversal" // Declare the variable here

interface WalletsTabProps {
  getCachedData: () => any[] | undefined
  setCachedData: (data: any[]) => void
}

// CRITICAL FIX: Add proper transaction type labeling function
const getTransactionTypeLabel = (transaction: any): string => {
  const type = transaction.transaction_type?.toLowerCase()

  switch (type) {
    case "topup":
      return "Wallet Top-up"
    case "deduction":
      return "Purchase/Order Payment"
    case "refund":
      return "Refund"
    case "commission":
    case "commission_deposit":
      return "Commission Deposit"
    case "withdrawal_deduction":
      return "Withdrawal"
    case "admin_adjustment":
      return "Admin Adjustment"
    default:
      // Fallback: try to determine from description
      const description = transaction.description?.toLowerCase() || ""
      if (description.includes("top-up") || description.includes("topup")) {
        return "Wallet Top-up"
      } else if (description.includes("wholesale") || description.includes("order")) {
        return "Order Payment"
      } else if (description.includes("commission")) {
        return "Commission"
      } else if (description.includes("refund")) {
        return "Refund"
      } else if (description.includes("withdrawal")) {
        return "Withdrawal"
      }
      return "Transaction"
  }
}
// CRITICAL FIX: Add proper transaction type icon function
const getTransactionTypeIcon = (transaction: any) => {
  const type = transaction.transaction_type?.toLowerCase()

  switch (type) {
    case "topup":
      return <Plus className="h-5 w-5 text-green-600" />
    case "deduction":
      return <TrendingUp className="h-5 w-5 text-blue-600 rotate-180" />
    case "refund":
      return <RefreshCw className="h-5 w-5 text-purple-600" />
    case "commission":
    case "commission_deposit":
      return <DollarSign className="h-5 w-5 text-emerald-600" />
    case "withdrawal_deduction":
      return <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
    case "admin_adjustment":
      return <TrendingUp className="h-5 w-5 text-gray-600" />
    default:
      return <Wallet className="h-5 w-5 text-gray-600" />
  }
}

// Memoize the wallet transaction card component
const WalletTransactionCard = memo(({ transaction, onApprove, onReject, onReverse }: any) => (
  <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
    <CardContent className="pt-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-emerald-800 text-lg flex items-center gap-2">
              {getTransactionTypeIcon(transaction)}
              {getTransactionTypeLabel(transaction)}
            </h3>
            <Badge
              className={
                transaction.status === "pending"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : transaction.status === "approved"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-red-100 text-red-800 border-red-200"
              }
            >
              {transaction.status}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
))

export default memo(function WalletsTab({ getCachedData, setCachedData }: WalletsTabProps) {
  const [walletTransactions, setWalletTransactions] = useState<any[]>([])
  const [walletTopups, setWalletTopups] = useState<any[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredWalletTransactions, setFilteredWalletTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [walletSearchTerm, setWalletSearchTerm] = useState("")
  const [walletFilterAdmin, setWalletFilterAdmin] = useState("All Transactions")
  const [currentWalletsPage, setCurrentWalletsPage] = useState(1)
  const [totalWalletTransactions, setTotalWalletTransactions] = useState(0)
  const [showWalletTopupDialog, setShowWalletTopupDialog] = useState(false)
  const [walletTopupForm, setWalletTopupForm] = useState({
    agentId: "",
    amount: "",
    searchTerm: "",
    selectedAgentName: "",
  })
  const [agentLiveBalances, setAgentLiveBalances] = useState<Map<string, number>>(new Map())
  const [totalSystemWalletBalance, setTotalSystemWalletBalance] = useState(0)
  const itemsPerPage = 12
  const admin = getStoredAdmin()
  const [agentsLoaded, setAgentsLoaded] = useState(false) // Track if agents have been loaded
  const [error, setError] = useState<string | null>(null)
  const [showReversalDialog, setShowReversalDialog] = useState(false)
  const [selectedTopupForReversal, setSelectedTopupForReversal] = useState<any>(null)
  const [agentSearchTerm, setAgentSearchTerm] = useState("")
  const [searchedAgent, setSearchedAgent] = useState<Agent | null>(null)
  const [agentSearchLoading, setAgentSearchLoading] = useState(false)

  const searchAgentForReport = async () => {
    if (!agentSearchTerm.trim()) {
      setSearchedAgent(null)
      return
    }

    setAgentSearchLoading(true)
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("id, full_name, phone_number, wallet_balance, total_commission_earned")
        .or(`full_name.ilike.%${agentSearchTerm}%,phone_number.ilike.%${agentSearchTerm}%`)
        .limit(1)
        .single()

      if (error) throw error

      setSearchedAgent(data)
    } catch (error) {
      console.error("Error searching for agent:", error)
      setSearchedAgent(null)
      alert("Agent not found")
    } finally {
      setAgentSearchLoading(false)
    }
  }

  const downloadAgentSpecificReport = async (agentId: string, agentName: string) => {
    try {
      setLoading(true)
      console.log("Downloading report for agent:", agentName)

      const { data: transactions, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const headers = [
        "Date",
        "Type",
        "Amount (GH₵)",
        "Description",
        "Reference",
        "Status",
        "Notes",
      ]

      const csvData = (transactions || []).map((t) => [
        new Date(t.created_at).toLocaleDateString(),
        t.transaction_type,
        t.amount,
        t.description,
        t.reference_code,
        t.status,
        t.admin_notes || "",
      ])

      const csvContent =
        [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      const summaryInfo = [
        `# AGENT REPORT: ${agentName}`,
        `# Generated: ${new Date().toLocaleString()}`,
        `# Total Transactions: ${transactions?.length || 0}`,
        ``,
      ].join("\n")

      const finalCsv = summaryInfo + "\n" + csvContent

      const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `agent-report-${agentName}-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert(`Report downloaded for ${agentName}`)
    } catch (error) {
      console.error("Error downloading agent report:", error)
      alert("Failed to download report")
    } finally {
      setLoading(false)
    }
  }

  const loadNextWalletsPage = async (page: number) => {
    try {
      setError(null)
      const offset = (page - 1) * itemsPerPage
      const { batchCalculateAgentEarnings, calculateWalletBalance } = await import("@/lib/earnings-calculator")

      const {
        data,
        count,
        error: queryError,
      } = await supabase
        .from("wallet_transactions")
        .select(
          `id, amount, transaction_type, description, status, created_at, reference_code, admin_notes, agent_id, agents!inner(id, full_name, phone_number)`,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + itemsPerPage - 1)

      if (queryError) throw queryError

      // OPTIMIZATION: Use batch calculation for multiple agents on this page
      const pageAgentIds = Array.from(new Set(data?.map((t: any) => t.agent_id) || []))
      let calculatedPageBalances = new Map<string, number>()
      
      if (pageAgentIds.length > 0) {
        try {
          // Use optimized batch calculation
          const earningsMap = await batchCalculateAgentEarnings(pageAgentIds)
          pageAgentIds.forEach((agentId) => {
            const earnings = earningsMap.get(agentId)
            calculatedPageBalances.set(agentId, earnings?.walletBalance || 0)
          })
        } catch (batchError) {
          console.warn("Batch calculation failed, falling back to parallel individual calculations:", batchError)
          // Fallback: calculate individually in parallel
          const balancePromises = pageAgentIds.map(async (agentId) => {
            try {
              const balance = await calculateWalletBalance(agentId)
              return { agentId, balance }
            } catch (error) {
              console.warn(`Failed to calculate balance for agent ${agentId}:`, error)
              return { agentId, balance: 0 }
            }
          })
          const results = await Promise.all(balancePromises)
          results.forEach(({ agentId, balance }) => {
            calculatedPageBalances.set(agentId, balance)
          })
        }
      }
      
      // CRITICAL: Merge new page balances with existing balances in state
      setAgentLiveBalances((prevBalances) => new Map([...prevBalances, ...calculatedPageBalances]))
      
      // Enhance with live balances
      const enhancedData = (data || []).map((transaction: any) => ({
        ...transaction,
        agents: {
          ...transaction.agents,
          wallet_balance: calculatedPageBalances.get(transaction.agent_id) || 0
        }
      }))

      setWalletTransactions(enhancedData)
      setTotalWalletTransactions(count || 0)
      setCachedData(enhancedData)
    } catch (error) {
      console.error("Error loading wallet transactions page:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to load wallet transactions"
      setError(errorMsg)
    }
  }

  const loadAgentsForTopup = async () => {
    if (agentsLoaded) return // Don't reload if already loaded
    try {
      const { data, error } = await supabase.from("agents").select("*").order("full_name", { ascending: true })
      if (error) throw error
      
      const agentsList = data || []
      setAgents(agentsList)
      
      // CRITICAL FIX: Calculate live wallet balances for all agents in the topup dialog
      const { batchCalculateAgentEarnings } = await import("@/lib/earnings-calculator")
      
      const agentIds = agentsList.map((a) => a.id)
      if (agentIds.length > 0) {
        try {
          const earningsMap = await batchCalculateAgentEarnings(agentIds)
          const liveBalances = new Map<string, number>()
          agentIds.forEach((agentId) => {
            const earnings = earningsMap.get(agentId)
            liveBalances.set(agentId, earnings?.walletBalance || 0)
          })
          setAgentLiveBalances(liveBalances)
        } catch (calcError) {
          console.warn("Failed to calculate live balances:", calcError)
          // Still proceed with the dialog even if live balance calculation fails
        }
      }
      
      setAgentsLoaded(true)
    } catch (error) {
      console.error("Error loading agents:", error)
    }
  }

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setError(null)
        const cachedData = getCachedData()
        if (cachedData) {
          setWalletTransactions(cachedData)
          setLoading(false)
          return
        }
        try {
          const { calculateWalletBalance, batchCalculateAgentEarnings } = await import("@/lib/earnings-calculator")

          // CRITICAL FIX: Calculate live wallet balances for each agent instead of using stored balance
          const [walletData, topupsData] = await Promise.all([
            supabase
              .from("wallet_transactions")
              .select(
                `id, amount, transaction_type, description, status, created_at, reference_code, admin_notes, agent_id, agents!inner(id, full_name, phone_number)`,
                { count: "exact" },
              )
              .order("created_at", { ascending: false })
              .range(0, 11),
            supabase
              .from("wallet_topups")
              .select(`*, agents!inner(id, full_name, phone_number)`)
              .order("created_at", { ascending: false })
              .range(0, 11),
          ])

          // OPTIMIZATION: Use batch calculation for multiple agents instead of sequential calls
          const walletAgentIds = Array.from(new Set(walletData.data?.map((t: any) => t.agent_id) || []))
          
          let calculatedAgentLiveBalances = new Map<string, number>()
          
          if (walletAgentIds.length > 0) {
            try {
              // Use optimized batch calculation
              const earningsMap = await batchCalculateAgentEarnings(walletAgentIds)
              walletAgentIds.forEach((agentId) => {
                const earnings = earningsMap.get(agentId)
                calculatedAgentLiveBalances.set(agentId, earnings?.walletBalance || 0)
              })
            } catch (batchError) {
              console.warn("Batch calculation failed, falling back to individual calculations:", batchError)
              // Fallback: calculate individually in parallel
              const balancePromises = walletAgentIds.map(async (agentId) => {
                try {
                  const balance = await calculateWalletBalance(agentId)
                  return { agentId, balance }
                } catch (error) {
                  console.warn(`Failed to calculate balance for agent ${agentId}:`, error)
                  return { agentId, balance: 0 }
                }
              })
              const results = await Promise.all(balancePromises)
              results.forEach(({ agentId, balance }) => {
                calculatedAgentLiveBalances.set(agentId, balance)
              })
            }
          }
          
          // CRITICAL: Update component state with calculated live balances
          setAgentLiveBalances(calculatedAgentLiveBalances)
          
          // Enhance transaction data with live balances
          const enhancedWalletData = walletData.data?.map((transaction: any) => ({
            ...transaction,
            agents: {
              ...transaction.agents,
              wallet_balance: calculatedAgentLiveBalances.get(transaction.agent_id) || 0
            }
          })) || []

          if (walletData.error) throw walletData.error
          if (topupsData.error) throw topupsData.error

          setTotalWalletTransactions(walletData.count || 0)

          setWalletTransactions(enhancedWalletData)
          setWalletTopups(topupsData.data || [])
          setCachedData(enhancedWalletData)
        } catch (innerError) {
          console.error("Error loading wallet data:", innerError)
          const errorMsg = innerError instanceof Error ? innerError.message : "Failed to load wallet data"
          setError(errorMsg)
        }
      } finally {
        setLoading(false)
      }
    }
    loadWalletData()
  }, [getCachedData, setCachedData])
  const memoizedFilteredTransactions = useMemo(() => {
    return walletTransactions.filter(
      (transaction) =>
        transaction.agents?.full_name?.toLowerCase().includes(walletSearchTerm.toLowerCase()) ||
        transaction.reference_code?.toLowerCase().includes(walletSearchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(walletSearchTerm.toLowerCase()),
    )
  }, [walletTransactions, walletSearchTerm])

  const memoizedStatusFiltered = useMemo(() => {
    if (walletFilterAdmin === "All Transactions") return memoizedFilteredTransactions

    return memoizedFilteredTransactions.filter((transaction) => {
      switch (walletFilterAdmin) {
        case "Pending":
          return transaction.status === "pending"
        case "Approved":
          return transaction.status === "approved"
        case "Rejected":
          return transaction.status === "rejected"
        case "Top-ups":
          return transaction.transaction_type === "topup"
        case "Deductions":
          return transaction.transaction_type === "deduction"
        default:
          return true
      }
    })
  }, [memoizedFilteredTransactions, walletFilterAdmin])

  useEffect(() => {
    setFilteredWalletTransactions(memoizedStatusFiltered)
    setCurrentWalletsPage(1)
  }, [memoizedStatusFiltered])

  // OPTIMIZATION: Removed total system wallet balance calculation to prevent database strain
  // The totalSystemWalletBalance state is no longer updated/used - only page-level metrics are displayed
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    } catch {
      return timestamp
    }
  }

  // CRITICAL: Get live balance for a transaction - falls back to stored balance if agent not found
  const getTransactionAgentLiveBalance = (transaction: any): number => {
    // First try to get from agentLiveBalances state (for topup dialog)
    const liveBalance = agentLiveBalances.get(transaction.agent_id)
    if (liveBalance !== undefined) {
      return liveBalance
    }
    // Fall back to the stored wallet_balance which was already enhanced with live balance during load
    return transaction.agents?.wallet_balance || 0
  }
  const handleWalletTopup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletTopupForm.agentId || !walletTopupForm.amount) {
      alert("Please select an agent and enter an amount")
      return
    }
    try {
      const amount = Number.parseFloat(walletTopupForm.amount)
      if (amount <= 0) {
        alert("Amount must be greater than 0")
        return
      }

      const { data: agentData } = await supabase
        .from("agents")
        .select("full_name")
        .eq("id", walletTopupForm.agentId)
        .single()

      // Create wallet top-up request
      const { data: newTopup, error } = await supabase
        .from("wallet_topups")
        .insert([
          {
            agent_id: walletTopupForm.agentId,
            amount: amount,
            status: "pending",
          },
        ])
        .select()

      if (error) throw error

      if (newTopup && newTopup.length > 0) {
        const topupWithAgent = {
          ...newTopup[0],
          agents: agentData,
        }
        setWalletTopups((prev) => [topupWithAgent, ...prev])
      }

      alert("Wallet top-up request created successfully!")
      setWalletTopupForm({
        agentId: "",
        amount: "",
        searchTerm: "",
        selectedAgentName: "",
      })
      setShowWalletTopupDialog(false)
    } catch (error) {
      console.error("Error creating wallet top-up:", error)
      alert("Failed to create wallet top-up request")
    }
  }
  const approveWalletTopup = async (topupId: string) => {
    try {
      const topup = walletTopups.find((t) => t.id === topupId)
      if (!topup) {
        console.error("Topup not found:", topupId)
        alert("Topup request not found. Please refresh the page.")
        return
      }

      console.log("[v0] Starting wallet topup approval process", {
        topupId,
        agentId: topup.agent_id,
        amount: topup.amount,
      })

      // Update topup status
      const { error: topupError } = await supabase
        .from("wallet_topups")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: admin?.id,
        })
        .eq("id", topupId)

      if (topupError) {
        console.error("Error approving wallet top-up:", {
          topupId,
          error: topupError.message || topupError,
          code: topupError.code,
          details: topupError.details,
        })
        throw topupError
      }

      const transactionData = {
        agent_id: topup.agent_id,
        transaction_type: "topup",
        amount: topup.amount,
        description: `Admin wallet top-up - GH₵${topup.amount.toFixed(2)}`,
        status: "approved",
        admin_notes: `Approved by admin ${admin?.id}`,
        admin_id: admin?.id,
      }

      console.log("[v0] Creating wallet transaction with data:", transactionData)

      // Validate the transaction data before insertion
      let safeTransaction
      try {
        safeTransaction = createSafeWalletTransactionWithRef(transactionData)
        console.log("[v0] Safe transaction created:", JSON.stringify(safeTransaction, null, 2))
      } catch (validationError) {
        console.error(
          "[v0] Transaction validation failed:",
          JSON.stringify(
            {
              error: validationError,
              errorMessage: validationError instanceof Error ? validationError.message : String(validationError),
              transactionData,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        )
        throw new Error(
          `Transaction validation failed: ${validationError instanceof Error ? validationError.message : validationError}`,
        )
      }

      const { error: transactionError, data: insertedTransaction } = await supabase
        .from("wallet_transactions")
        .insert([safeTransaction])
        .select()

      if (transactionError) {
        // FIXED: Enhanced error logging with proper JSON serialization
        const errorDetails = {
          error: transactionError,
          errorMessage: transactionError.message || "Unknown error",
          code: transactionError.code,
          details: transactionError.details,
          safeTransaction,
          timestamp: new Date().toISOString(),
        }

        console.error("[v0] Error inserting wallet transaction:", JSON.stringify(errorDetails, null, 2))
        throw new Error(`Failed to create wallet transaction: ${transactionError.message}`)
      }

      try {
        console.log("[v0] Starting balance synchronization...")

        const { calculateWalletBalance } = await import("@/lib/earnings-calculator")

        // Calculate the correct balance using the same method as agent side
        const correctBalance = await calculateWalletBalance(topup.agent_id)

        console.log("[v0] Calculated correct balance using agent-side method:", {
          agentId: topup.agent_id,
          calculatedBalance: correctBalance,
          topupAmount: topup.amount,
        })

        // Update agent's wallet balance with retry logic
        let retryCount = 0
        const maxRetries = 3
        let balanceUpdateSuccess = false

        while (retryCount < maxRetries && !balanceUpdateSuccess) {
          try {
            const { error: balanceError } = await supabase
              .from("agents")
              .update({
                wallet_balance: correctBalance,
                updated_at: new Date().toISOString(),
              })
              .eq("id", topup.agent_id)

            if (balanceError) {
              throw balanceError
            }

            balanceUpdateSuccess = true
            console.log("[v0] Wallet balance updated successfully on attempt", retryCount + 1)
          } catch (updateError) {
            retryCount++
            console.error(`[v0] Balance update attempt ${retryCount} failed:`, updateError)

            if (retryCount >= maxRetries) {
              throw updateError
            }

            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
          }
        }

        console.log("[v0] Wallet balance synchronized successfully:", {
          agentId: topup.agent_id,
          topupAmount: topup.amount,
          newBalance: correctBalance,
          transactionId: insertedTransaction?.[0]?.id,
          retriesUsed: retryCount,
        })

        // Refresh data after successful balance sync
        const fetchWalletTopups = async () => {
          const { data } = await supabase
            .from("wallet_topups")
            .select(`*, agents (full_name, phone_number)`)
            .order("created_at", { ascending: false })
          setWalletTopups(data || [])
        }

        const fetchWalletTransactions = async () => {
          const { data } = await supabase
            .from("wallet_transactions")
            .select(`*, agents (full_name, phone_number, wallet_balance)`)
            .order("created_at", { ascending: false })
          setWalletTransactions(data || [])
          setCachedData(data || [])
        }

        const fetchAgents = async () => {
          const { data } = await supabase.from("agents").select("*").order("full_name", { ascending: true })
          setAgents(data || [])
        }

        await Promise.all([
          fetchWalletTopups(),
          fetchWalletTransactions(),
          fetchAgents(), // This will show the updated balance in the UI
        ])

        alert(`Wallet top-up approved successfully! New balance: GH₵${correctBalance.toFixed(2)}`)
      } catch (balanceError) {
        console.error("[v0] Error synchronizing wallet balance:", balanceError)

        const errorMessage = balanceError instanceof Error ? balanceError.message : String(balanceError)

        if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
          alert(
            "Topup approved successfully, but balance sync timed out. The balance will update automatically. Please refresh the page.",
          )
        } else if (errorMessage.includes("constraint") || errorMessage.includes("validation")) {
          alert("Topup approved successfully, but balance validation failed. Please contact technical support.")
        } else {
          alert(
            "Topup approved successfully, but balance sync encountered an issue. Please refresh the page to see the updated balance.",
          )
        }

        // Still refresh the data even if balance sync failed
        try {
          const [walletData, topupsData, agentsData] = await Promise.all([
            supabase
              .from("wallet_transactions")
              .select(`*, agents (full_name, phone_number, wallet_balance)`)
              .order("created_at", { ascending: false }),
            supabase
              .from("wallet_topups")
              .select(`*, agents (full_name, phone_number)`)
              .order("created_at", { ascending: false }),
            supabase.from("agents").select("*").order("full_name", { ascending: true }),
          ])

          setWalletTransactions(walletData.data || [])
          setWalletTopups(topupsData.data || [])
          setAgents(agentsData.data || [])
          setCachedData(walletData.data || [])
        } catch (refreshError) {
          console.error("[v0] Error refreshing data after balance sync failure:", refreshError)
        }
      }
    } catch (error) {
      // FIXED: Enhanced error logging with proper JSON serialization
      const errorDetails = {
        topupId,
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        timestamp: new Date().toISOString(),
      }

      console.error("[v0] Full error in approveWalletTopup:", JSON.stringify(errorDetails, null, 2))

      let userMessage = "Failed to approve wallet top-up"
      if (error instanceof Error) {
        if (error.message.includes("wallet_transactions_type_check")) {
          userMessage = "Database validation error: Invalid transaction type. Please contact support."
        } else if (error.message.includes("not-null constraint")) {
          userMessage = "Missing required information. Please refresh and try again."
        } else if (error.message.includes("foreign key")) {
          userMessage = "Agent not found. Please refresh the page."
        } else if (error.message.includes("constraint violation")) {
          userMessage = "Transaction validation failed. Please verify all details and try again."
        } else if (error.message.includes("duplicate")) {
          userMessage = "Duplicate transaction detected. Please refresh and try again."
        } else {
          userMessage = `Failed to approve wallet top-up: ${error.message}`
        }
      }

      alert(userMessage)
    }
  }
  const rejectWalletTopup = async (topupId: string) => {
    try {
      const { error } = await supabase
        .from("wallet_topups")
        .update({
          status: "rejected",
          approved_by: admin?.id,
        })
        .eq("id", topupId)
      if (error) throw error
      alert("Wallet top-up rejected successfully!")
      // Reload topups
      const { data: topupsData } = await supabase
        .from("wallet_topups")
        .select(`*, agents (full_name, phone_number)`)
        .order("created_at", { ascending: false })
      setWalletTopups(topupsData || [])
    } catch (error) {
      console.error("Error rejecting wallet top-up:", error)
      alert("Failed to reject wallet top-up")
    }
  }
  const deleteWalletTopup = async (topupId: string) => {
    try {
      const topup = walletTopups.find((t) => t.id === topupId)
      
      // CRITICAL: Prevent deletion of pending topups
      if (topup && topup.status === "pending") {
        alert("❌ Cannot delete pending wallet top-up requests. Please approve or reject the request first, then you can delete it if needed.")
        return
      }

      if (!confirm("Are you sure you want to delete this wallet top-up request?")) return
      
      const { error } = await supabase.from("wallet_topups").delete().eq("id", topupId)
      if (error) throw error
      const updatedTopups = walletTopups.filter((topup) => topup.id !== topupId)
      setWalletTopups(updatedTopups)
      alert("Wallet top-up request deleted successfully!")
    } catch (error) {
      console.error("Error deleting wallet top-up:", error)
      alert("Failed to delete wallet top-up request")
    }
  }
  const updateWalletTransactionStatus = async (transactionId: string, newStatus: string, adminNotes?: string) => {
    try {
      const transaction = walletTransactions.find((t) => t.id === transactionId)
      if (!transaction) {
        alert("Transaction not found. Please refresh the page.")
        return
      }

      console.log("[v0] Updating wallet transaction status:", {
        transactionId,
        newStatus,
        agentId: transaction.agent_id,
        amount: transaction.amount,
        type: transaction.transaction_type,
        adminNotes,
      })

      // Update transaction status
      const { error: updateError } = await supabase
        .from("wallet_transactions")
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          admin_id: admin?.id,
          admin_notes: adminNotes || transaction.admin_notes, // Preserve existing notes if not provided
        })
        .eq("id", transactionId)

      if (updateError) {
        console.error("Error updating transaction status:", updateError)
        throw updateError
      }

      if (newStatus === "approved") {
        try {
          const { calculateWalletBalance } = await import("@/lib/earnings-calculator")
          const correctBalance = await calculateWalletBalance(transaction.agent_id)

          const { error: balanceError } = await supabase
            .from("agents")
            .update({
              wallet_balance: correctBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", transaction.agent_id)

          if (balanceError) {
            console.error("[v0] Error updating agent balance after transaction approval:", balanceError)
            throw balanceError
          }

          console.log("[v0] Wallet balance synchronized using agent-side calculation:", {
            agentId: transaction.agent_id,
            transactionAmount: transaction.amount,
            transactionType: transaction.transaction_type,
            newBalance: correctBalance,
            transactionId,
          })
        } catch (balanceError) {
          console.error("[v0] Error synchronizing wallet balance after approval:", balanceError)
          // Continue with UI refresh even if balance sync failed
        }
      }

      const fetchWalletTransactions = async () => {
        const { data } = await supabase
          .from("wallet_transactions")
          .select(`*, agents (full_name, phone_number, wallet_balance)`)
          .order("created_at", { ascending: false })
        setWalletTransactions(data || [])
        setCachedData(data || [])
      }

      const fetchAgents = async () => {
        const { data } = await supabase.from("agents").select("*").order("full_name", { ascending: true })
        setAgents(data || [])
      }

      await Promise.all([
        fetchWalletTransactions(),
        fetchAgents(), // This will show the updated balance
      ])

      alert(`Transaction ${newStatus} successfully!`)
    } catch (error) {
      console.error("Error updating wallet transaction status:", error)
      alert(`Failed to ${newStatus} transaction. Please try again.`)
    }
  }



  // CRITICAL FIX: Add proper payment method detection
  const getPaymentMethodLabel = (transaction: any): string => {
    const type = transaction.transaction_type?.toLowerCase()
    const paymentMethod = transaction.payment_method?.toLowerCase()

    // For topups, usually mobile money
    if (type === "topup") {
      return "Mobile Money"
    }

    // For deductions, usually wallet
    if (type === "deduction") {
      return "Wallet"
    }

    // For manual transactions
    if (paymentMethod === "manual") {
      return "Manual Payment"
    }

    // For auto transactions
    if (paymentMethod === "auto") {
      return "Automatic"
    }

    // Default based on transaction type
    switch (type) {
      case "commission":
      case "commission_deposit":
        return "System"
      case "refund":
        return "Refund"
      case "withdrawal_deduction":
        return "Mobile Money"
      case "admin_adjustment":
        return "Admin Action"
      default:
        return paymentMethod || "Unknown"
    }
  }
  const downloadWalletTransactionsCSV = () => {
    if (filteredWalletTransactions.length === 0) {
      alert("No wallet transactions to download")
      return
    }
    const headers = [
      "Transaction ID",
      "Date",
      "Time",
      "Agent Name",
      "Agent Phone",
      "Transaction Type",
      "Amount (GH₵)",
      "Description",
      "Reference Code",
      "Status",
      "Payment Method",
      "Admin Notes",
      "Current Wallet Balance (GH₵)",
      "Approved At",
      "Rejected At",
    ]
    const csvData = filteredWalletTransactions.map((transaction) => [
      transaction.id || "",
      new Date(transaction.created_at).toLocaleDateString(),
      new Date(transaction.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      transaction.agents?.full_name || "",
      transaction.agents?.phone_number || "",
      getTransactionTypeLabel(transaction),
      transaction.amount?.toFixed(2) || "",
      transaction.description || "",
      transaction.reference_code || "",
      transaction.status || "",
    getPaymentMethodLabel(transaction),
    transaction.admin_notes || "",
    getTransactionAgentLiveBalance(transaction).toFixed(2),
    transaction.approved_at ? new Date(transaction.approved_at).toLocaleString() : "",
      transaction.rejected_at ? new Date(transaction.rejected_at).toLocaleString() : "",
    ])
    const csvContent = [headers, ...csvData]
      .map((row) =>
        row
          .map((field) =>
            typeof field === "string" && (field.includes(",") || field.includes('"') || field.includes("\n"))
              ? `"${field.replace(/"/g, '""')}"`
              : field,
          )
          .join(","),
      )
      .join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `admin-wallet-transactions-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const handleCompleteRefresh = useCallback(async () => {
    console.log("Performing complete refresh...")
    try {
      await connectionManager.forceReconnect()
      await loadNextWalletsPage(currentWalletsPage)
      console.log("Complete refresh successful")
    } catch (error) {
      console.error("Complete refresh failed:", error)
    }
  }, [currentWalletsPage])

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null

    const handlePageChange = (page: number) => {
      loadNextWalletsPage(page)
      onPageChange(page)
    }

    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={`${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {/* Display up to 5 page numbers, centered around the current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1
              // Adjust page number to center around current page if possible
              if (totalPages > 5) {
                if (currentPage <= 3) {
                  pageNum = i + 1 // Start from 1 for the first few pages
                } else if (currentPage > totalPages - 2) {
                  pageNum = totalPages - 4 + i // End with the last few pages
                } else {
                  pageNum = currentPage - 2 + i // Center around current page
                }
              }
              // Ensure pageNum is within bounds
              pageNum = Math.max(1, Math.min(pageNum, totalPages))

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={`${
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">Error: {error}</p>
          <button onClick={() => setError(null)} className="text-red-600 text-xs hover:text-red-800 mt-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Agent Search Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Search Agent for Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
              <Input
                placeholder="Agent name or phone..."
                value={agentSearchTerm}
                onChange={(e) => setAgentSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchAgentForReport()}
                className="pl-10 border-blue-200 focus:border-blue-500 bg-white/80"
              />
            </div>
            <Button
              onClick={searchAgentForReport}
              disabled={agentSearchLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              {agentSearchLoading ? "Searching..." : "Search"}
            </Button>
          </div>
          {searchedAgent && (
            <div className="mt-2 p-3 bg-white rounded border border-blue-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{searchedAgent.full_name}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{searchedAgent.phone_number}</p>
                </div>
                <Button
                  onClick={() => downloadAgentSpecificReport(searchedAgent.id, searchedAgent.full_name)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Wallet Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select value={walletFilterAdmin} onValueChange={setWalletFilterAdmin}>
            <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Transactions">All Transactions</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Top-ups">Top-ups Only</SelectItem>
              <SelectItem value="Deductions">Deductions Only</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={walletSearchTerm}
              onChange={(e) => setWalletSearchTerm(e.target.value)}
              className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Button
            onClick={() => {
              loadAgentsForTopup() // Load agents only when dialog opens
              setShowWalletTopupDialog(true)
            }}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Top-up Wallet
          </Button>
          <Button
            onClick={downloadWalletTransactionsCSV}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              {walletTransactions.length} current page
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {walletTransactions.filter((t) => t.status === "pending").length} pending
            </Badge>
          </div>
        </div>
      </div>
      {/* Wallet Top-up Requests Section */}
      {walletTopups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-emerald-700">Pending Top-up Requests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {walletTopups
              .filter((topup) => topup.status === "pending")
              .map((topup) => (
                <Card key={topup.id} className="border-amber-200 bg-amber-50/50 backdrop-blur-sm">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-amber-800">Top-up Request</h4>
                        <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-amber-700">
                          <span className="font-medium">Agent:</span> {topup.agents?.full_name}
                        </p>
                        <p className="text-amber-700">
                          <span className="font-medium">Amount:</span> GH₵ {topup.amount.toFixed(2)}
                        </p>
                        <p className="text-amber-600 text-xs">
                          <span className="font-medium">Requested:</span> {formatTimestamp(topup.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => approveWalletTopup(topup.id)}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectWalletTopup(topup.id)}
                          className="flex-1"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteWalletTopup(topup.id)}
                          disabled={topup.status === "pending"}
                          title={topup.status === "pending" ? "Cannot delete pending requests" : "Delete request"}
                          className={topup.status === "pending" ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
      <div className="space-y-4">
        {filteredWalletTransactions.length === 0 && !error ? (
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-gray-500 mb-4">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No wallet transactions found</p>
                <p className="text-sm">Wallet transactions will appear here when agents make top-ups or purchases</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {getPaginatedData(filteredWalletTransactions, currentWalletsPage).map((transaction) => (
              <Card
                key={transaction.id}
                className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-emerald-800 text-lg flex items-center gap-2">
                          {getTransactionTypeIcon(transaction)}
                          {getTransactionTypeLabel(transaction)}
                        </h3>
                        <Badge
                          className={
                            transaction.status === "pending"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : transaction.status === "approved"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <p className="text-emerald-600">
                          <span className="font-medium">Agent:</span> {transaction.agents?.full_name}
                        </p>
                        <p className="text-emerald-600">
                          <span className="font-medium">Phone:</span> {transaction.agents?.phone_number}
                        </p>
                        <p className="text-emerald-600">
                          <span className="font-medium">Amount:</span>
                          <span
                            className={`font-bold ml-1 ${
                              transaction.transaction_type === "topup" || transaction.transaction_type === "refund"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.transaction_type === "topup" || transaction.transaction_type === "refund"
                              ? "+"
                              : "-"}
                            GH₵ {transaction.amount.toFixed(2)}
                          </span>
                        </p>
                        <p className="text-emerald-600">
                          <span className="font-medium">Current Balance (Live):</span> GH₵{" "}
                          {getTransactionAgentLiveBalance(transaction).toFixed(2)}
                        </p>
                        <p className="text-emerald-600">
                          <span className="font-medium">Reference:</span> {transaction.reference_code}
                        </p>
                        <p className="text-emerald-500 text-xs">
                          <span className="font-medium">Created:</span> {formatTimestamp(transaction.created_at)}
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <p className="text-sm text-emerald-700">{transaction.description}</p>
                        {transaction.admin_notes && (
                          <p className="text-xs text-emerald-600 mt-1">
                            <span className="font-medium">Admin Notes:</span> {transaction.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {transaction.status === "pending" && transaction.transaction_type === "topup" && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                        <Button
                          size="sm"
                          onClick={() => updateWalletTransactionStatus(transaction.id, "approved")}
                          className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve Top-up
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const notes = prompt("Reason for rejection (optional):")
                            updateWalletTransactionStatus(transaction.id, "rejected", notes || undefined)
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <PaginationControls
        currentPage={currentWalletsPage}
        totalPages={getTotalPages(totalWalletTransactions)}
        onPageChange={setCurrentWalletsPage}
      />
      <FloatingRefreshButton onRefresh={handleCompleteRefresh} showConnectionStatus={true} />

      {/* Wallet Top-up Dialog */}
      <Dialog open={showWalletTopupDialog} onOpenChange={setShowWalletTopupDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>Create Wallet Top-up Request</DialogTitle>
            <DialogDescription>Create a new wallet top-up request for an agent.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWalletTopup} className="grid gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="agentSearch">Select Agent</Label>
                <div className="relative mt-1">
                  <Input
                    type="text"
                    id="agentSearch"
                    placeholder="Search agents by name or phone..."
                    value={walletTopupForm.searchTerm}
                    onChange={(e) =>
                      setWalletTopupForm({
                        ...walletTopupForm,
                        searchTerm: e.target.value,
                        agentId: "", // Clear selection when typing
                        selectedAgentName: "",
                      })
                    }
                    className="w-full"
                  />
                  {walletTopupForm.searchTerm && walletTopupForm.searchTerm !== walletTopupForm.selectedAgentName && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-emerald-200 rounded-md shadow-lg">
                      {agents
                        .filter(
                          (agent) =>
                            agent.full_name?.toLowerCase().includes(walletTopupForm.searchTerm.toLowerCase()) ||
                            agent.phone_number?.includes(walletTopupForm.searchTerm) ||
                            agent.momo_number?.includes(walletTopupForm.searchTerm),
                        )
                        .slice(0, 10)
                        .map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            className="w-full text-left px-3 py-3 hover:bg-emerald-50 border-b border-emerald-100 last:border-b-0 focus:bg-emerald-50 focus:outline-none"
                            onClick={() => {
                              setWalletTopupForm({
                                ...walletTopupForm,
                                agentId: agent.id,
                                searchTerm: `${agent.full_name} - ${agent.phone_number}`,
                                selectedAgentName: `${agent.full_name} - ${agent.phone_number}`,
                              })
                            }}
                          >
                            <div className="font-medium text-emerald-800">{agent.full_name}</div>
                            <div className="text-sm text-emerald-600">
                              {agent.phone_number} • {agent.momo_number}
                            </div>
                            <div className="text-xs text-emerald-500">
                              Current Balance: GH₵ {(agentLiveBalances.get(agent.id) ?? agent.wallet_balance ?? 0).toFixed(2)} • Region: {agent.region}
                            </div>
                          </button>
                        ))}
                      {agents.filter(
                        (agent) =>
                          agent.full_name?.toLowerCase().includes(walletTopupForm.searchTerm.toLowerCase()) ||
                          agent.phone_number?.includes(walletTopupForm.searchTerm) ||
                          agent.momo_number?.includes(walletTopupForm.searchTerm),
                      ).length === 0 && (
                        <div className="px-3 py-3 text-gray-500 text-sm text-center">
                          No agents found matching "{walletTopupForm.searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {walletTopupForm.agentId && (
                  <div className="mt-2 p-3 bg-emerald-50 rounded border border-emerald-200">
                    <div className="text-sm text-emerald-700 font-medium">
                      <strong>Selected Agent:</strong> {agents.find((a) => a.id === walletTopupForm.agentId)?.full_name}
                    </div>
                    <div className="text-sm text-emerald-700 mt-2 font-semibold">
                      Current Live Wallet Balance: GH₵{" "}
                      {(agentLiveBalances.get(walletTopupForm.agentId) ?? agents.find((a) => a.id === walletTopupForm.agentId)?.wallet_balance ?? 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="amount">Top-up Amount (GH₵)</Label>
                <Input
                  type="number"
                  id="amount"
                  value={walletTopupForm.amount}
                  onChange={(e) => setWalletTopupForm({ ...walletTopupForm, amount: e.target.value })}
                  className="w-full mt-1"
                  placeholder="Enter amount to top-up"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
})
