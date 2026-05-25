"use client"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
  import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
  import {
  Search,
  Download,
  Trash2,
  User,
  Wallet,
  TrendingUp,
  Calendar,
  Phone,
  Shield,
  RefreshCw,
  FileText,
  Database,
  Upload,
  Home,
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client";
import { getAgentDisplayBalances } from "@/lib/agent-display-balances";
import { toast } from "sonner"
import { isAgentProfileVerified } from "@/lib/agent-profile-completion"
import { AdminAgentVerificationBadge } from "@/components/admin/AdminAgentVerificationBadge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Agent {
  id: string
  full_name: string
  phone_number: string
  wallet_balance: number
  total_commission_earned: number
  total_orders: number
  total_referrals: number
  status: string
  created_at: string
  last_login: string
  is_approved: boolean
  region?: string
  commission_balance?: number
  can_publish_products?: boolean
  can_update_products?: boolean
  can_publish_properties?: boolean
  can_update_properties?: boolean
  can_teach?: boolean
  isbanned?: boolean
}

interface AgentTransactionSummary {
  total_wallet_transactions: number
  total_manual_transactions: number
  total_data_orders: number
  total_wholesale_orders: number
  total_referrals_made: number
  total_referrals_received: number
  total_withdrawals: number
  wallet_balance: number
  commission_balance: number
  first_transaction_date: string
  last_transaction_date: string
}

const ITEMS_PER_PAGE = 12

export default function AgentManagementTab() {
  // ---------- State ----------
  const [agents, setAgents] = useState<Agent[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentSummary, setAgentSummary] = useState<AgentTransactionSummary | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearingAgent, setClearingAgent] = useState<Agent | null>(null)
  const [operationLoading, setOperationLoading] = useState(false)
  const [clearRecordsAgentId, setClearRecordsAgentId] = useState<string | null>(null)
  const [searchInitiated, setSearchInitiated] = useState(false)
  const [verificationFilter, setVerificationFilter] = useState("All Agents")
  const [verificationStats, setVerificationStats] = useState({ verified: 0, total: 0 })

  // ---------- Helper: fetch paginated agents with stats ----------
  const fetchAgentsPage = useCallback(async (page: number, search: string, verifyFilter: string) => {
    if (!search.trim()) {
      setAgents([])
      setTotalCount(0)
      setSearchInitiated(false)
      return { agents: [], total: 0 }
    }

    setLoadingPage(true)
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE
      const verificationOnly = verifyFilter === "Verified" || verifyFilter === "Unverified"

      let query = supabase
        .from("agents")
        .select("id, full_name, phone_number, email, profession, exact_location, profile_image_url, wallet_balance, created_at, last_login, isapproved, isbanned, region, can_publish_products, can_update_products, can_publish_properties, can_update_properties, can_teach", { count: "exact" })
        .or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%,profession.ilike.%${search}%,exact_location.ilike.%${search}%`)
        .order("created_at", { ascending: false })

      if (verificationOnly) {
        query = query.limit(500)
      } else {
        query = query.range(offset, offset + ITEMS_PER_PAGE - 1)
      }

      const { data: rawAgents, error, count } = await query
      if (error) throw error

      if (!rawAgents || rawAgents.length === 0) {
        return { agents: [], total: count || 0 }
      }

      // Batch‑fetch statistics for these agent IDs only
      const agentIds = rawAgents.map(a => a.id)

      const { data: ordersData } = await supabase
        .from("data_orders")
        .select("agent_id")
        .in("agent_id", agentIds)
        .eq("status", "completed")
      const ordersCountMap = new Map<string, number>()
      if (ordersData) {
        const counts: Record<string, number> = {}
        ordersData.forEach(o => { counts[o.agent_id] = (counts[o.agent_id] || 0) + 1 })
        Object.entries(counts).forEach(([id, c]) => ordersCountMap.set(id, c))
      }

      const { data: referralsData } = await supabase
        .from("referrals")
        .select("referrer_id")
        .in("referrer_id", agentIds)
        .eq("status", "completed")
      const referralsCountMap = new Map<string, number>()
      if (referralsData) {
        const counts: Record<string, number> = {}
        referralsData.forEach(r => { counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1 })
        Object.entries(counts).forEach(([id, c]) => referralsCountMap.set(id, c))
      }

      let agentsWithStats = await Promise.all(
        rawAgents.map(async (agent) => {
          let commissionBalance = 0
          let liveWalletBalance = agent.wallet_balance || 0
          try {
            const balances = await getAgentDisplayBalances(agent.id)
            liveWalletBalance = balances.wallet_balance
            commissionBalance = balances.commission_balance
          } catch {
            /* keep defaults */
          }
          return {
            ...agent,
            wallet_balance: liveWalletBalance,
            total_commission_earned: commissionBalance,
            commission_balance: commissionBalance,
            status: agent.status || "active",
            last_login: agent.last_login || agent.last_activity_at,
            is_approved: agent.isapproved === true,
            region: agent.region || "N/A",
            total_orders: ordersCountMap.get(agent.id) || 0,
            total_referrals: referralsCountMap.get(agent.id) || 0,
            can_publish_products: agent.can_publish_products || false,
            can_update_products: agent.can_update_products || false,
            can_publish_properties: agent.can_publish_properties || false,
            can_update_properties: agent.can_update_properties || false,
            isbanned: agent.isbanned === true,
          }
        })
      )

      if (verifyFilter === "Verified") {
        agentsWithStats = agentsWithStats.filter((a) => isAgentProfileVerified(a))
      } else if (verifyFilter === "Unverified") {
        agentsWithStats = agentsWithStats.filter((a) => !isAgentProfileVerified(a))
      }

      const filteredTotal = agentsWithStats.length
      if (verificationOnly) {
        agentsWithStats = agentsWithStats.slice(offset, offset + ITEMS_PER_PAGE)
      }

      return {
        agents: agentsWithStats,
        total: verificationOnly ? filteredTotal : count || 0,
      }
    } catch (error) {
      console.error("Error fetching agents page:", error)
      toast.error(`Failed to load agents: ${error instanceof Error ? error.message : "Unknown error"}`)
      return { agents: [], total: 0 }
    } finally {
      setLoadingPage(false)
    }
  }, [])

  useEffect(() => {
    const loadVerificationStats = async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("email, profession, exact_location, profile_image_url")
        if (error) throw error
        const rows = data || []
        const verified = rows.filter((a) => isAgentProfileVerified(a)).length
        setVerificationStats({ verified, total: rows.length })
      } catch {
        /* optional */
      }
    }
    loadVerificationStats()
  }, [])

  // Load initial page when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setAgents([])
        setTotalCount(0)
        setSearchInitiated(false)
        setCurrentPage(1)
        return
      }
      setSearchInitiated(true)
      setLoading(true)
      const { agents: newAgents, total } = await fetchAgentsPage(1, searchTerm, verificationFilter)
      setAgents(newAgents)
      setTotalCount(total)
      setCurrentPage(1)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, verificationFilter, fetchAgentsPage])

  const loadPage = useCallback(async (page: number) => {
    if (page === currentPage && agents.length > 0) return
    const { agents: newAgents } = await fetchAgentsPage(page, searchTerm, verificationFilter)
    setAgents(newAgents)
    setCurrentPage(page)
  }, [searchTerm, verificationFilter, fetchAgentsPage, currentPage, agents.length])

  const refreshCurrentPage = useCallback(async () => {
    const { agents: newAgents, total } = await fetchAgentsPage(currentPage, searchTerm, verificationFilter)
    setAgents(newAgents)
    setTotalCount(total)
  }, [fetchAgentsPage, currentPage, searchTerm, verificationFilter])

  const fetchAgentSummary = async (agentId: string) => {
    try {
      setOperationLoading(true)
      if (!agentId || agentId.trim() === "") return
      const response = await fetch(`/api/admin/agents/${agentId}/summary`, {
        method: "GET",
        headers: getAdminAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch summary")
      const summary = await response.json()
      setAgentSummary(summary)
    } catch (error) {
      console.error(error)
      toast.error("Could not load transaction summary")
    } finally {
      setOperationLoading(false)
    }
  }

  const downloadAgentData = async (agent: Agent) => {
    try {
      setOperationLoading(true)
      toast.info("Preparing download...")
      const response = await fetch(`/api/admin/agents/${agent.id}/export-csv`, {
        method: "GET",
        headers: getAdminAuthHeaders(),
      })
      if (!response.ok) throw new Error("Export failed")
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `agent_${agent.full_name.replace(/\s+/g, "_")}_${agent.id}_reports.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success("Exported successfully")
    } catch (error) {
      toast.error("Export failed")
    } finally {
      setOperationLoading(false)
    }
  }

  const clearAgentRecords = async (agent: Agent) => {
    setClearRecordsAgentId(agent.id)
    try {
      const response = await fetch(`/api/admin/agents/${agent.id}/clear-records`, {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ confirm: true, agent_id: agent.id, agent_name: agent.full_name }),
      })
      if (!response.ok) throw new Error("Clear failed")
      toast.success(`Cleared all records for ${agent.full_name}`)
      await refreshCurrentPage()
      setShowClearDialog(false)
      setClearingAgent(null)
    } catch (error) {
      toast.error("Failed to clear records")
    } finally {
      setClearRecordsAgentId(null)
    }
  }

  const handleViewDetails = async (agent: Agent) => {
    try {
      const balances = await getAgentDisplayBalances(agent.id)
      setSelectedAgent({
        ...agent,
        wallet_balance: balances.wallet_balance,
        commission_balance: balances.commission_balance,
        total_commission_earned: balances.total_commission_earned,
        is_approved: agent.is_approved,
      })
      setShowDetailsDialog(true)
      await fetchAgentSummary(agent.id)
    } catch {
      setSelectedAgent(agent)
      setShowDetailsDialog(true)
    }
  }

  const handleClearRecords = (agent: Agent) => {
    setClearingAgent(agent)
    setShowClearDialog(true)
  }

  const togglePublishPermission = async (agent: Agent, newValue: boolean) => {
    try {
      setOperationLoading(true)
      const response = await fetch(`/api/admin/agents/${agent.id}/publish-permission`, {
        method: "PUT",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ can_publish_products: newValue }),
      })
      if (!response.ok) throw new Error("Update failed")
      await refreshCurrentPage()
      if (selectedAgent?.id === agent.id) setSelectedAgent({ ...selectedAgent, can_publish_products: newValue })
      toast.success(`${newValue ? "Enabled" : "Disabled"} product publishing`)
    } catch (error) {
      toast.error("Failed to update permission")
    } finally {
      setOperationLoading(false)
    }
  }

  const toggleUpdatePermission = async (agent: Agent, newValue: boolean) => {
    try {
      setOperationLoading(true)
      const response = await fetch(`/api/admin/agents/${agent.id}/update-permission`, {
        method: "PUT",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ can_update_products: newValue }),
      })
      if (!response.ok) throw new Error("Update failed")
      await refreshCurrentPage()
      if (selectedAgent?.id === agent.id) setSelectedAgent({ ...selectedAgent, can_update_products: newValue })
      toast.success(`${newValue ? "Enabled" : "Disabled"} product editing`)
    } catch (error) {
      toast.error("Failed to update permission")
    } finally {
      setOperationLoading(false)
    }
  }

  const togglePublishPropertyPermission = async (agent: Agent, newValue: boolean) => {
    try {
      setOperationLoading(true)
      const response = await fetch(`/api/admin/agents/${agent.id}/publish-property-permission`, {
        method: "PUT",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ can_publish_properties: newValue }),
      })
      if (!response.ok) throw new Error("Update failed")
      await refreshCurrentPage()
      if (selectedAgent?.id === agent.id) setSelectedAgent({ ...selectedAgent, can_publish_properties: newValue })
      toast.success(`${newValue ? "Enabled" : "Disabled"} property publishing`)
    } catch (error) {
      toast.error("Failed to update permission")
    } finally {
      setOperationLoading(false)
    }
  }

  const toggleUpdatePropertyPermission = async (agent: Agent, newValue: boolean) => {
    try {
      setOperationLoading(true)
      const response = await fetch(`/api/admin/agents/${agent.id}/update-property-permission`, {
        method: "PUT",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ can_update_properties: newValue }),
      })
      if (!response.ok) throw new Error("Update failed")
      await refreshCurrentPage()
      if (selectedAgent?.id === agent.id) setSelectedAgent({ ...selectedAgent, can_update_properties: newValue })
      toast.success(`${newValue ? "Enabled" : "Disabled"} property editing`)
    } catch (error) {
      toast.error("Failed to update permission")
    } finally {
      setOperationLoading(false)
    }
  }

  const toggleTeachPermission = async (agent: Agent, newValue: boolean) => {
    try {
      setOperationLoading(true)
      const response = await fetch(`/api/admin/agents/${agent.id}/teach-permission`, {
        method: "PUT",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ can_teach: newValue }),
      })
      if (!response.ok) throw new Error("Update failed")
      await refreshCurrentPage()
      if (selectedAgent?.id === agent.id) setSelectedAgent({ ...selectedAgent, can_teach: newValue })
      toast.success(`${newValue ? "Granted" : "Revoked"} teacher approval`)
    } catch {
      toast.error("Failed to update teacher permission")
    } finally {
      setOperationLoading(false)
    }
  }

  const suspendStorefront = async (agent: Agent) => {
    if (!confirm(`Suspend storefront for ${agent.full_name}? All products, services, and listings will be hidden.`)) {
      return
    }
    try {
      setOperationLoading(true)
      const response = await fetch(`/api/admin/agents/${agent.id}/suspend-storefront`, {
        method: "POST",
        headers: getAdminAuthHeaders(),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Suspend failed")
      await refreshCurrentPage()
      if (selectedAgent?.id === agent.id) setSelectedAgent({ ...selectedAgent, isbanned: true })
      toast.success("Storefront suspended")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to suspend storefront")
    } finally {
      setOperationLoading(false)
    }
  }

  const reactivateStorefront = async (agent: Agent) => {
    try {
      setOperationLoading(true)
      const response = await fetch(`/api/admin/agents/${agent.id}/reactivate-storefront`, {
        method: "POST",
        headers: getAdminAuthHeaders(),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Reactivate failed")
      await refreshCurrentPage()
      if (selectedAgent?.id === agent.id) setSelectedAgent({ ...selectedAgent, isbanned: false })
      toast.success("Storefront reactivated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reactivate storefront")
    } finally {
      setOperationLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const PaginationControls = () => {
    if (totalPages <= 1) return null
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    return (
      <div className="flex justify-center mt-6">
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => loadPage(currentPage - 1)} disabled={currentPage === 1 || loadingPage}>Previous</Button>
          {pages.map(p => (
            <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" onClick={() => loadPage(p)} disabled={loadingPage} className={currentPage === p ? "bg-emerald-600" : ""}>{p}</Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => loadPage(currentPage + 1)} disabled={currentPage === totalPages || loadingPage}>Next</Button>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (loading && !searchInitiated) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>)}
        </div>
      </div>
    )
  }

  // Empty search prompt
  if (!searchInitiated && !searchTerm) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-red-600" />Agent Management</h2>
            <p className="text-gray-600">Search for specific agents to manage their records and data</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search by name, phone, email, profession, or location..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Search for Agents</h3>
          <p className="text-gray-500">Enter an agent's name, phone number, or ID above</p>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-red-600" />Agent Management</h2>
          <p className="text-gray-600">Search for specific agents to manage their records and data</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search by name, phone, email, profession, or location..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Agents">All Agents</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {verificationStats.total > 0 && (
        <p className="text-sm text-emerald-800 font-medium">
          Verified: {verificationStats.verified} of {verificationStats.total} (
          {Math.round((verificationStats.verified / verificationStats.total) * 100)}%)
        </p>
      )}

      {searchInitiated && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Found {totalCount} agent{totalCount !== 1 ? "s" : ""} matching "{searchTerm}"</p>
            <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>Clear Search</Button>
          </div>

          {loadingPage ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12"><User className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium">No agents found</h3><p className="text-gray-500">Try a different search term.</p></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map(agent => (
                  <Card key={agent.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
                    <div className={`h-1.5 w-full ${agent.is_approved ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-amber-500 to-orange-400"}`} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                              <User className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 leading-tight">{agent.full_name}</h3>
                            <AdminAgentVerificationBadge agent={agent} className="mt-1" />
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200 px-2 py-0">
                                {agent.region || "No region"}
                              </Badge>
                              {agent.is_approved ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2 py-0">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Approved
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-0">
                                  <Clock className="h-3 w-3 mr-1" /> Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Joined</div>
                          <div className="text-sm font-medium text-gray-700">{new Date(agent.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-2.5 -mx-2.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-mono text-sm">{agent.phone_number}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-100">
                          <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
                            <Wallet className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wide">Wallet</span>
                          </div>
                          <p className="text-xl font-bold text-gray-800">₵{agent.wallet_balance.toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 text-center border border-emerald-100">
                          <div className="flex items-center justify-center gap-1 text-emerald-700 mb-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wide">Commission</span>
                          </div>
                          <p className="text-xl font-bold text-gray-800">₵{(agent.commission_balance || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center border border-purple-100">
                          <div className="flex items-center justify-center gap-1 text-purple-700 mb-1">
                            <Shield className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wide">Orders</span>
                          </div>
                          <p className="text-xl font-bold text-gray-800">{agent.total_orders}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 text-center border border-amber-100">
                          <div className="flex items-center justify-center gap-1 text-amber-700 mb-1">
                            <User className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wide">Referrals</span>
                          </div>
                          <p className="text-xl font-bold text-gray-800">{agent.total_referrals}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => downloadAgentData(agent)} disabled={operationLoading} className="flex-1 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                          <Download className="h-3.5 w-3.5 mr-1.5" /> CSV Export
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleClearRecords(agent)} disabled={operationLoading || clearRecordsAgentId === agent.id} className="flex-1 border-gray-200 hover:border-red-300 hover:bg-red-50 text-red-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleViewDetails(agent)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all">
                          <FileText className="h-3.5 w-3.5 mr-1.5" /> Details
                          <ArrowRight className="h-3 w-3 ml-1 opacity-70" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <PaginationControls />
            </>
          )}
        </>
      )}

      {/* Dialogs – identical to original */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Agent Details: {selectedAgent?.full_name}</DialogTitle><DialogDescription>Comprehensive overview</DialogDescription></DialogHeader>
          {selectedAgent && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card><CardHeader><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                  <div><strong>ID:</strong> {selectedAgent.id}</div>
                  <div><strong>Name:</strong> {selectedAgent.full_name}</div>
                  <div><strong>Phone:</strong> {selectedAgent.phone_number}</div>
                  <div><strong>Region:</strong> {selectedAgent.region || "N/A"}</div>
                  <div><strong>Status:</strong> <Badge className="ml-2">{selectedAgent.is_approved ? "Approved" : "Pending"}</Badge></div>
                  <div className="pt-4 border-t space-y-4">
                    <div className="font-semibold text-sm text-blue-600 flex items-center gap-2"><Shield className="h-4 w-4" />Wholesale Products</div>
                    <div className="flex items-center justify-between pl-4"><div className="flex items-center gap-2"><Upload className="h-4 w-4 text-blue-600" /><strong>Publish:</strong></div><Switch checked={selectedAgent.can_publish_products || false} onCheckedChange={(c) => togglePublishPermission(selectedAgent, c)} disabled={operationLoading} /></div>
                    <div className="flex items-center justify-between pl-4"><div className="flex items-center gap-2"><Upload className="h-4 w-4 text-green-600" /><strong>Edit:</strong></div><Switch checked={selectedAgent.can_update_products || false} onCheckedChange={(c) => toggleUpdatePermission(selectedAgent, c)} disabled={operationLoading} /></div>
                    <div className="font-semibold text-sm text-amber-600 flex items-center gap-2 pt-3 border-t"><Home className="h-4 w-4" />Properties</div>
                    <div className="flex items-center justify-between pl-4"><div className="flex items-center gap-2"><Upload className="h-4 w-4 text-amber-600" /><strong>Publish:</strong></div><Switch checked={selectedAgent.can_publish_properties || false} onCheckedChange={(c) => togglePublishPropertyPermission(selectedAgent, c)} disabled={operationLoading} /></div>
                    <div className="flex items-center justify-between pl-4"><div className="flex items-center gap-2"><Upload className="h-4 w-4 text-orange-600" /><strong>Edit:</strong></div><Switch checked={selectedAgent.can_update_properties || false} onCheckedChange={(c) => toggleUpdatePropertyPermission(selectedAgent, c)} disabled={operationLoading} /></div>
                    <div className="font-semibold text-sm text-[#0E8F3D] flex items-center gap-2 pt-3 border-t"><BookOpen className="h-4 w-4" />Dataflex Channels</div>
                    <div className="flex items-center justify-between pl-4"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#0E8F3D]" /><strong>Can Teach:</strong></div><Switch checked={selectedAgent.can_teach || false} onCheckedChange={(c) => toggleTeachPermission(selectedAgent, c)} disabled={operationLoading} /></div>
                    <div className="font-semibold text-sm text-red-600 flex items-center gap-2 pt-3 border-t"><Shield className="h-4 w-4" />Storefront</div>
                    {selectedAgent.isbanned ? (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={operationLoading}
                        onClick={() => reactivateStorefront(selectedAgent)}
                      >
                        Reactivate Storefront
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        disabled={operationLoading}
                        onClick={() => suspendStorefront(selectedAgent)}
                      >
                        Suspend Storefront
                      </Button>
                    )}
                  </div>
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm">Account Summary</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                  <div><strong>Wallet Balance:</strong> ₵{selectedAgent.wallet_balance.toLocaleString()}</div>
                  <div><strong>Commission For Withdraw:</strong> ₵{(selectedAgent.commission_balance || 0).toLocaleString()}</div>
                  <div><strong>Total Orders:</strong> {selectedAgent.total_orders}</div>
                  <div><strong>Total Referrals:</strong> {selectedAgent.total_referrals}</div>
                  <div><strong>Joined:</strong> {new Date(selectedAgent.created_at).toLocaleDateString()}</div>
                  <div><strong>Last Login:</strong> {selectedAgent.last_login ? new Date(selectedAgent.last_login).toLocaleDateString() : "Never"}</div>
                </CardContent></Card>
              </div>
              {operationLoading ? <Card><CardContent className="py-8 text-center"><RefreshCw className="h-6 w-6 animate-spin inline mr-2" />Loading summary...</CardContent></Card> : agentSummary && (
                <Card><CardHeader><CardTitle className="text-sm">Transaction Summary</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><div className="font-medium">Wallet TX</div><div className="text-blue-600">{agentSummary.total_wallet_transactions}</div></div>
                  <div><div className="font-medium">Manual TX</div><div className="text-green-600">{agentSummary.total_manual_transactions}</div></div>
                  <div><div className="font-medium">Data Orders</div><div className="text-purple-600">{agentSummary.total_data_orders}</div></div>
                  <div><div className="font-medium">Wholesale Orders</div><div className="text-orange-600">{agentSummary.total_wholesale_orders}</div></div>
                  <div><div className="font-medium">Referrals Made</div><div className="text-indigo-600">{agentSummary.total_referrals_made}</div></div>
                  <div><div className="font-medium">Referrals Received</div><div className="text-pink-600">{agentSummary.total_referrals_received}</div></div>
                  <div><div className="font-medium">Withdrawals</div><div className="text-red-600">{agentSummary.total_withdrawals}</div></div>
                  <div><div className="font-medium">Activity</div><div className="text-gray-600">{agentSummary.first_transaction_date ? `${new Date(agentSummary.first_transaction_date).toLocaleDateString()} - ${new Date(agentSummary.last_transaction_date).toLocaleDateString()}` : "No transactions"}</div></div>
                </div></CardContent></Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2 text-orange-600"><Database className="h-5 w-5" />Clear Agent Data Records</AlertDialogTitle></AlertDialogHeader>
          <div className="space-y-3 text-sm"><div className="bg-orange-50 border border-orange-200 rounded-lg p-3"><span className="font-medium text-orange-800 block mb-2">⚠️ Confirm Data Clearing</span><span className="text-orange-700">You are about to clear all data records for: <strong>{clearingAgent?.full_name}</strong></span></div><div className="bg-red-50 border border-red-200 rounded-lg p-3"><span className="font-bold text-red-800 block text-center">🚨 THIS ACTION CANNOT BE UNDONE 🚨</span></div></div>
          <AlertDialogFooter className="gap-2"><AlertDialogCancel disabled={clearRecordsAgentId !== null}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => clearingAgent && clearAgentRecords(clearingAgent)} disabled={clearRecordsAgentId !== null} className="bg-orange-600 hover:bg-orange-700">{clearRecordsAgentId ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Clearing...</> : <><Database className="h-4 w-4 mr-2" />Clear Data Records</>}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}