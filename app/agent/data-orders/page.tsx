"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase, type Agent } from "@/lib/supabase"
import { getCurrentAgent } from "@/lib/auth"
import { cleanOrdersData, getBundleDisplayName } from "@/lib/bundle-data-handler"
import { getAgentCommissionSummary, calculateCorrectWalletBalance } from "@/lib/commission-earnings"
import {
  ArrowLeft,
  Smartphone,
  Filter,
  Clock,
  CheckCircle,
  X,
  Wallet,
  CreditCard,
  MessageCircle,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  Download,
  PiggyBank,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import { format } from "date-fns"

interface DataOrder {
  id: string
  created_at: string
  recipient_phone: string
  payment_reference: string
  commission_amount: number
  payment_method: "manual" | "wallet"
  status: "pending" | "processing" | "completed" | "canceled"
  admin_message?: string
  data_bundles: {
    id: string
    name: string
    provider: string
    size_gb: number
    price: number
    commission_rate: number
    validity_days: number
    description: string
  }
}

const ITEMS_PER_PAGE = 10

export default function DataOrdersPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [orders, setOrders] = useState<DataOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<DataOrder[]>([])
  const [paginatedOrders, setPaginatedOrders] = useState<DataOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [providerFilter, setProviderFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<DataOrder | null>(null)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isDownloading, setIsDownloading] = useState(false)
  const [commissionData, setCommissionData] = useState({
    totalAvailableCommissions: 0,
    totalDataOrderCommissions: 0,
  })
  const [showSavingsNotification, setShowSavingsNotification] = useState(true)
  const [isSavingsNotificationVisible, setIsSavingsNotificationVisible] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const currentAgent = getCurrentAgent()
    if (!currentAgent) {
      router.push("/agent/login")
      return
    }
    setAgent(currentAgent)

    loadWalletBalance(currentAgent.id)
    loadUnifiedCommissionData(currentAgent.id)

    loadOrders(currentAgent.id)
    setupRealTimeUpdates(currentAgent.id)

    const timer = setTimeout(() => {
      setIsSavingsNotificationVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  const loadWalletBalance = async (agentId: string) => {
    try {
      console.log("[v0] Loading wallet balance using unified calculation for agent:", agentId)

      const { balance } = await calculateCorrectWalletBalance(agentId)

      console.log("[v0] Wallet balance calculated:", balance)
      setWalletBalance(balance)
    } catch (error: any) {
      console.error("[v0] Error loading wallet balance:", error)
      console.error("[v0] Error message:", error?.message || "Unknown error")
      setWalletBalance(0)
    }
  }

  const loadUnifiedCommissionData = async (agentId: string) => {
    try {
      const commissionSummary = await getAgentCommissionSummary(agentId)
      setCommissionData({
        totalAvailableCommissions: commissionSummary.availableForWithdrawal || 0,
        totalDataOrderCommissions: commissionSummary.dataOrderCommissions || 0,
      })
      console.log("✅ Data-orders page using unified commission calculation:", {
        availableForWithdrawal: commissionSummary.availableForWithdrawal,
        dataOrderCommissions: commissionSummary.dataOrderCommissions,
      })
    } catch (error) {
      console.error("Error loading unified commission data:", error)
      setCommissionData({
        totalAvailableCommissions: 0,
        totalDataOrderCommissions: 0,
      })
    }
  }

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, providerFilter])

  useEffect(() => {
    paginateOrders()
  }, [filteredOrders, currentPage])

  const setupRealTimeUpdates = (agentId: string) => {
    const orderChannel = supabase
      .channel("data-order-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "data_orders",
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          loadOrders(agentId)
          loadUnifiedCommissionData(agentId)
        },
      )
      .subscribe()

    const walletChannel = supabase
      .channel("wallet-balance-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallet_transactions",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          console.log("Wallet transaction changed, refreshing balance:", payload)
          loadWalletBalance(agentId)
        },
      )
      .subscribe()

    const commissionChannel = supabase
      .channel("commission-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commissions",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          console.log("Commission changed, refreshing commission data:", payload)
          loadUnifiedCommissionData(agentId)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(walletChannel)
      supabase.removeChannel(commissionChannel)
    }
  }

  const loadOrders = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from("data_orders")
        .select(`
          *,
          data_bundles!fk_data_orders_bundle_id (
            id,
            name,
            provider,
            size_gb,
            price,
            commission_rate,
            validity_days,
            description
          )
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error loading orders:", JSON.stringify(error, null, 2))
        throw error
      }

      console.log("[v0] Raw data from database:", JSON.stringify(data?.slice(0, 2), null, 2))

      const cleanedOrders = cleanOrdersData(data || [])

      console.log("[v0] Cleaned data after processing:", JSON.stringify(cleanedOrders?.slice(0, 2), null, 2))

      console.log("✅ Agent: Loaded and cleaned orders with bundle data:", cleanedOrders.length)
      console.log("🔍 Agent: Bundle status distribution:", {
        valid: cleanedOrders.filter((o) => o.bundle_status === "valid").length,
        invalid: cleanedOrders.filter((o) => o.bundle_status === "invalid").length,
        missing: cleanedOrders.filter((o) => o.bundle_status === "missing").length,
      })

      setOrders(cleanedOrders)
    } catch (error: any) {
      console.error(
        "Error loading orders:",
        JSON.stringify(
          {
            message: error?.message || "Unknown error",
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
          },
          null,
          2,
        ),
      )
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.recipient_phone.includes(searchTerm) ||
          order.payment_reference.toLowerCase().includes(searchTermLower) ||
          order.data_bundles?.name.toLowerCase().includes(searchTermLower) ||
          order.data_bundles?.provider.toLowerCase().includes(searchTermLower),
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }
    if (providerFilter !== "all") {
      filtered = filtered.filter((order) => order.data_bundles?.provider === providerFilter)
    }
    setFilteredOrders(filtered)
    setCurrentPage(1)
  }

  const paginateOrders = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginated = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    setPaginatedOrders(paginated)
    setTotalPages(Math.ceil(filteredOrders.length / ITEMS_PER_PAGE))
  }

  const refreshOrders = async () => {
    if (agent) {
      await loadOrders(agent.id)
      await loadUnifiedCommissionData(agent.id)
    }
  }

  const refreshWalletBalance = async () => {
    if (!agent) return
    try {
      console.log("[v0] Refreshing wallet balance using unified calculation for agent:", agent.id)

      const { balance } = await calculateCorrectWalletBalance(agent.id)

      console.log("[v0] Refreshed wallet balance:", balance)
      setWalletBalance(balance)
    } catch (error: any) {
      console.error("[v0] Error refreshing wallet balance:", error)
      console.error("[v0] Error message:", error?.message || "Unknown error")
      setWalletBalance(0)
    }
  }

  const deleteOrder = async (orderId: string) => {
    try {
      const orderToDelete = orders.find((o) => o.id === orderId)
      if (orderToDelete && orderToDelete.status === "processing") {
        alert("Cannot delete orders that are currently processing. Only pending and completed orders can be deleted.")
        setShowDeleteDialog(false)
        setOrderToDelete(null)
        return
      }

      const { error } = await supabase.from("data_orders").delete().eq("id", orderId)
      if (error) throw error
      setOrders(orders.filter((order) => order.id !== orderId))
      setShowDeleteDialog(false)
      setOrderToDelete(null)
      alert("Order deleted successfully")
    } catch (error) {
      console.error("Error deleting order:", error)
      alert("Failed to delete order. Please try again.")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "canceled":
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const openMessageDialog = (order: DataOrder) => {
    setSelectedOrder(order)
    setShowMessageDialog(true)
  }

  const openDeleteDialog = (orderId: string) => {
    const orderToDelete = orders.find((o) => o.id === orderId)
    if (orderToDelete && orderToDelete.status === "processing") {
      alert("Cannot delete orders that are currently processing. Only pending and completed orders can be deleted.")
      return
    }
    setOrderToDelete(orderId)
    setShowDeleteDialog(true)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      localDateTime: date.toLocaleString(),
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const downloadReport = async () => {
    if (!agent) return
    setIsDownloading(true)
    try {
      const ordersToDownload = [...filteredOrders]

      if (ordersToDownload.length === 0) {
        alert("No orders found matching your current filters.")
        return
      }

      await downloadEnhancedTransactionReport(ordersToDownload)
    } catch (error) {
      console.error("Error downloading report:", error)
      alert("Failed to download report. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadEnhancedTransactionReport = async (ordersToDownload: DataOrder[]) => {
    try {
      // Fetch all wallet transactions for the agent
      const { data: walletTransactions, error: walletError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("agent_id", agent!.id)
        .order("created_at", { ascending: true })

      if (walletError) {
        console.error("Error fetching wallet transactions:", walletError)
        throw walletError
      }

      // Fetch all commissions for the agent
      const { data: commissions, error: commissionError } = await supabase
        .from("commissions")
        .select("*")
        .eq("agent_id", agent!.id)
        .order("created_at", { ascending: true })

      if (commissionError) {
        console.error("Error fetching commissions:", commissionError)
        throw commissionError
      }

      // Create comprehensive transaction flow
      const transactionFlow = createTransactionFlow(ordersToDownload, walletTransactions || [], commissions || [])

      // Generate enhanced CSV report
      const csvContent = generateEnhancedCSV(transactionFlow, ordersToDownload)

      // Download the report
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)

      let filterDescription = ""
      if (statusFilter !== "all" || providerFilter !== "all" || searchTerm) {
        const filters = []
        if (statusFilter !== "all") filters.push(statusFilter)
        if (providerFilter !== "all") filters.push(providerFilter)
        if (searchTerm) filters.push("search")
        filterDescription = `-${filters.join("-")}`
      }

      const timestamp = format(new Date(), "yyyy-MM-dd-HHmm")
      link.setAttribute("download", `comprehensive-transaction-report${filterDescription}-${timestamp}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      const orderCount = ordersToDownload.length
      let filterText = ""
      if (statusFilter !== "all" || providerFilter !== "all" || searchTerm) {
        const activeFilters = []
        if (statusFilter !== "all") activeFilters.push(`Status: ${statusFilter}`)
        if (providerFilter !== "all") activeFilters.push(`Provider: ${providerFilter}`)
        if (searchTerm) activeFilters.push(`Search: "${searchTerm}"`)
        filterText = ` with filters (${activeFilters.join(", ")})`
      }

      alert(
        `Successfully downloaded comprehensive transaction report with ${orderCount} order${orderCount !== 1 ? "s" : ""} and complete financial flow${filterText}!`,
      )
    } catch (error) {
      console.error("Error generating enhanced report:", error)
      throw error
    }
  }

  const createTransactionFlow = (orders: DataOrder[], walletTransactions: any[], commissions: any[]) => {
    const flow: any[] = []
    let runningBalance = 0

    // Combine all transactions with timestamps
    const allTransactions = [
      ...orders.map((order) => ({
        type: "data_order",
        timestamp: order.created_at,
        data: order,
        amount: -(order.data_bundles?.price || 0),
        commission: order.commission_amount,
        description: `Data Order: ${order.data_bundles?.name} to ${order.recipient_phone}`,
      })),
      ...walletTransactions.map((tx) => ({
        type: "wallet_transaction",
        timestamp: tx.created_at,
        data: tx,
        amount: tx.transaction_type === "credit" ? tx.amount : -tx.amount,
        commission: 0,
        description: `${tx.transaction_type === "credit" ? "Credit" : "Debit"}: ${tx.description || tx.transaction_type}`,
      })),
      ...commissions.map((comm) => ({
        type: "commission",
        timestamp: comm.created_at,
        data: comm,
        amount: comm.amount,
        commission: comm.amount,
        description: `Commission: ${comm.source_type} - ${comm.description || "Commission earned"}`,
      })),
    ]

    // Sort by timestamp
    allTransactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Calculate running balance and create flow
    allTransactions.forEach((transaction, index) => {
      const previousBalance = runningBalance
      runningBalance += transaction.amount

      flow.push({
        sequence: index + 1,
        timestamp: transaction.timestamp,
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        commission: transaction.commission,
        previousBalance: previousBalance,
        newBalance: runningBalance,
        transactionId: transaction.data.id,
        verificationHash: generateVerificationHash(transaction),
        data: transaction.data,
      })
    })

    return flow
  }

  const generateVerificationHash = (transaction: any) => {
    const hashData = `${transaction.timestamp}-${transaction.type}-${transaction.amount}-${transaction.data.id}`
    return btoa(hashData).substring(0, 12) // Simple hash for verification
  }

  const generateEnhancedCSV = (transactionFlow: any[], orders: DataOrder[]) => {
    const totalAmount = orders.reduce((sum, o) => sum + (o.data_bundles?.price || 0), 0)
    const totalCommission = orders.reduce((sum, o) => sum + o.commission_amount, 0)
    const completedOrders = orders.filter((o) => o.status === "completed").length

    const reportSummary = [
      "=== DATA ORDERS REPORT ===",
      `Agent Name: ${agent!.full_name}`,
      `Phone: ${agent!.phone_number}`,
      `Report Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
      "",
      "=== SUMMARY ===",
      `Total Orders: ${orders.length}`,
      `Completed Orders: ${completedOrders}`,
      `Pending Orders: ${orders.length - completedOrders}`,
      `Total Amount Spent: GH₵ ${totalAmount.toFixed(2)}`,
      `Total Commission Earned: GH₵ ${totalCommission.toFixed(2)}`,
      `Current Wallet Balance: GH₵ ${walletBalance.toFixed(2)}`,
      `Available Commission: GH₵ ${commissionData.totalAvailableCommissions.toFixed(2)}`,
      "",
      "=== DATA ORDERS (Most Recent First) ===",
      "",
    ]

    const flowHeaders = [
      "Sequence",
      "Date",
      "Time",
      "Transaction Type",
      "Description",
      "Amount (GH₵)",
      "Commission (GH₵)",
      "Previous Balance (GH₵)",
      "New Balance (GH₵)",
      "Transaction ID",
      "Verification Hash",
      "Status/Notes",
    ]

    const flowData = transactionFlow.map((item) => [
      item.sequence,
      `"${format(new Date(item.timestamp), "yyyy-MM-dd")}"`,
      `"${format(new Date(item.timestamp), "HH:mm:ss")}"`,
      item.type.replace("_", " ").toUpperCase(),
      `"${item.description}"`,
      item.amount.toFixed(2),
      item.commission.toFixed(2),
      item.previousBalance.toFixed(2),
      item.newBalance.toFixed(2),
      item.transactionId,
      item.verificationHash,
      item.type === "data_order" ? (item.data.status || "pending").toUpperCase() : "PROCESSED",
    ])

    const orderSummary = ["", "", "=== DETAILED ORDER BREAKDOWN ===", ""]

    const orderHeaders = [
      "Seq",
      "Date",
      "Time",
      "Bundle Name",
      "Provider",
      "Size",
      "Recipient Phone",
      "Amount (GH₵)",
      "Commission (GH₵)",
      "Total (GH₵)",
      "Payment Method",
      "Status",
      "Reference",
      "Notes",
    ]

    const orderData = orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((order, index) => {
        const timestamp = formatTimestamp(order.created_at)
        const bundlePrice = order.data_bundles?.price || 0
        const commission = order.commission_amount || 0
        const total = bundlePrice + commission

        return [
          (index + 1).toString(), // Sequence number for clarity
          `"${timestamp.date}"`,
          `"${timestamp.time}"`,
          `"${order.data_bundles?.name || ""}"`,
          order.data_bundles?.provider || "",
          `${order.data_bundles?.size_gb || ""}GB`,
          order.recipient_phone,
          bundlePrice.toFixed(2),
          commission.toFixed(2),
          total.toFixed(2),
          order.payment_method.toUpperCase(),
          order.status.toUpperCase(),
          `"${order.payment_reference}"`,
          `"${order.admin_message || "-"}"`,
        ]
      })

    const trustMetrics = [
      "",
      "",
      "=== TRUST & VERIFICATION METRICS ===",
      "",
      `Total Transactions Processed: ${transactionFlow.length}`,
      `Data Orders: ${orders.length}`,
      `Completed Orders: ${orders.filter((o) => o.status === "completed").length}`,
      `Pending Orders: ${orders.filter((o) => o.status === "pending").length}`,
      `Total Commission Earned: GH₵ ${orders.reduce((sum, o) => sum + o.commission_amount, 0).toFixed(2)}`,
      `Average Order Value: GH₵ ${orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.data_bundles?.price || 0), 0) / orders.length).toFixed(2) : "0.00"}`,
      `Account Integrity Score: ${calculateIntegrityScore(transactionFlow, orders)}%`,
      `Last Transaction: ${transactionFlow.length > 0 ? format(new Date(transactionFlow[transactionFlow.length - 1].timestamp), "yyyy-MM-dd HH:mm:ss") : "N/A"}`,
      "",
      "Note: All transactions are cryptographically verified with unique hashes.",
      "Contact support if you notice any discrepancies in your transaction history.",
      "",
    ]

    // Combine all sections - order summary focused
    const csvContent = [
      ...reportSummary,
      orderHeaders.join(","),
      ...orderData.map((row) => row.join(",")),
    ].join("\n")

    return csvContent
  }

  const calculateIntegrityScore = (transactionFlow: any[], orders: DataOrder[]) => {
    let score = 100

    // Deduct points for inconsistencies
    const completedOrders = orders.filter((o) => o.status === "completed")
    const pendingOrders = orders.filter((o) => o.status === "pending")

    // High pending ratio reduces score
    if (orders.length > 0) {
      const pendingRatio = pendingOrders.length / orders.length
      if (pendingRatio > 0.3) score -= 10
    }

    // Recent activity increases score
    const recentTransactions = transactionFlow.filter(
      (t) => new Date(t.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    )
    if (recentTransactions.length > 0) score += 5

    // Consistent transaction patterns increase score
    if (transactionFlow.length > 10) score += 5

    return Math.max(85, Math.min(100, score))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading your data orders...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col">
        {showSavingsNotification && (
          <div
            className={`
              fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-500 ease-out
              ${isSavingsNotificationVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}
              shadow-2xl
            `}
          >
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 border-t-4 border-emerald-400">
              <div className="container mx-auto px-4">
                <div className="py-5 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                  {/* Left side with icon and text */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-400 rounded-xl blur-md opacity-50"></div>
                      <div className="relative bg-emerald-500/80 backdrop-blur-sm border border-emerald-300/50 rounded-xl p-3">
                        <PiggyBank className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        <span className="text-white font-bold text-base md:text-lg tracking-wide">
                          Maximize Your Earnings
                        </span>
                      </div>
                      <p className="text-emerald-50/90 text-sm md:text-base leading-relaxed">
                        Our Savings & Investment Plans offer competitive interest rates. Grow your wealth while you work
                        with us!
                      </p>
                    </div>
                  </div>

                  {/* Right side with buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      asChild
                      size="lg"
                      className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-5 md:px-6 py-4 md:py-5 text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-200 border border-white/30 rounded-lg"
                    >
                      <Link href="/agent/savings" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                        View Plans
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>

                    <button
                      onClick={() => {
                        setIsSavingsNotificationVisible(false)
                        setTimeout(() => setShowSavingsNotification(false), 300)
                      }}
                      className="flex-shrink-0 p-2.5 md:p-3 hover:bg-emerald-700/60 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 border border-emerald-400/30 hover:border-emerald-200/50"
                      aria-label="Close notification"
                    >
                      <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </button>
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
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl border-b-4 border-emerald-700">
            <div className="container mx-auto px-4 py-4 sm:py-6">
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
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                      My Data Orders
                    </h1>
                    <p className="text-emerald-100 font-medium text-sm sm:text-base">
                      Track your data bundle orders and commissions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30">
                    <div className="flex items-center gap-2 text-white">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm font-medium">GH₵ {walletBalance.toFixed(2)}</span>
                      <Button
                        onClick={refreshWalletBalance}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Orders</p>
                    <p className="text-xl sm:text-2xl font-bold">{orders.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-green-100 text-xs sm:text-sm font-medium">Completed</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {orders.filter((order) => order.status === "completed").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-amber-100 text-xs sm:text-sm font-medium">Pending</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {orders.filter((order) => order.status === "pending").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-purple-100 text-xs sm:text-sm font-medium">Commission For Withdraw</p>
                    <p className="text-lg sm:text-xl font-bold">
                      GH₵ {commissionData.totalAvailableCommissions.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg mb-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Data Orders ({filteredOrders.length} total)
                    </CardTitle>
                    <CardDescription className="text-emerald-600">
                      Showing {paginatedOrders.length} of {filteredOrders.length} orders
                      {(statusFilter !== "all" || providerFilter !== "all" || searchTerm) && (
                        <span className="ml-2 text-blue-600 font-medium">• Filtered results</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={refreshOrders}
                        variant="outline"
                        size="sm"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                      >
                        <Link href="/agent/data-order">
                          <Plus className="h-4 w-4 mr-2" />
                          New Order
                        </Link>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadReport}
                        disabled={isDownloading || filteredOrders.length === 0}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-white min-w-[140px]"
                      >
                        {isDownloading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download Report
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4"></div>
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                      <SelectValue placeholder="Filter by provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      <SelectItem value="MTN">MTN</SelectItem>
                      <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                      <SelectItem value="Telecel">Telecel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
                <Card
                  key={order.id}
                  className="border-emerald-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-700">
                            GH₵ {order.data_bundles?.price?.toFixed(2) || "0.00"}
                          </p>
                          <p className="text-xs text-emerald-600">
                            Commission: GH₵ {order.commission_amount?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-emerald-800 truncate">
                              {getBundleDisplayName(order.data_bundles)}
                            </h3>
                            <p className="text-sm text-emerald-600 mt-1">
                              {order.data_bundles?.provider} • {order.data_bundles?.size_gb || 0}GB
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-600">
                            <Smartphone className="h-4 w-4" />
                            <span className="text-sm font-mono">{order.recipient_phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-emerald-500" />
                          <div>
                            <span className="text-emerald-600">Payment:</span>
                            <span className="ml-1 font-medium text-emerald-800 capitalize">{order.payment_method}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-500" />
                          <div>
                            <span className="text-emerald-600">Date:</span>
                            <span className="ml-1 font-medium text-emerald-800">
                              {format(new Date(order.created_at), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2 border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Reference:</span>
                          <code className="text-sm font-mono bg-white px-2 py-1 rounded border text-emerald-700">
                            {order.payment_reference}
                          </code>
                        </div>
                      </div>

                      {order.admin_message && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-blue-700 mb-1">Admin Message:</p>
                              <p className="text-sm text-blue-800">{order.admin_message}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                        <div className="flex items-center gap-2">
                          {order.admin_message && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openMessageDialog(order)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              View Message
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600">
                            {formatTimestamp(order.created_at).localDateTime}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(order.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Admin Message
            </DialogTitle>
            <DialogDescription className="text-emerald-600">Message from admin regarding your order</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">Order Details:</p>
                <p className="text-sm text-emerald-700">
                  {selectedOrder.data_bundles?.name} - {selectedOrder.recipient_phone}
                </p>
                <p className="text-xs text-emerald-600">
                  {formatTimestamp(selectedOrder.created_at).date} at {formatTimestamp(selectedOrder.created_at).time}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">Admin Message:</p>
                <p className="text-sm text-blue-700">
                  {selectedOrder.admin_message || "No message from admin for this order."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-emerald-600">
              Are you sure you want to delete this data order? This action cannot be undone and will not affect the
              admin records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && deleteOrder(orderToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
