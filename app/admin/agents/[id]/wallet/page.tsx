"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Wallet,
  RefreshCw,
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  RotateCcw,
  Settings,
  Shield,
  History,
  CreditCard,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import { calculateWalletBalance } from "@/lib/earnings-calculator"

interface WalletTransaction {
  id: string
  created_at: string
  transaction_type: string
  amount: number
  description: string
  reference_code: string
  status: string
  admin_notes?: string
  source_type?: string
  source_id?: string
}

interface WalletSummary {
  walletBalance: number
  totalTopups: number
  totalCommissions: number
  availableCommissions: number
  totalWithdrawals: number
  totalDeductions: number
  pendingTransactions: number
  lastTransactionDate: string | null
}

interface Agent {
  id: string
  full_name: string
  phone_number: string
  wallet_balance: number
}

export default function AdminAgentWalletPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [admin, setAdmin] = useState<any>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Dialog states
  const [showReverseTransactionDialog, setShowReverseTransactionDialog] = useState(false)
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null)

  // Form states
  const [adjustmentAmount, setAdjustmentAmount] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"credit" | "debit">("credit")
  const [reversalReason, setReversalReason] = useState("")

  const getCurrentAdmin = () => {
    // Get admin from localStorage or session
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      return JSON.parse(adminData)
    }
    return null
  }

  useEffect(() => {
    const currentAdmin = getCurrentAdmin()
    if (!currentAdmin) {
      router.push("/admin/login")
      return
    }
    setAdmin(currentAdmin)
    loadWalletData()
  }, [agentId, router])

  const loadWalletData = async () => {
    try {
      setLoading(true)

      // Get agent details
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("id, full_name, phone_number, wallet_balance")
        .eq("id", agentId)
        .single()

      if (agentError) throw agentError
      setAgent(agentData)

      // CRITICAL FIX: Calculate the LIVE wallet balance, not the stored one
      let liveWalletBalance = 0
      try {
        liveWalletBalance = await calculateWalletBalance(agentId)
      } catch (error) {
        console.warn("Error calculating live wallet balance, using fallback:", error)
        liveWalletBalance = Number(agentData.wallet_balance) || 0
      }

      let finalSummary: WalletSummary = {
        walletBalance: liveWalletBalance,
        totalTopups: 0,
        totalCommissions: 0,
        availableCommissions: 0,
        totalWithdrawals: 0,
        totalDeductions: 0,
        pendingTransactions: 0,
        lastTransactionDate: null,
      }

      try {
        const commissionSummary = await getAgentCommissionSummary(agentId)
        finalSummary = {
          walletBalance: liveWalletBalance,
          totalTopups: 0, // Not needed for display
          totalCommissions: commissionSummary.totalCommissions || 0,
          availableCommissions: commissionSummary.availableCommissions || 0,
          totalWithdrawals: commissionSummary.totalPaidOut || 0,
          totalDeductions: 0, // Not needed for display
          pendingTransactions: commissionSummary.pendingPayout || 0,
          lastTransactionDate: null,
        }

        console.log("✅ Admin wallet using unified commission system:", {
          agentId,
          totalCommissions: finalSummary.totalCommissions,
          availableCommissions: finalSummary.availableCommissions,
          totalWithdrawals: finalSummary.totalWithdrawals,
          pendingTransactions: finalSummary.pendingTransactions,
        })
      } catch (commissionError) {
        console.error("Error with unified commission system, using fallback:", commissionError)
        // Try fallback method using stored agent data
        try {
          const { data: agentData, error: agentError } = await supabase
            .from("agents")
            .select("wallet_balance, totalcommissions, totalpaidout")
            .eq("id", agentId)
            .single()

          if (!agentError && agentData) {
            const totalCommissions = Number(agentData.totalcommissions) || 0
            const totalPaidOut = Number(agentData.totalpaidout) || 0
            const availableCommissions = Math.max(totalCommissions - totalPaidOut, 0)

            finalSummary = {
              walletBalance: liveWalletBalance,
              totalTopups: 0,
              totalCommissions: totalCommissions,
              availableCommissions: availableCommissions,
              totalWithdrawals: totalPaidOut,
              totalDeductions: 0,
              pendingTransactions: 0,
              lastTransactionDate: null,
            }

            console.log("⚠️ Admin wallet using legacy fallback:", {
              agentId,
              totalCommissions,
              totalPaidOut,
              availableCommissions,
            })
          }
        } catch (fallbackError) {
          console.error("Fallback method also failed:", fallbackError)
        }
      }

      setWalletSummary(finalSummary)

      // Get wallet transactions
      try {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(20)

        if (!transactionsError) {
          setTransactions(transactionsData || [])
        }
      } catch (transactionError) {
        console.error("Error loading transactions:", transactionError)
        setTransactions([])
      }
    } catch (error) {
      console.error("Error loading wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionReversal = async () => {
    if (!admin || !selectedTransaction || !reversalReason.trim()) return

    try {
      setActionLoading(true)

      const response = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reverse_transaction",
          agent_id: agentId,
          admin_id: admin.id,
          transaction_id: selectedTransaction.id,
          reversal_reason: reversalReason.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${result.data.message}`)
        setShowReverseTransactionDialog(false)
        setSelectedTransaction(null)
        setReversalReason("")
        loadWalletData()
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error reversing transaction:", error)
      alert("❌ Failed to reverse transaction. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleAdjustment = async () => {
    if (!admin || !adjustmentAmount || !adjustmentReason.trim()) return

    const amount = Number.parseFloat(adjustmentAmount)
    if (amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    try {
      setActionLoading(true)

      const response = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjustment",
          agent_id: agentId,
          admin_id: admin.id,
          amount: amount,
          reason: adjustmentReason.trim(),
          is_positive: adjustmentType === "credit",
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${result.data.message}`)
        setShowAdjustmentDialog(false)
        setAdjustmentAmount("")
        setAdjustmentReason("")
        loadWalletData()
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error creating adjustment:", error)
      alert("❌ Failed to create adjustment. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending") return <Clock className="h-4 w-4 text-amber-600" />
    if (status === "rejected") return <X className="h-4 w-4 text-red-600" />

    switch (type) {
      case "topup":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "commission_deposit":
        return <Coins className="h-4 w-4 text-blue-600" />
      case "deduction":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "withdrawal_deduction":
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      case "refund":
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case "admin_adjustment":
        return <Settings className="h-4 w-4 text-purple-600" />
      case "admin_reversal":
        return <RotateCcw className="h-4 w-4 text-purple-600" />
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
      case "admin_adjustment":
        return "Admin Credit"
      case "admin_reversal":
        return "Admin Reversal"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading wallet information...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Agent Not Found</h2>
          <p className="text-gray-600 mb-4">The requested agent could not be found.</p>
          <Button asChild>
            <Link href="/admin/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button variant="outline" size="sm" asChild className="w-fit bg-transparent">
              <Link href={`/admin/agents/${agentId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agent
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wallet Management</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {agent.full_name} • {agent.phone_number}
              </p>
            </div>
          </div>
          <Button onClick={loadWalletData} variant="outline" className="w-full sm:w-auto bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Wallet Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Current Balance</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    GH₵ {walletSummary?.walletBalance?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Commissions</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    GH₵ {walletSummary?.totalCommissions?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <Coins className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Available Commissions</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    GH₵ {walletSummary?.availableCommissions?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Total Withdrawals</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    GH₵ {walletSummary?.totalWithdrawals?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Actions
            </CardTitle>
            <CardDescription>Manage wallet balance, commissions, and transactions for this agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => setShowAdjustmentDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Adjust Balance
              </Button>

              <Button
                onClick={loadWalletData}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Balance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest wallet transactions for this agent</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
                <p className="text-gray-600">This agent has no wallet transactions yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="text-sm">{new Date(transaction.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.transaction_type, transaction.status)}
                            <span className="text-sm font-medium">
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm">{transaction.description}</p>
                            <p className="text-xs text-gray-500 font-mono">{transaction.reference_code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              ["topup", "refund", "commission_deposit", "admin_adjustment"].includes(
                                transaction.transaction_type,
                              )
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {["topup", "refund", "commission_deposit", "admin_adjustment"].includes(
                              transaction.transaction_type,
                            )
                              ? "+"
                              : "-"}
                            GH₵ {transaction.amount.toFixed(2)}
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
                          {transaction.status === "approved" &&
                            !transaction.transaction_type.includes("admin_reversal") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTransaction(transaction)
                                  setShowReverseTransactionDialog(true)
                                }}
                                className="text-xs"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reverse
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reverse Transaction Dialog */}
      <Dialog open={showReverseTransactionDialog} onOpenChange={setShowReverseTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reverse Transaction
            </DialogTitle>
            <DialogDescription>
              Reverse the selected transaction. This will create a new reversal transaction.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Transaction Details:</h4>
                <p>
                  <strong>Type:</strong> {getTransactionTypeLabel(selectedTransaction.transaction_type)}
                </p>
                <p>
                  <strong>Amount:</strong> GH₵ {selectedTransaction.amount.toFixed(2)}
                </p>
                <p>
                  <strong>Description:</strong> {selectedTransaction.description}
                </p>
                <p>
                  <strong>Reference:</strong> {selectedTransaction.reference_code}
                </p>
              </div>

              <div>
                <Label htmlFor="reversal-reason">Reversal Reason *</Label>
                <Textarea
                  id="reversal-reason"
                  placeholder="Explain why this transaction is being reversed..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReverseTransactionDialog(false)
                setSelectedTransaction(null)
                setReversalReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransactionReversal}
              disabled={actionLoading || !reversalReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Reversing..." : "Reverse Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Balance Adjustment
            </DialogTitle>
            <DialogDescription>Add or subtract funds from the agent's wallet balance.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Adjustment Type</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  variant={adjustmentType === "credit" ? "default" : "outline"}
                  onClick={() => setAdjustmentType("credit")}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Credit (Add)
                </Button>
                <Button
                  variant={adjustmentType === "debit" ? "default" : "outline"}
                  onClick={() => setAdjustmentType("debit")}
                  className="flex-1"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Debit (Subtract)
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="adjustment-amount">Amount (GH₵) *</Label>
              <Input
                id="adjustment-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="adjustment-reason">Reason *</Label>
              <Textarea
                id="adjustment-reason"
                placeholder="Explain the reason for this adjustment..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdjustmentDialog(false)
                setAdjustmentAmount("")
                setAdjustmentReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustment}
              disabled={actionLoading || !adjustmentAmount || !adjustmentReason.trim()}
              className={
                adjustmentType === "credit" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }
            >
              {actionLoading ? "Processing..." : `${adjustmentType === "credit" ? "Add" : "Subtract"} Funds`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
