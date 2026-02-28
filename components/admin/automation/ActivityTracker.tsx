"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Search, Calendar, Users, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { supabase, type Agent } from "@/lib/supabase"
import { toast } from "sonner"

interface ActivityData extends Agent {
  days_since_activity: number
  risk_level: "LOW" | "MEDIUM" | "HIGH"
  risk_reason: string
}

interface ActivityTrackerProps {
  onSwitchToAutomationDashboard?: () => void
}

export function ActivityTracker({ onSwitchToAutomationDashboard }: ActivityTrackerProps) {
  const [agents, setAgents] = useState<ActivityData[]>([])
  const [filteredAgents, setFilteredAgents] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")

  useEffect(() => {
    fetchAgentActivity()
  }, [])

  useEffect(() => {
    filterAgents()
  }, [agents, searchTerm, statusFilter, riskFilter])

  const fetchAgentActivity = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("last_activity_at", { ascending: false, nullsFirst: false })

      if (error) throw error

      // Calculate activity metrics for each agent
      const enrichedAgents: ActivityData[] = (data || []).map((agent) => {
        const daysSinceActivity = agent.last_activity_at
          ? Math.floor((Date.now() - new Date(agent.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999

        let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW"
        let riskReason = "Agent is active"

        if (!agent.last_activity_at) {
          riskLevel = "HIGH"
          riskReason = "No recorded activity"
        } else if (daysSinceActivity > 30) {
          riskLevel = "HIGH"
          riskReason = `No activity for ${daysSinceActivity} days`
        } else if (daysSinceActivity > 14) {
          riskLevel = "MEDIUM"
          riskReason = `Inactive for ${daysSinceActivity} days`
        } else if (daysSinceActivity > 7) {
          riskLevel = "MEDIUM"
          riskReason = `Limited activity (${daysSinceActivity} days)`
        }

        // Factor in order volume
        const orders7d = agent.data_orders_count_7d || 0
        const orders30d = agent.data_orders_count_30d || 0

        if (orders7d < 5 && orders30d < 20) {
          if (riskLevel === "LOW") riskLevel = "MEDIUM"
          else if (riskLevel === "MEDIUM") riskLevel = "HIGH"
          riskReason += ` and low order volume (${orders7d}/7d, ${orders30d}/30d)`
        }

        return {
          ...agent,
          days_since_activity: daysSinceActivity,
          risk_level: riskLevel,
          risk_reason: riskReason,
        }
      })

      setAgents(enrichedAgents)
    } catch (error) {
      console.error("Error fetching agent activity:", error)
      toast.error("Failed to fetch agent activity data")
    } finally {
      setLoading(false)
    }
  }

  const filterAgents = () => {
    let filtered = agents

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (agent) =>
          agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.phone_number.includes(searchTerm) ||
          agent.region.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((agent) => {
        switch (statusFilter) {
          case "approved":
            return agent.isapproved && !agent.auto_deactivated_at
          case "pending":
            return !agent.isapproved && !agent.auto_deactivated_at
          case "auto_deactivated":
            return agent.auto_deactivated_at
          default:
            return true
        }
      })
    }

    // Risk filter
    if (riskFilter !== "all") {
      filtered = filtered.filter((agent) => agent.risk_level === riskFilter)
    }

    setFilteredAgents(filtered)
  }

  const getActivityBadgeColor = (daysSinceActivity: number) => {
    if (daysSinceActivity <= 7) return "bg-green-100 text-green-800"
    if (daysSinceActivity <= 14) return "bg-yellow-100 text-yellow-800"
    if (daysSinceActivity <= 30) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "HIGH":
        return "bg-red-100 text-red-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActivityStatus = (daysSinceActivity: number) => {
    if (daysSinceActivity <= 7) return "Active"
    if (daysSinceActivity <= 14) return "Recent"
    if (daysSinceActivity <= 30) return "Inactive"
    return "Very Inactive"
  }

  const getStatusBadgeColor = (agent: ActivityData) => {
    if (agent.auto_deactivated_at) return "bg-orange-100 text-orange-800"
    if (agent.isapproved) return "bg-green-100 text-green-800"
    return "bg-red-100 text-red-800"
  }

  const getStatusText = (agent: ActivityData) => {
    if (agent.auto_deactivated_at) return "Auto-Deactivated"
    if (agent.isapproved) return "Approved"
    return "Pending"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading activity data...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.days_since_activity <= 7).length,
    inactive: agents.filter((a) => a.days_since_activity > 30).length,
    highRisk: agents.filter((a) => a.risk_level === "HIGH").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Agent Activity Tracker</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Monitor agent activity patterns and identify inactive agents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-emerald-100">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-emerald-200" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-100">Active (7d)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-green-100">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-red-100">Inactive (30d+)</CardTitle>
            <XCircle className="h-4 w-4 text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-red-100">
              {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-amber-100">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-200" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.highRisk}</div>
            <p className="text-xs text-amber-100">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Filter Agents</CardTitle>
          <CardDescription className="text-sm">Search and filter agents by activity and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAgentActivity} variant="outline" className="bg-transparent">
              <Activity className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Calendar className="h-5 w-5 mr-2" />
            Agent Activity Overview
          </CardTitle>
          <CardDescription className="text-sm">
            Showing {filteredAgents.length} of {agents.length} agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Agent</TableHead>
                  <TableHead className="min-w-[100px]">Phone</TableHead>
                  <TableHead className="min-w-[80px]">Region</TableHead>
                  <TableHead className="min-w-[120px]">Last Activity</TableHead>
                  <TableHead className="min-w-[100px]">Activity Status</TableHead>
                  <TableHead className="min-w-[80px]">Orders</TableHead>
                  <TableHead className="min-w-[80px]">Risk Level</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[150px]">Risk Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No agents found matching the current filters
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
                          {agent.last_activity_at ? (
                            <>
                              <p className="text-sm">{new Date(agent.last_activity_at).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">{agent.days_since_activity} days ago</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No activity</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getActivityBadgeColor(agent.days_since_activity)} text-xs`}>
                          {getActivityStatus(agent.days_since_activity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{agent.data_orders_count_7d || 0}</span> /
                          <span className="font-medium">{agent.data_orders_count_30d || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getRiskBadgeColor(agent.risk_level)} text-xs`}>{agent.risk_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusBadgeColor(agent)} text-xs`}>{getStatusText(agent)}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-48 truncate" title={agent.risk_reason}>
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
    </div>
  )
}
