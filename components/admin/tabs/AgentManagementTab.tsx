"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import { calculateWalletBalance } from "@/lib/earnings-calculator"

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

export default function AgentManagementTab() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentSummary, setAgentSummary] = useState<AgentTransactionSummary | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearingAgent, setClearingAgent] = useState<Agent | null>(null)
  const [operationLoading, setOperationLoading] = useState(false)
  const [searchInitiated, setSearchInitiated] = useState(false)

  const searchAgents = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setAgents([])
      setFilteredAgents([])
      setSearchInitiated(false)
      return
    }
    try {
      setLoading(true)
      setSearchInitiated(true)
      console.log("🔍 Searching for agents with query:", searchQuery)
      let searchResults, searchError
      try {
        const result = await supabase
          .from("agents")
          .select(`
            id,
            full_name,
            phone_number,
            wallet_balance,
            status,
            created_at,
            last_login,
            isapproved,
            region,
            last_activity_at,
            can_publish_products,
            can_update_products,
            can_publish_properties,
            can_update_properties
          `)
          .or(`full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
          .order("created_at", { ascending: false })
          .limit(50)
        if (!result.error && searchQuery.match(/^[0-9a-fA-F-]{36}$/)) {
          const byId = await supabase.from("agents").select("*").eq("id", searchQuery)
          if (!byId.error && byId.data.length > 0) {
            result.data = [...result.data, ...byId.data]
          }
        }
        searchResults = result.data
        searchError = result.error
      } catch (queryError) {
        console.error("❌ Query execution failed:", queryError?.message || queryError)
        searchError = queryError
        searchResults = null
      }
      if (searchError) {
        console.error("❌ Search query failed:", searchError?.message || searchError)
        try {
          console.log("🔄 Attempting fallback search...")
          const fallbackResult = await supabase
            .from("agents")
            .select("id, full_name, phone_number, created_at, wallet_balance, isapproved, can_publish_products, can_update_products, can_publish_properties, can_update_properties")
            .ilike("full_name", `%${searchQuery}%`)
            .limit(20)
          if (fallbackResult.error) {
            throw fallbackResult.error
          }
          console.log("✅ Fallback search successful")
          searchResults = fallbackResult.data
          searchError = null
        } catch (fallbackError) {
          console.error("❌ Fallback search also failed:", fallbackError?.message || fallbackError)
          toast.error(`Search failed: ${searchError.message || "Database connection error"}`)
          return
        }
      }
      console.log("✅ Search successful, found agents:", searchResults?.length || 0)
      const agentsWithStats = await Promise.all(
        (searchResults || []).map(async (agent) => {
          try {
            let totalOrders = 0
            let totalReferrals = 0
            let commissionBalance = 0
            let liveWalletBalance = agent.wallet_balance || 0
            try {
              const ordersResult = await supabase
                .from("data_orders")
                .select("id", { count: "exact", head: true })
                .eq("agent_id", agent.id)
                .eq("status", "completed")
              totalOrders = ordersResult.count || 0
            } catch {
              console.warn("Could not fetch orders for agent:", agent.id)
            }
            try {
              const referralsResult = await supabase
                .from("referrals")
                .select("id", { count: "exact", head: true })
                .eq("referrer_id", agent.id)
                .eq("status", "completed")
              totalReferrals = referralsResult.count || 0
            } catch {
              console.warn("Could not fetch referrals for agent:", agent.id)
            }
            try {
              const commissionSummary = await getAgentCommissionSummary(agent.id)
              commissionBalance = commissionSummary.availableForWithdrawal || 0
            } catch (commissionError) {
              console.warn("Could not fetch commission balance for agent:", agent.id, commissionError)
            }
            try {
              liveWalletBalance = await calculateWalletBalance(agent.id)
              console.log(`✅ Admin Management: Live wallet balance for ${agent.full_name}: ${liveWalletBalance}`)
            } catch (walletError) {
              console.warn("Could not calculate live wallet balance for agent:", agent.id, walletError)
            }
            return {
              ...agent,
              wallet_balance: liveWalletBalance,
              total_commission_earned: commissionBalance,
              commission_balance: commissionBalance,
              status: agent.status || "active",
              last_login: agent.last_login || agent.last_activity_at,
              is_approved: agent.isapproved === true,  // Only approved if explicitly true, never default to true
              region: agent.region || "N/A",
              total_orders: totalOrders,
              total_referrals: totalReferrals,
              can_publish_products: agent.can_publish_products || false,
              can_update_products: agent.can_update_products || false,
            }
          } catch (statError) {
            console.warn("⚠️ Failed to process agent:", agent.id, statError)
            return {
              ...agent,
              wallet_balance: agent.wallet_balance || 0,
              total_commission_earned: 0,
              commission_balance: 0,
              status: agent.status || "active",
              last_login: agent.last_login || agent.last_activity_at,
              is_approved: agent.isapproved === true,  // Only approved if explicitly true, never default to true
              region: agent.region || "N/A",
              total_orders: 0,
              total_referrals: 0,
              can_publish_products: agent.can_publish_products || false,
              can_update_products: agent.can_update_products || false,
            }
          }
        }),
      )
      console.log("✅ Successfully processed", agentsWithStats.length, "agents")
      setAgents(agentsWithStats)
      setFilteredAgents(agentsWithStats)
    } catch (error) {
      console.error("💥 Error in searchAgents:", error?.message || error)
      toast.error(`Failed to search agents: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAgents(searchTerm)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchAgents])

  const fetchAgentSummary = async (agentId: string) => {
    try {
      setOperationLoading(true)
      
      if (!agentId || agentId.trim() === "") {
        console.error("[v0] No agent ID provided to fetchAgentSummary")
        return
      }
      
      const response = await fetch(`/api/admin/agents/${agentId}/summary`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      const responseText = await response.text()
      
      if (!response.ok) {
        let errorMessage = "Failed to fetch agent summary"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Continue with default error message
        }
        throw new Error(errorMessage)
      }
      
      try {
        const summary = JSON.parse(responseText)
        setAgentSummary(summary)
      } catch (parseError) {
        console.error("JSON parsing error:", parseError)
        throw new Error("Invalid response format from server")
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch agent transaction summary"
      console.error("[v0] Error fetching agent summary:", errorMsg)
      // Only show toast for real errors, not for missing ID
      if (errorMsg !== "Failed to fetch agent summary" && !errorMsg.includes("Agent ID")) {
        toast.error(errorMsg)
      }
    } finally {
      setOperationLoading(false)
    }
  }

  const downloadAgentData = async (agent: Agent) => {
    try {
      setOperationLoading(true)
      toast.info("Preparing agent data for download...")
      const response = await fetch(`/api/admin/agents/${agent.id}/export-csv`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error("Failed to export agent data")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `agent_${agent.full_name?.replace(/\s+/g, "_") || "unknown"}_${agent.id}_reports.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success("Agent data exported successfully!")
    } catch (error) {
      console.error("Error downloading agent data:", error?.message || error)
      toast.error("Failed to download agent data")
    } finally {
      setOperationLoading(false)
    }
  }

  const clearAgentRecords = async (agent: Agent) => {
    try {
      setOperationLoading(true)
      toast.info("Clearing agent records...")
      const response = await fetch(`/api/admin/agents/${agent.id}/clear-records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirm: true,
          agent_id: agent.id,
          agent_name: agent.full_name,
        }),
      })
      const responseText = await response.text()
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parsing error in clear records:", parseError)
        console.error("Response text:", responseText)
        throw new Error("Invalid JSON response from clear records endpoint")
      }
      if (!response.ok) {
        throw new Error(result.error || "Failed to clear agent records")
      }
      toast.success(`Successfully cleared all records for ${agent.full_name}`)
      if (searchTerm.trim()) {
        await searchAgents(searchTerm)
      }
      setShowClearDialog(false)
      setClearingAgent(null)
    } catch (error) {
      console.error("Error clearing agent records:", error?.message || error)
      toast.error(`Failed to clear agent records: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setOperationLoading(false)
    }
  }

  const handleViewDetails = async (agent: Agent) => {
    try {
      // Ensure agent has valid ID
      if (!agent.id) {
        console.error("Agent ID is missing")
        toast.error("Failed to load agent details - Agent ID missing")
        return
      }

      // Fetch fresh agent data including all permission fields
      const { data: freshAgent, error } = await supabase
        .from("agents")
        .select("id, full_name, phone_number, wallet_balance, created_at, can_publish_products, can_update_products, can_publish_properties, can_update_properties, status, isapproved")
        .eq("id", agent.id)
        .single()

      if (error || !freshAgent) {
        console.error("Error fetching fresh agent data:", error)
        setSelectedAgent(agent)
      } else {
        setSelectedAgent({
          ...agent,
          ...freshAgent,
          can_publish_products: freshAgent.can_publish_products,
          can_update_products: freshAgent.can_update_products,
          can_publish_properties: freshAgent.can_publish_properties,
          can_update_properties: freshAgent.can_update_properties,
          is_approved: freshAgent.isapproved,
        })
      }
      
      setShowDetailsDialog(true)
      // Fetch summary with the verified agent ID
      await fetchAgentSummary(agent.id)
    } catch (error) {
      console.error("Error in handleViewDetails:", error)
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
      
      // Guard: ensure agent has valid ID
      if (!agent?.id) {
        throw new Error("Agent ID is missing. Please close and reopen the agent details.")
      }
      
      // Use API endpoint to update publish permission (avoids schema cache issues)
      const response = await fetch(`/api/admin/agents/${agent.id}/publish-permission`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ can_publish_products: newValue }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update permission")
      }

      const result = await response.json()

      // Update selected agent state immediately
      if (selectedAgent && selectedAgent.id === agent.id) {
        const updated = { ...selectedAgent, can_publish_products: newValue }
        setSelectedAgent(updated)
      }

      // Update agents list
      const updatedAgents = agents.map((a) => 
        a.id === agent.id ? { ...a, can_publish_products: newValue } : a
      )
      setAgents(updatedAgents)
      
      // Update filtered agents list
      const updatedFilteredAgents = filteredAgents.map((a) => 
        a.id === agent.id ? { ...a, can_publish_products: newValue } : a
      )
      setFilteredAgents(updatedFilteredAgents)

      toast.success(
        `${newValue ? "Enabled" : "Disabled"} product publishing for ${agent.full_name}`
      )
    } catch (error) {
      console.error("Error toggling publish permission:", error)
      // Revert the UI state if DB update fails
      if (selectedAgent && selectedAgent.id === agent.id) {
        setSelectedAgent({ ...selectedAgent, can_publish_products: !newValue })
      }
      toast.error(error instanceof Error ? error.message : "Failed to update publishing permission")
    } finally {
      setOperationLoading(false)
    }
  }

  const toggleUpdatePermission = async (agent: Agent, newValue: boolean) => {
    try {
      setOperationLoading(true)
      
      // Guard: ensure agent has valid ID
      if (!agent?.id) {
        throw new Error("Agent ID is missing. Please close and reopen the agent details.")
      }
      
      // Use API endpoint to update update permission
      const response = await fetch(`/api/admin/agents/${agent.id}/update-permission`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ can_update_products: newValue }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update permission")
      }

      const result = await response.json()

      // Update selected agent state immediately
      if (selectedAgent && selectedAgent.id === agent.id) {
        const updated = { ...selectedAgent, can_update_products: newValue }
        setSelectedAgent(updated)
      }

      // Update agents list
      const updatedAgents = agents.map((a) => 
        a.id === agent.id ? { ...a, can_update_products: newValue } : a
      )
      setAgents(updatedAgents)
      
      // Update filtered agents list
      const updatedFilteredAgents = filteredAgents.map((a) => 
        a.id === agent.id ? { ...a, can_update_products: newValue } : a
      )
      setFilteredAgents(updatedFilteredAgents)

      toast.success(
        `${newValue ? "Enabled" : "Disabled"} product editing for ${agent.full_name}`
      )
    } catch (error) {
      console.error("Error toggling update permission:", error)
      // Revert the UI state if DB update fails
      if (selectedAgent && selectedAgent.id === agent.id) {
        setSelectedAgent({ ...selectedAgent, can_update_products: !newValue })
      }
      toast.error(error instanceof Error ? error.message : "Failed to update product editing permission")
    } finally {
      setOperationLoading(false)
    }
  }

  const togglePublishPropertyPermission = async (agent: Agent, newValue: boolean) => {
    try {
      setOperationLoading(true)
      
      // Guard: ensure agent has valid ID
      if (!agent?.id) {
        throw new Error("Agent ID is missing. Please close and reopen the agent details.")
      }
      
      // Use API endpoint to update publish property permission
      const response = await fetch(`/api/admin/agents/${agent.id}/publish-property-permission`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ can_publish_properties: newValue }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update permission")
      }

      const result = await response.json()

      // Update selected agent state immediately
      if (selectedAgent && selectedAgent.id === agent.id) {
        const updated = { ...selectedAgent, can_publish_properties: newValue }
        setSelectedAgent(updated)
      }

      // Update agents list
      const updatedAgents = agents.map((a) => 
        a.id === agent.id ? { ...a, can_publish_properties: newValue } : a
      )
      setAgents(updatedAgents)
      
      // Update filtered agents list
      const updatedFilteredAgents = filteredAgents.map((a) => 
        a.id === agent.id ? { ...a, can_publish_properties: newValue } : a
      )
      setFilteredAgents(updatedFilteredAgents)

      toast.success(
        `${newValue ? "Enabled" : "Disabled"} property publishing for ${agent.full_name}`
      )
    } catch (error) {
      console.error("Error toggling publish property permission:", error)
      // Revert the UI state if DB update fails
      if (selectedAgent && selectedAgent.id === agent.id) {
        setSelectedAgent({ ...selectedAgent, can_publish_properties: !newValue })
      }
      toast.error(error instanceof Error ? error.message : "Failed to update property publishing permission")
    } finally {
      setOperationLoading(false)
    }
  }

  const toggleUpdatePropertyPermission = async (agent: Agent, newValue: boolean) => {
    try {
      setOperationLoading(true)
      
      // Guard: ensure agent has valid ID
      if (!agent?.id) {
        throw new Error("Agent ID is missing. Please close and reopen the agent details.")
      }
      
      // Use API endpoint to update update property permission
      const response = await fetch(`/api/admin/agents/${agent.id}/update-property-permission`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ can_update_properties: newValue }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update permission")
      }

      const result = await response.json()

      // Update selected agent state immediately
      if (selectedAgent && selectedAgent.id === agent.id) {
        const updated = { ...selectedAgent, can_update_properties: newValue }
        setSelectedAgent(updated)
      }

      // Update agents list
      const updatedAgents = agents.map((a) => 
        a.id === agent.id ? { ...a, can_update_properties: newValue } : a
      )
      setAgents(updatedAgents)
      
      // Update filtered agents list
      const updatedFilteredAgents = filteredAgents.map((a) => 
        a.id === agent.id ? { ...a, can_update_properties: newValue } : a
      )
      setFilteredAgents(updatedFilteredAgents)

      toast.success(
        `${newValue ? "Enabled" : "Disabled"} property editing for ${agent.full_name}`
      )
    } catch (error) {
      console.error("Error toggling update property permission:", error)
      // Revert the UI state if DB update fails
      if (selectedAgent && selectedAgent.id === agent.id) {
        setSelectedAgent({ ...selectedAgent, can_update_properties: !newValue })
      }
      toast.error(error instanceof Error ? error.message : "Failed to update property editing permission")
    } finally {
      setOperationLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            Agent Management
          </h2>
          <p className="text-gray-600 mt-1">Search for specific agents to manage their records and data</p>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search agents by name, phone, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
      </div>
      {!searchInitiated && !searchTerm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Agents</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter an agent's name, phone number, or ID in the search box above to find and manage their records.
          </p>
        </div>
      )}
      {searchInitiated && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Found {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""} matching "{searchTerm}"
          </p>
          {searchTerm && (
            <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          )}
        </div>
      )}
      {searchInitiated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">{agent.full_name}</CardTitle>
                      <p className="text-sm text-gray-500">{agent.phone_number}</p>
                    </div>
                  </div>
                  <Badge
                    variant={agent.is_approved ? "default" : "secondary"}
                    className={agent.is_approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                  >
                    {agent.is_approved ? "Approved" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{agent.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Joined {new Date(agent.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">₵{agent.wallet_balance.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500">Wallet</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">₵{agent.commission_balance?.toLocaleString() || "0"}</span>
                    </div>
                    <p className="text-xs text-gray-500">Commission For Withdraw</p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium">{agent.total_orders}</span>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium">{agent.total_referrals}</span>
                    <p className="text-xs text-gray-500">Referrals</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAgentData(agent)}
                    disabled={operationLoading}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    CSV Export
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleClearRecords(agent)}
                    disabled={operationLoading}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Records
                  </Button>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleViewDetails(agent)} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {searchInitiated && filteredAgents.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-500">
            No agents match your search criteria "{searchTerm}". Try adjusting your search terms.
          </p>
        </div>
      )}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Agent Details: {selectedAgent?.full_name}
            </DialogTitle>
            <DialogDescription>Comprehensive overview of agent data and transaction history</DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>ID:</strong> {selectedAgent.id}
                    </div>
                    <div>
                      <strong>Name:</strong> {selectedAgent.full_name}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedAgent.phone_number}
                    </div>
                    <div>
                      <strong>Region:</strong> {selectedAgent.region || "N/A"}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <Badge className="ml-2" variant={selectedAgent.is_approved ? "default" : "secondary"}>
                        {selectedAgent.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                    <div className="pt-4 border-t space-y-4">
                      <div className="font-semibold text-sm text-blue-600 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Wholesale Products
                      </div>
                      <div className="flex items-center justify-between pl-4">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-blue-600" />
                          <strong>Publish:</strong>
                        </div>
                        <Switch
                          checked={selectedAgent.can_publish_products || false}
                          onCheckedChange={(checked) => togglePublishPermission(selectedAgent, checked)}
                          disabled={operationLoading}
                        />
                      </div>
                      <div className="flex items-center justify-between pl-4">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-green-600" />
                          <strong>Edit:</strong>
                        </div>
                        <Switch
                          checked={selectedAgent.can_update_products || false}
                          onCheckedChange={(checked) => toggleUpdatePermission(selectedAgent, checked)}
                          disabled={operationLoading}
                        />
                      </div>
                      
                      <div className="font-semibold text-sm text-amber-600 flex items-center gap-2 pt-3 border-t">
                        <Home className="h-4 w-4" />
                        Properties
                      </div>
                      <div className="flex items-center justify-between pl-4">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-amber-600" />
                          <strong>Publish:</strong>
                        </div>
                        <Switch
                          checked={selectedAgent.can_publish_properties || false}
                          onCheckedChange={(checked) => togglePublishPropertyPermission(selectedAgent, checked)}
                          disabled={operationLoading}
                        />
                      </div>
                      <div className="flex items-center justify-between pl-4">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-orange-600" />
                          <strong>Edit:</strong>
                        </div>
                        <Switch
                          checked={selectedAgent.can_update_properties || false}
                          onCheckedChange={(checked) => toggleUpdatePropertyPermission(selectedAgent, checked)}
                          disabled={operationLoading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Account Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>Wallet Balance:</strong> ₵{selectedAgent.wallet_balance.toLocaleString()}
                    </div>
                    <div>
                      <strong>Commission For Withdraw:</strong> ₵
                      {selectedAgent.total_commission_earned?.toLocaleString() || "0"}
                    </div>
                    <div>
                      <strong>Total Orders:</strong> {selectedAgent.total_orders}
                    </div>
                    <div>
                      <strong>Total Referrals:</strong> {selectedAgent.total_referrals}
                    </div>
                    <div>
                      <strong>Joined:</strong> {new Date(selectedAgent.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Last Login:</strong>{" "}
                      {selectedAgent.last_login ? new Date(selectedAgent.last_login).toLocaleDateString() : "Never"}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {operationLoading ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Transaction Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                      <span>Loading transaction summary...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                agentSummary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Transaction Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Wallet Transactions</div>
                          <div className="text-blue-600">{agentSummary.total_wallet_transactions}</div>
                        </div>
                        <div>
                          <div className="font-medium">Total Manual Transactions</div>
                          <div className="text-green-600">{agentSummary.total_manual_transactions}</div>
                        </div>
                        <div>
                          <div className="font-medium">Data Orders</div>
                          <div className="text-purple-600">{agentSummary.total_data_orders}</div>
                        </div>
                        <div>
                          <div className="font-medium">Wholesale Orders</div>
                          <div className="text-orange-600">{agentSummary.total_wholesale_orders}</div>
                        </div>
                        <div>
                          <div className="font-medium">Referrals Made</div>
                          <div className="text-indigo-600">{agentSummary.total_referrals_made}</div>
                        </div>
                        <div>
                          <div className="font-medium">Referrals Received</div>
                          <div className="text-pink-600">{agentSummary.total_referrals_received}</div>
                        </div>
                        <div>
                          <div className="font-medium">Withdrawals</div>
                          <div className="text-red-600">{agentSummary.total_withdrawals}</div>
                        </div>
                        <div>
                          <div className="font-medium">Activity Period</div>
                          <div className="text-gray-600">
                            {agentSummary.first_transaction_date
                              ? `${new Date(agentSummary.first_transaction_date).toLocaleDateString()} - ${new Date(agentSummary.last_transaction_date).toLocaleDateString()}`
                              : "No transactions"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
            <Database className="h-5 w-5" />
            Clear Agent Data Records
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-3 text-sm">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <span className="font-medium text-orange-800 block mb-2">⚠️ Confirm Data Clearing</span>
            <span className="text-orange-700 block">
              You are about to clear all data records for: <strong>{clearingAgent?.full_name}</strong>
            </span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <span className="font-bold text-red-800 block text-center">🚨 THIS ACTION CANNOT BE UNDONE 🚨</span>
          </div>
        </div>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={operationLoading} className="bg-gray-100 hover:bg-gray-200">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => clearingAgent && clearAgentRecords(clearingAgent)}
            disabled={operationLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {operationLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing Data...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Clear Data Records
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
