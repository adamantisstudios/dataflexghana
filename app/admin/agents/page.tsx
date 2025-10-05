"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckCircle,
  XCircle,
  Search,
  ArrowLeft,
  Eye,
  Coins,
  Play,
  RotateCcw,
  AlertTriangle,
  Users,
  Activity,
  Settings,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"
import Link from "next/link"
import { toast } from "sonner"
import { AutomationDashboard } from "@/components/admin/automation/AutomationDashboard"
import { ActivityTracker } from "@/components/admin/automation/ActivityTracker"
import { batchCalculateAgentEarnings, type EarningsData } from "@/lib/earnings-calculator"

interface AutomationStats {
  total_runs: number
  successful_runs: number
  failed_runs: number
  total_agents_processed: number
  total_agents_deactivated: number
  avg_execution_time_ms: number
  last_run_at: string | null
  next_recommended_run: string | null
}

interface AgentAtRisk {
  agent_id: string
  agent_name: string
  phone_number: string
  last_activity_at: string
  days_since_activity: number
  orders_7d: number
  orders_30d: number
  risk_level: string
  risk_reason: string
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activityFilter, setActivityFilter] = useState("all")
  const [automationStats, setAutomationStats] = useState<AutomationStats | null>(null)
  const [agentsAtRisk, setAgentsAtRisk] = useState<AgentAtRisk[]>([])
  const [runningAutomation, setRunningAutomation] = useState(false)
  const [agentEarnings, setAgentEarnings] = useState<Map<string, EarningsData>>(new Map())

  useEffect(() => {
    fetchAgents()
    fetchAutomationStats()
    fetchAgentsAtRisk()
  }, [])

  useEffect(() => {
    const filtered = agents.filter((agent) => {
      const matchesSearch =
        agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone_number.includes(searchTerm) ||
        agent.region.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && agent.isapproved) ||
        (statusFilter === "pending" && !agent.isapproved && !agent.auto_deactivated_at) ||
        (statusFilter === "auto_deactivated" && agent.auto_deactivated_at)

      const matchesActivity =
        activityFilter === "all" ||
        (activityFilter === "active" &&
          agent.last_activity_at &&
          new Date(agent.last_activity_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (activityFilter === "inactive_7d" &&
          agent.last_activity_at &&
          new Date(agent.last_activity_at) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
          new Date(agent.last_activity_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
        (activityFilter === "inactive_30d" &&
          agent.last_activity_at &&
          new Date(agent.last_activity_at) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

      return matchesSearch && matchesStatus && matchesActivity
    })
    setFilteredAgents(filtered)
  }, [agents, searchTerm, statusFilter, activityFilter])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // Set basic agent data first
      setAgents(data || [])

      if (data && data.length > 0) {
        console.log("🔄 Admin agents page: Calculating unified commission data for all agents")

        const agentIds = data.map((agent) => agent.id)
        const earningsMap = await batchCalculateAgentEarnings(agentIds)
        setAgentEarnings(earningsMap)

        const agentsWithUnifiedEarnings = data.map((agent) => {
          const earnings = earningsMap.get(agent.id)

          if (earnings) {
            console.log(`✅ Agent ${agent.full_name}: Unified earnings applied`, {
              totalCommission: earnings.totalCommission,
              availableBalance: earnings.availableBalance,
              walletBalance: earnings.walletBalance,
              totalPaidOut: earnings.totalPaidOut,
              pendingPayout: earnings.pendingPayout,
            })
          }

          return {
            ...agent,
            totalCommission: earnings?.totalCommission || 0, // Total commission earned (all time)
            wallet_balance: earnings?.walletBalance || 0, // ONLY spendable wallet money (no commissions)
            available_balance: earnings?.availableBalance || 0, // Commission money available for withdrawal - MATCHES agent dashboard
            totalPaidOut: earnings?.totalPaidOut || 0, // Already withdrawn commissions
            pendingPayout: earnings?.pendingPayout || 0, // Withdrawal requests in progress
            totalEarnings: earnings?.totalEarnings || 0, // Total earnings = total commission
          }
        })

        setAgents(agentsWithUnifiedEarnings)
        console.log("✅ Admin agents page: All agents synchronized with unified commission system")
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast.error("Failed to fetch agents")
    } finally {
      setLoading(false)
    }
  }

  const fetchAutomationStats = async () => {
    try {
      const { data, error } = await supabase.rpc("get_automation_statistics", {
        p_days_back: 30,
      })

      if (error) {
        console.error("Error fetching automation stats:", error)
        // Don't crash the page, just log the error
        if (error.code !== "PGRST202") {
          // Don't show error for missing function
          console.warn("Automation statistics function not available:", error.message)
        }
        return
      }

      if (data && data.length > 0) {
        setAutomationStats(data[0])
      }
    } catch (error) {
      console.error("Error fetching automation stats:", error)
      // Don't show toast error to avoid spamming user
    }
  }

  const fetchAgentsAtRisk = async () => {
    try {
      const { data, error } = await supabase.rpc("get_agents_at_risk")

      if (error) {
        console.error("Error fetching agents at risk:", error)
        // Don't crash the page, just log the error
        if (error.code !== "PGRST202") {
          // Don't show error for missing function
          console.warn("Agents at risk function not available:", error.message)
        }
        return
      }

      setAgentsAtRisk(data || [])
    } catch (error) {
      console.error("Error fetching agents at risk:", error)
      // Don't show toast error to avoid spamming user
    }
  }

  const toggleAgentApproval = async (agentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("agents").update({ isapproved: !currentStatus }).eq("id", agentId)

      if (error) throw error

      setAgents(agents.map((agent) => (agent.id === agentId ? { ...agent, isapproved: !currentStatus } : agent)))

      toast.success(`Agent ${!currentStatus ? "approved" : "suspended"} successfully`)
    } catch (error) {
      console.error("Error updating agent:", error)
      toast.error("Failed to update agent status")
    }
  }

  const reactivateAgent = async (agentId: string, agentName: string) => {
    try {
      const { data, error } = await supabase.rpc("reactivate_agent", {
        p_agent_id: agentId,
        p_admin_notes: `Manually reactivated by admin on ${new Date().toISOString()}`,
      })

      if (error) throw error

      if (data) {
        toast.success(`Agent ${agentName} has been reactivated successfully`)
        fetchAgents() // Refresh data
      } else {
        toast.error("Agent could not be reactivated")
      }
    } catch (error) {
      console.error("Error reactivating agent:", error)
      toast.error("Failed to reactivate agent")
    }
  }

  const runAutomationManually = async () => {
    try {
      setRunningAutomation(true)

      // Test database connection first
      const { error: connectionError } = await supabase.from("agents").select("count", { count: "exact", head: true })

      if (connectionError) {
        throw new Error(`Database connection failed: ${connectionError.message}`)
      }

      const { data, error } = await supabase.rpc("run_agent_deactivation_automation", {
        p_run_type: "manual",
      })

      if (error) {
        console.error("Error running automation:", error)

        // Handle specific RPC errors gracefully
        if (error.code === "PGRST202") {
          toast.error("Automation function not found. Please check if the database function exists.")
          return
        } else if (error.code === "PGRST301") {
          toast.error("Automation function execution failed. Please check function permissions.")
          return
        } else {
          throw error
        }
      }

      // Handle successful response
      let message = "Automation process completed successfully"
      if (data && typeof data === "object" && data.message) {
        message = data.message
      }

      toast.success(message)
      fetchAgents()
      fetchAutomationStats()
      fetchAgentsAtRisk()
    } catch (error) {
      console.error("Error running automation:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(`Failed to run automation process: ${errorMessage}`)
    } finally {
      setRunningAutomation(false)
    }
  }

  const getActivityStatus = (agent: Agent) => {
    if (!agent.last_activity_at) return "No Activity"

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(agent.last_activity_at).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (daysSinceActivity <= 7) return "Active"
    if (daysSinceActivity <= 30) return "Inactive (7d+)"
    return "Inactive (30d+)"
  }

  const getActivityBadgeColor = (agent: Agent) => {
    if (!agent.last_activity_at) return "bg-gray-100 text-gray-800"

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(agent.last_activity_at).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (daysSinceActivity <= 7) return "bg-green-100 text-green-800"
    if (daysSinceActivity <= 30) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "HIGH":
        return "bg-red-100 text-red-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading agents...</p>
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
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Agents Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">
                View and manage all registered agents with automation features
              </p>
            </div>
          </div>
          <Button
            onClick={runAutomationManually}
            disabled={runningAutomation}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            size="sm"
          >
            {runningAutomation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Automation
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          {/* Mobile-Responsive Tab Navigation with Slider */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex h-auto p-1 bg-gray-100 rounded-lg min-w-full w-max">
                <TabsTrigger
                  value="overview"
                  className="flex items-center justify-center px-4 py-3 text-xs sm:text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="all-agents"
                  className="flex items-center justify-center px-4 py-3 text-xs sm:text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Agents
                </TabsTrigger>
                <TabsTrigger
                  value="at-risk"
                  className="flex items-center justify-center px-4 py-3 text-xs sm:text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  At Risk
                </TabsTrigger>
                <TabsTrigger
                  value="automation"
                  className="flex items-center justify-center px-4 py-3 text-xs sm:text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Automation
                </TabsTrigger>
                <TabsTrigger
                  value="activity-tracker"
                  className="flex items-center justify-center px-4 py-3 text-xs sm:text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Tracker
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-emerald-100">Total Agents</CardTitle>
                  <Users className="h-4 w-4 text-emerald-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{agents.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-green-100">Approved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {agents.filter((agent) => agent.isapproved && !agent.auto_deactivated_at).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-red-100">Deactivated</CardTitle>
                  <XCircle className="h-4 w-4 text-red-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {agents.filter((agent) => agent.auto_deactivated_at).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-amber-100">At Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{agentsAtRisk.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recent Agent Activity</CardTitle>
                <CardDescription className="text-sm">Latest agent registrations and status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.slice(0, 5).map((agent) => (
                    <div
                      key={agent.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-sm sm:text-base">{agent.full_name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {agent.phone_number} • {agent.region}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${getActivityBadgeColor(agent)} text-xs`}>{getActivityStatus(agent)}</Badge>
                        {agent.last_activity_at && (
                          <p className="text-xs text-gray-500">
                            {new Date(agent.last_activity_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-agents" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Search and Filter Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name, phone, or region..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="auto_deactivated">Auto-Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activity</SelectItem>
                      <SelectItem value="active">Active (7d)</SelectItem>
                      <SelectItem value="inactive_7d">Inactive (7-30d)</SelectItem>
                      <SelectItem value="inactive_30d">Inactive (30d+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Agents Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">All Agents</CardTitle>
                <CardDescription className="text-sm">
                  Showing {filteredAgents.length} of {agents.length} agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[100px]">Phone</TableHead>
                        <TableHead className="min-w-[80px]">Region</TableHead>
                        <TableHead className="min-w-[100px]">Activity</TableHead>
                        <TableHead className="min-w-[80px]">Orders</TableHead>
                        <TableHead className="min-w-[100px]">Commission</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No agents found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAgents.map((agent) => (
                          <TableRow key={agent.id}>
                            <TableCell className="font-medium text-sm">{agent.full_name}</TableCell>
                            <TableCell className="text-sm">{agent.phone_number}</TableCell>
                            <TableCell className="text-sm">{agent.region}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge className={`${getActivityBadgeColor(agent)} text-xs`}>
                                  {getActivityStatus(agent)}
                                </Badge>
                                {agent.last_activity_at && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(agent.last_activity_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <span className="font-medium">{agent.data_orders_count_7d || 0}</span> /
                                <span className="font-medium">{agent.data_orders_count_30d || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-xs text-green-600">
                                <Coins className="h-3 w-3 mr-1" />
                                GH₵ {(agent.available_balance || 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Available</div>
                              {agent.pendingPayout > 0 && (
                                <div className="text-xs text-amber-600 mt-1">
                                  GH₵ {agent.pendingPayout.toFixed(2)} pending
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge
                                  className={`text-xs ${
                                    agent.auto_deactivated_at
                                      ? "bg-orange-100 text-orange-800"
                                      : agent.isapproved
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {agent.auto_deactivated_at
                                    ? "Auto-Deactivated"
                                    : agent.isapproved
                                      ? "Approved"
                                      : "Pending"}
                                </Badge>
                                {agent.auto_deactivation_reason && (
                                  <p
                                    className="text-xs text-gray-500 max-w-32 truncate"
                                    title={agent.auto_deactivation_reason}
                                  >
                                    {agent.auto_deactivation_reason}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1">
                                <div className="flex gap-1">
                                  {agent.auto_deactivated_at ? (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => reactivateAgent(agent.id, agent.full_name)}
                                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-auto"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Reactivate
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant={agent.isapproved ? "destructive" : "default"}
                                      onClick={() => toggleAgentApproval(agent.id, agent.isapproved)}
                                      className="text-xs px-2 py-1 h-auto"
                                    >
                                      {agent.isapproved ? (
                                        <>
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Suspend
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Approve
                                        </>
                                      )}
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                    className="text-xs px-2 py-1 h-auto bg-transparent"
                                  >
                                    <Link href={`/admin/agents/${agent.id}`}>
                                      <Eye className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="at-risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Agents at Risk of Deactivation</CardTitle>
                <CardDescription className="text-sm">
                  Agents who may be automatically deactivated due to inactivity or low order volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[100px]">Phone</TableHead>
                        <TableHead className="min-w-[120px]">Last Activity</TableHead>
                        <TableHead className="min-w-[80px]">Orders</TableHead>
                        <TableHead className="min-w-[80px]">Risk Level</TableHead>
                        <TableHead className="min-w-[150px]">Risk Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentsAtRisk.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No agents at risk found
                          </TableCell>
                        </TableRow>
                      ) : (
                        agentsAtRisk.map((agent) => (
                          <TableRow key={agent.agent_id}>
                            <TableCell className="font-medium text-sm">{agent.agent_name}</TableCell>
                            <TableCell className="text-sm">{agent.phone_number}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm">{new Date(agent.last_activity_at).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-500">{agent.days_since_activity} days ago</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="font-medium">{agent.orders_7d}</span> /
                                <span className="font-medium">{agent.orders_30d}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getRiskBadgeColor(agent.risk_level)} text-xs`}>
                                {agent.risk_level}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm max-w-64 truncate" title={agent.risk_reason}>
                                {agent.risk_reason}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <AutomationDashboard />
          </TabsContent>

          <TabsContent value="activity-tracker" className="space-y-6">
            <ActivityTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function getCurrentAdmin() {
  // Implement logic to get the current admin
  return { id: "admin123" } // Placeholder return value
}
