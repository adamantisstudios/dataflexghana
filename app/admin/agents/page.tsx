"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
  Play,
  AlertTriangle,
  Users,
  Activity,
  Settings,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"
import Link from "next/link"
import { toast } from "sonner"
import { batchCalculateAgentEarnings, type EarningsData } from "@/lib/earnings-calculator"
import { useAgentsCache } from "@/hooks/use-agents-cache"
import { AgentDashboardSkeleton } from "@/components/admin/agents/agent-dashboard-skeleton"
import { LazyAutomationDashboard } from "@/components/admin/agents/lazy-automation-dashboard"
import { LazyActivityTracker } from "@/components/admin/agents/lazy-activity-tracker"
import { fetchAllDashboardData } from "@/lib/agent-query-optimizer"

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
  const { invalidateCache } = useAgentsCache()

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const dashboardData = await fetchAllDashboardData(100, 0)

      setAgents(dashboardData.agents || [])
      setAutomationStats(dashboardData.stats)
      setAgentsAtRisk(dashboardData.atRisk)

      if (dashboardData.agents && dashboardData.agents.length > 0) {
        const agentIds = dashboardData.agents.map((agent) => agent.id)
        const earningsMap = await batchCalculateAgentEarnings(agentIds)
        setAgentEarnings(earningsMap)

        const agentsWithUnifiedEarnings = dashboardData.agents.map((agent) => {
          const earnings = earningsMap.get(agent.id)
          return {
            ...agent,
            totalCommission: earnings?.totalCommission || 0,
            wallet_balance: earnings?.walletBalance || 0,
            available_balance: earnings?.availableBalance || 0,
            totalPaidOut: earnings?.totalPaidOut || 0,
            pendingPayout: earnings?.pendingPayout || 0,
            totalEarnings: earnings?.totalEarnings || 0,
          }
        })

        setAgents(agentsWithUnifiedEarnings)
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast.error("Failed to fetch agents")
    } finally {
      setLoading(false)
    }
  }

  const filterAgents = useCallback(
    (agentsList: Agent[]) => {
      return agentsList.filter((agent) => {
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
    },
    [searchTerm, statusFilter, activityFilter],
  )

  const memoizedFilteredAgents = useMemo(() => filterAgents(agents), [agents, filterAgents])

  useEffect(() => {
    setFilteredAgents(memoizedFilteredAgents)
  }, [memoizedFilteredAgents])

  useEffect(() => {
    fetchAgents()
  }, [])

  const toggleAgentApproval = async (agentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("agents").update({ isapproved: !currentStatus }).eq("id", agentId)

      if (error) throw error

      setAgents(agents.map((agent) => (agent.id === agentId ? { ...agent, isapproved: !currentStatus } : agent)))
      invalidateCache()
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
        invalidateCache()
        fetchAgents()
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

      const { error: connectionError } = await supabase.from("agents").select("count", { count: "exact", head: true })

      if (connectionError) {
        throw new Error(`Database connection failed: ${connectionError.message}`)
      }

      const { data, error } = await supabase.rpc("run_agent_deactivation_automation", {
        p_run_type: "manual",
      })

      if (error) {
        console.error("Error running automation:", error)

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

      let message = "Automation process completed successfully"
      if (data && typeof data === "object" && data.message) {
        message = data.message
      }

      toast.success(message)
      invalidateCache()
      fetchAgents()
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
    return <AgentDashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
            <Button variant="outline" size="sm" asChild className="w-fit bg-transparent text-xs px-1.5 py-0.5 h-auto">
              <Link href="/admin">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-gray-900">Admin Agents</h1>
              <p className="text-xs text-gray-600">Manage agents</p>
            </div>
          </div>
          <Button
            onClick={runAutomationManually}
            disabled={runningAutomation}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs px-2 py-1 h-auto"
            size="sm"
          >
            {runningAutomation ? (
              <>
                <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white mr-1"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="h-2.5 w-2.5 mr-1" />
                Run
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex h-auto p-1 bg-gray-100 rounded-lg min-w-full w-max gap-1">
                <TabsTrigger
                  value="overview"
                  className="px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white whitespace-nowrap"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="all-agents"
                  className="px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white whitespace-nowrap flex items-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  Agents
                </TabsTrigger>
                <TabsTrigger
                  value="at-risk"
                  className="px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white whitespace-nowrap flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Risk
                </TabsTrigger>
                <TabsTrigger
                  value="automation"
                  className="px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white whitespace-nowrap flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Auto
                </TabsTrigger>
                <TabsTrigger
                  value="activity-tracker"
                  className="px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white whitespace-nowrap flex items-center gap-1"
                >
                  <Activity className="h-3 w-3" />
                  Tracker
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-emerald-100">Total</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-200" />
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="text-lg sm:text-xl font-bold">{agents.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-green-100">Approved</CardTitle>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-200" />
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {agents.filter((agent) => agent.isapproved && !agent.auto_deactivated_at).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-red-100">Deactivated</CardTitle>
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-200" />
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {agents.filter((agent) => agent.auto_deactivated_at).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-amber-100">At Risk</CardTitle>
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-200" />
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="text-lg sm:text-xl font-bold">{agentsAtRisk.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-md">
              <CardHeader className="p-2 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Recent Activity</CardTitle>
                <CardDescription className="text-xs">Latest agent changes</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <div className="space-y-2">
                  {agents.slice(0, 3).map((agent) => (
                    <div
                      key={agent.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border rounded text-xs sm:text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{agent.full_name}</p>
                        <p className="text-gray-500">{agent.phone_number}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge className={`${getActivityBadgeColor(agent)} text-xs px-2 py-0.5`}>
                          {getActivityStatus(agent)}
                        </Badge>
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

          <TabsContent value="all-agents" className="space-y-3 sm:space-y-4">
            <Card className="shadow-md">
              <CardHeader className="p-2 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Search Agents</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 text-xs py-1 h-auto"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-xs py-1 h-auto">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="auto_deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger className="text-xs py-1 h-auto">
                      <SelectValue placeholder="Activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive_7d">7+ days</SelectItem>
                      <SelectItem value="inactive_30d">30+ days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="p-2 sm:p-4">
                <CardTitle className="text-sm sm:text-base">All Agents ({filteredAgents.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <div className="overflow-x-auto text-xs sm:text-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Name</TableHead>
                        <TableHead className="min-w-[80px]">Phone</TableHead>
                        <TableHead className="min-w-[70px]">Region</TableHead>
                        <TableHead className="min-w-[70px]">Status</TableHead>
                        <TableHead className="min-w-[80px]">Orders</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No agents found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAgents.slice(0, 10).map((agent) => (
                          <TableRow key={agent.id}>
                            <TableCell className="font-medium text-xs">{agent.full_name}</TableCell>
                            <TableCell className="text-xs">{agent.phone_number}</TableCell>
                            <TableCell className="text-xs">{agent.region}</TableCell>
                            <TableCell>
                              <Badge
                                className={`text-xs px-1 py-0.5 ${
                                  agent.auto_deactivated_at
                                    ? "bg-orange-100 text-orange-800"
                                    : agent.isapproved
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {agent.auto_deactivated_at ? "Deactivated" : agent.isapproved ? "Approved" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{agent.data_orders_count_7d || 0}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
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

          <TabsContent value="at-risk" className="space-y-3 sm:space-y-4">
            <Card className="shadow-md">
              <CardHeader className="p-2 sm:p-4">
                <CardTitle className="text-sm sm:text-base">At Risk Agents ({agentsAtRisk.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <div className="space-y-2">
                  {agentsAtRisk.slice(0, 5).map((agent) => (
                    <div key={agent.agent_id} className="p-2 border rounded text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-medium">{agent.agent_name}</p>
                          <p className="text-gray-600 text-xs">{agent.phone_number}</p>
                        </div>
                        <Badge className={`${getRiskBadgeColor(agent.risk_level)} text-xs px-2 py-0.5`}>
                          {agent.risk_level}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-xs mt-1">{agent.risk_reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-3 sm:space-y-4">
            <LazyAutomationDashboard />
          </TabsContent>

          <TabsContent value="activity-tracker" className="space-y-3 sm:space-y-4">
            <LazyActivityTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function getCurrentAdmin() {
  return { id: "admin123" }
}
