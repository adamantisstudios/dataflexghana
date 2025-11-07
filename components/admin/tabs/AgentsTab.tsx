"use client"
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase, hashPassword, type Agent } from "@/lib/supabase"
import { getCurrentAdmin } from "@/lib/auth"
import { Check, Trash2, Ban, RotateCcw, Search, AlertTriangle, Filter, Wallet, Eye } from "lucide-react"
import Link from "next/link"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import { calculateWalletBalance } from "@/lib/earnings-calculator"

interface AgentWithWallet extends Agent {
  wallet_balance?: number
  commission_balance?: number
}

interface AgentsTabProps {
  getCachedData: () => AgentWithWallet[] | undefined
  setCachedData: (data: AgentWithWallet[]) => void
}

const AgentsTab = memo(function AgentsTab({ getCachedData, setCachedData }: AgentsTabProps) {
  const [agents, setAgents] = useState<AgentWithWallet[]>([])
  const [filteredAgents, setFilteredAgents] = useState<AgentWithWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [agentSearchTerm, setAgentSearchTerm] = useState("")
  const [agentsFilterAdmin, setAgentsFilterAdmin] = useState("All Agents")
  const [currentAgentsPage, setCurrentAgentsPage] = useState(1)
  const [showAgentDialog, setShowAgentDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentWithWallet | null>(null)
  const [agentPasswordReset, setAgentPasswordReset] = useState("")
  const [clearDataType, setClearDataType] = useState<"day" | "month">("day")
  const [clearDataOptions, setClearDataOptions] = useState({
    dataOrders: true,
    referrals: false,
    withdrawals: false,
  })
  const itemsPerPage = 12
  const admin = getCurrentAdmin()
  const agentsListRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    if (agentsListRef.current) {
      agentsListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  useEffect(() => {
    const loadAgents = async () => {
      const cachedData = getCachedData()
      if (cachedData) {
        setAgents(cachedData)
        setLoading(false)
        return
      }
      try {
        const { data: agentsData, error: agentsError } = await supabase
          .from("agents")
          .select("*")
          .order("created_at", { ascending: false })
        if (agentsError) throw agentsError
        setAgents(agentsData || [])
        if (agentsData && agentsData.length > 0) {
          const agentsWithAccurateEarnings = await Promise.all(
            agentsData.map(async (agent) => {
              try {
                const liveWalletBalance = await calculateWalletBalance(agent.id)
                const commissionSummary = await getAgentCommissionSummary(agent.id)
                const availableCommissions = commissionSummary.availableForWithdrawal
                const storedBalance = agent.wallet_balance || 0
                if (Math.abs(liveWalletBalance - storedBalance) > 0.01) {
                  try {
                    await supabase.from("agents").update({ wallet_balance: liveWalletBalance }).eq("id", agent.id)
                  } catch (error) {
                    console.error(`Error updating wallet balance for agent ${agent.id}:`, error)
                  }
                }
                return {
                  ...agent,
                  wallet_balance: liveWalletBalance,
                  commission_balance: availableCommissions,
                }
              } catch (error) {
                console.error(`Error calculating earnings for agent ${agent.id}:`, error)
                return {
                  ...agent,
                  wallet_balance: agent.wallet_balance || 0,
                  commission_balance: 0,
                }
              }
            }),
          )
          setAgents(agentsWithAccurateEarnings)
          setCachedData(agentsWithAccurateEarnings)
        }
      } catch (error) {
        console.error("Error loading agents:", error)
        alert("Failed to load agents data.")
      } finally {
        setLoading(false)
      }
    }
    loadAgents()
  }, [getCachedData, setCachedData])

  const filterAgents = useCallback((agents: AgentWithWallet[], searchTerm: string, statusFilter: string) => {
    let filtered = agents

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (agent) =>
          agent.full_name?.toLowerCase().includes(lowerSearchTerm) ||
          agent.phone_number?.includes(searchTerm) ||
          agent.momo_number?.includes(searchTerm) ||
          agent.region?.toLowerCase().includes(lowerSearchTerm),
      )
    }

    // Apply status filter
    if (statusFilter !== "All Agents") {
      filtered = filtered.filter((agent) => {
        switch (statusFilter) {
          case "Approved":
            return agent.isapproved === true && agent.isbanned !== true
          case "Pending":
            return agent.isapproved === false && agent.isbanned !== true
          case "Banned":
            return agent.isbanned === true
          case "Wallet Balance":
            return (agent.wallet_balance || 0) > 0
          default:
            return true
        }
      })
    }

    // Sort by wallet balance if that filter is active
    if (statusFilter === "Wallet Balance") {
      filtered = filtered.sort((a, b) => {
        const balanceA = a.wallet_balance || 0
        const balanceB = b.wallet_balance || 0
        return balanceB - balanceA
      })
    }

    return filtered
  }, [])

  const memoizedFilteredAgents = useMemo(() => {
    return filterAgents(agents, agentSearchTerm, agentsFilterAdmin)
  }, [agents, agentSearchTerm, agentsFilterAdmin, filterAgents])

  // Update filtered agents when memoized result changes
  useEffect(() => {
    setFilteredAgents(memoizedFilteredAgents)
    setCurrentAgentsPage(1)
  }, [memoizedFilteredAgents])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const approveAgent = async (agentId: string) => {
    try {
      const agentToApprove = agents.find((a) => a.id === agentId)
      if (!agentToApprove) return

      const { error } = await supabase.from("agents").update({ isapproved: true }).eq("id", agentId)
      if (error) throw error

      if (agentToApprove.referral_code) {
        const { data: referringAgent } = await supabase
          .from("agents")
          .select("id")
          .eq("unique_agent_code", agentToApprove.referral_code)
          .single()

        if (referringAgent) {
          // Create referral credit record with "pending" status for manual payout
          await supabase.from("referral_credits").insert({
            referring_agent_id: referringAgent.id,
            referred_agent_id: agentId,
            credit_amount: 15.0,
            status: "pending", // Admin will manually process this later
            created_at: new Date().toISOString(),
          })
        }
      }

      const updatedAgents = agents.map((agent) => (agent.id === agentId ? { ...agent, isapproved: true } : agent))
      setAgents(updatedAgents)
      setCachedData(updatedAgents)
    } catch (error) {
      console.error("Error approving agent:", error)
      alert("Failed to approve agent")
    }
  }

  const banAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from("agents").update({ isbanned: true }).eq("id", agentId)
      if (error) throw error
      const updatedAgents = agents.map((agent) => (agent.id === agentId ? { ...agent, isbanned: true } : agent))
      setAgents(updatedAgents)
      setCachedData(updatedAgents)
    } catch (error) {
      console.error("Error banning agent:", error)
      alert("Failed to ban agent")
    }
  }

  const unbanAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from("agents").update({ isbanned: false }).eq("id", agentId)
      if (error) throw error
      const updatedAgents = agents.map((agent) => (agent.id === agentId ? { ...agent, isbanned: false } : agent))
      setAgents(updatedAgents)
      setCachedData(updatedAgents)
    } catch (error) {
      console.error("Error unbanning agent:", error)
      alert("Failed to unban agent")
    }
  }

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("agents").delete().eq("id", agentId)
      if (error) throw error
      const updatedAgents = agents.filter((agent) => agent.id !== agentId)
      setAgents(updatedAgents)
      setCachedData(updatedAgents)
    } catch (error) {
      console.error("Error deleting agent:", error)
      alert("Failed to delete agent")
    }
  }

  const resetAgentPassword = async () => {
    if (!selectedAgent || !agentPasswordReset) return
    try {
      const passwordHash = await hashPassword(agentPasswordReset)
      const { error } = await supabase.from("agents").update({ password_hash: passwordHash }).eq("id", selectedAgent.id)
      if (error) throw error
      alert(`Password reset successfully for ${selectedAgent.full_name}`)
      setShowAgentDialog(false)
      setAgentPasswordReset("")
      setSelectedAgent(null)
    } catch (error) {
      console.error("Error resetting password:", error)
      alert("Failed to reset password")
    }
  }

  const clearData = async () => {
    if (
      !confirm(
        `Are you sure you want to clear selected data from ${clearDataType === "day" ? "today" : "this month"}? This will remove records from the admin dashboard but preserve agent historical data and processed commissions. This action cannot be undone.`,
      )
    ) {
      return
    }
    try {
      const now = new Date()
      let cutoffDate: Date
      if (clearDataType === "day") {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      const promises = []
      const clearedTypes = []
      if (clearDataOptions.dataOrders) {
        promises.push(
          supabase
            .from("data_orders")
            .delete()
            .in("status", ["completed", "confirmed", "canceled"])
            .eq("commission_paid", true)
            .lt("created_at", cutoffDate.toISOString()),
        )
        clearedTypes.push("processed data orders")
      }
      if (clearDataOptions.referrals) {
        promises.push(
          supabase
            .from("referrals")
            .delete()
            .in("status", ["completed", "confirmed", "canceled"])
            .eq("commission_paid", true)
            .lt("created_at", cutoffDate.toISOString()),
        )
        clearedTypes.push("processed referrals")
      }
      if (clearDataOptions.withdrawals) {
        promises.push(
          supabase
            .from("withdrawals")
            .delete()
            .in("status", ["paid", "rejected"])
            .lt("requested_at", cutoffDate.toISOString()),
        )
        clearedTypes.push("completed withdrawals")
      }
      if (promises.length === 0) {
        alert("Please select at least one data type to clear.")
        return
      }
      const results = await Promise.all(promises)
      const errors = results.filter((result) => result.error)
      if (errors.length > 0) {
        console.error("Errors during admin data cleanup:", errors)
        throw new Error("Some data could not be cleared")
      }
      const totalCleared = results.reduce((sum, result) => sum + (result.count || 0), 0)
      alert(
        `Successfully cleared ${totalCleared} admin records (${clearedTypes.join(", ")}) from ${
          clearDataType === "day" ? "today" : "this month"
        }. Agent historical data and wallet balances remain intact.`,
      )
      setShowClearDialog(false)
      window.location.reload()
    } catch (error) {
      console.error("Error during admin data cleanup:", error)
      alert("Failed to clear admin data. Please check your selection and try again.")
    }
  }

  const openAgentDialog = (agent: AgentWithWallet) => {
    setSelectedAgent(agent)
    setShowAgentDialog(true)
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

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
    const getVisiblePages = () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768
      const maxVisible = isMobile ? 3 : 5
      if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
      }
      const start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
      const end = Math.min(totalPages, start + maxVisible - 1)
      const adjustedStart = Math.max(1, end - maxVisible + 1)
      return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i)
    }
    const visiblePages = getVisiblePages()
    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) {
                    onPageChange(currentPage - 1)
                  }
                }}
                className={`${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {visiblePages.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  if (currentPage < totalPages) {
                    onPageChange(currentPage + 1)
                  }
                }}
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-emerald-800">Agent Management</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
              <Input
                placeholder="Search agents..."
                value={agentSearchTerm}
                onChange={(e) => setAgentSearchTerm(e.target.value)}
                className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
            <Select value={agentsFilterAdmin} onValueChange={setAgentsFilterAdmin}>
              <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Agents">All Agents</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Banned">Banned</SelectItem>
                <SelectItem value="Wallet Balance">Wallet Balance</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowClearDialog(true)}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 whitespace-nowrap"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Admin Cleanup
            </Button>
          </div>
        </div>
      </div>
      <div ref={agentsListRef} className="space-y-4">
        {getPaginatedData(filteredAgents, currentAgentsPage).map((agent) => (
          <Card
            key={agent.id}
            className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-emerald-800 text-base">{agent.full_name}</h3>
                    <Badge
                      className={
                        agent.isbanned
                          ? "bg-red-900 text-white border-red-900"
                          : agent.isapproved
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      }
                    >
                      {agent.isbanned ? "🚫 BANNED" : agent.isapproved ? "✓ Approved" : "⏳ Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      ₵{agent.wallet_balance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                      Available: ₵{agent.commission_balance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p className="text-emerald-600">
                      <span className="font-medium">Phone:</span> {agent.phone_number}
                    </p>
                    <p className="text-emerald-600">
                      <span className="font-medium">MoMo:</span> {agent.momo_number}
                    </p>
                    <p className="text-emerald-600">
                      <span className="font-medium">Region:</span> {agent.region}
                    </p>
                    <p className="text-emerald-500 text-xs">
                      <span className="font-medium">Joined:</span> {formatTimestamp(agent.created_at)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-100">
                  <Link href={`/admin/agents/${agent.id}`} passHref>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </Link>
                  {agent.isbanned ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unbanAgent(agent.id)}
                      className="border-green-300 text-green-600 hover:bg-green-50 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Unban
                    </Button>
                  ) : !agent.isapproved ? (
                    <Button
                      size="sm"
                      onClick={() => approveAgent(agent.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => banAgent(agent.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      Ban
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAgentDialog(agent)}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteAgent(agent.id)} className="text-xs">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <PaginationControls
        currentPage={currentAgentsPage}
        totalPages={getTotalPages(filteredAgents.length)}
        onPageChange={(page) => {
          setCurrentAgentsPage(page)
          scrollToTop()
        }}
      />
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>Reset Agent Password</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agentName" className="text-right">
                  Agent Name
                </Label>
                <Input type="text" id="agentName" value={selectedAgent.full_name} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newPassword" className="text-right">
                  New Password
                </Label>
                <Input
                  type="password"
                  id="newPassword"
                  value={agentPasswordReset}
                  onChange={(e) => setAgentPasswordReset(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={resetAgentPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto p-4 sm:p-6">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-lg sm:text-xl font-semibold">Admin Data Cleanup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Label htmlFor="clearDataType" className="block text-sm font-medium text-gray-700">
              Time Range
            </Label>
            <Select value={clearDataType} onValueChange={setClearDataType}>
              <SelectTrigger className="w-full h-12 text-sm sm:text-base">
                <SelectValue placeholder="Select Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <div
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => setClearDataOptions((prev) => ({ ...prev, dataOrders: !prev.dataOrders }))}
              >
                <input
                  type="checkbox"
                  checked={clearDataOptions.dataOrders}
                  onChange={() => {}}
                  className="form-checkbox h-5 w-5 text-emerald-600"
                />
                <Label className="text-sm sm:text-base text-gray-700 flex-1">Data Orders</Label>
              </div>
              <div
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => setClearDataOptions((prev) => ({ ...prev, referrals: !prev.referrals }))}
              >
                <input
                  type="checkbox"
                  checked={clearDataOptions.referrals}
                  onChange={() => {}}
                  className="form-checkbox h-5 w-5 text-emerald-600"
                />
                <Label className="text-sm sm:text-base text-gray-700 flex-1">Referrals</Label>
              </div>
              <div
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => setClearDataOptions((prev) => ({ ...prev, withdrawals: !prev.withdrawals }))}
              >
                <input
                  type="checkbox"
                  checked={clearDataOptions.withdrawals}
                  onChange={() => {}}
                  className="form-checkbox h-5 w-5 text-emerald-600"
                />
                <Label className="text-sm sm:text-base text-gray-700 flex-1">Withdrawals</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={clearData}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

export default AgentsTab
