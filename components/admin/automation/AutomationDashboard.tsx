"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Activity,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  TrendingUp,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { useAgentAutomation } from "@/hooks/useAgentAutomation"

interface AutomationDashboardProps {
  onSwitchToInactivityTracker?: () => void
}

export function AutomationDashboard({ onSwitchToInactivityTracker }: AutomationDashboardProps) {
  const { loading, automationStats, agentsAtRisk, error, runAutomation, reactivateAgent, refreshData } =
    useAgentAutomation()

  useEffect(() => {
    refreshData()
  }, [refreshData])

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

  const handleRunAutomation = async () => {
    try {
      await runAutomation()
    } catch (error) {
      // Error handling is done in the hook
      console.error("Automation run failed:", error)
    }
  }

  const handleReactivateAgent = async (agentId: string, agentName: string) => {
    try {
      await reactivateAgent(agentId, `Manually reactivated ${agentName} by admin`)
    } catch (error) {
      // Error handling is done in the hook
      console.error("Agent reactivation failed:", error)
    }
  }

  const handleRefreshData = async () => {
    try {
      await refreshData()
    } catch (error) {
      console.error("Data refresh failed:", error)
    }
  }

  // Error state
  if (error && !automationStats && agentsAtRisk.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Automation Dashboard</h2>
            <p className="text-sm sm:text-base text-gray-600">Monitor and control agent inactivity automation</p>
          </div>
        </div>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRefreshData}
                disabled={loading}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Loading
                  </>
                )}
              </Button>
              <Button onClick={handleRunAutomation} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Try Manual Check
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Manual Run Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Automation Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600">Monitor and control agent inactivity automation</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {onSwitchToInactivityTracker && (
            <Button
              onClick={onSwitchToInactivityTracker}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent text-sm px-4 py-2"
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Go to Inactivity Tracker</span>
              <span className="sm:hidden">Inactivity Tracker</span>
            </Button>
          )}
          <Button
            onClick={handleRefreshData}
            disabled={loading}
            variant="outline"
            className="text-sm px-4 py-2 bg-transparent"
            size="sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                <span className="hidden sm:inline">Refreshing...</span>
                <span className="sm:hidden">Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </>
            )}
          </Button>
          <Button
            onClick={handleRunAutomation}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2"
            size="sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="hidden sm:inline">Running...</span>
                <span className="sm:hidden">Running...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Run Manual Check</span>
                <span className="sm:hidden">Run Check</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {automationStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-100">Total Runs (30d)</CardTitle>
              <Activity className="h-4 w-4 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{automationStats.total_runs ?? 0}</div>
              <p className="text-xs text-blue-100">
                {automationStats.successful_runs ?? 0} successful, {automationStats.failed_runs ?? 0} failed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-emerald-100">Agents Processed</CardTitle>
              <Users className="h-4 w-4 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{automationStats.total_agents_processed ?? 0}</div>
              <p className="text-xs text-emerald-100">{automationStats.total_agents_deactivated ?? 0} deactivated</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-100">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {(automationStats.total_runs ?? 0) > 0
                  ? Math.round(((automationStats.successful_runs ?? 0) / (automationStats.total_runs ?? 1)) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-green-100">Avg: {Math.round(automationStats.avg_execution_time_ms ?? 0)}ms</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-100">Last Run</CardTitle>
              <Clock className="h-4 w-4 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl font-bold">
                {automationStats.last_run_at ? new Date(automationStats.last_run_at).toLocaleDateString() : "Never"}
              </div>
              <p className="text-xs text-purple-100">
                Next:{" "}
                {automationStats.next_recommended_run
                  ? new Date(automationStats.next_recommended_run).toLocaleDateString()
                  : "Not scheduled"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agents at Risk */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            Agents at Risk ({agentsAtRisk?.length ?? 0})
          </CardTitle>
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
                  <TableHead className="min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!agentsAtRisk || agentsAtRisk.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {loading ? "Loading agents at risk..." : "No agents at risk found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  agentsAtRisk.map((agent) => (
                    <TableRow key={agent.agent_id || Math.random()}>
                      <TableCell className="font-medium text-sm">{agent.agent_name || "Unknown Agent"}</TableCell>
                      <TableCell className="text-sm">{agent.phone_number || "N/A"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {agent.last_activity_at
                              ? new Date(agent.last_activity_at).toLocaleDateString()
                              : "No activity"}
                          </p>
                          <p className="text-xs text-gray-500">{agent.days_since_activity ?? 0} days ago</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{agent.orders_7d ?? 0}</span> /
                          <span className="font-medium">{agent.orders_30d ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getRiskBadgeColor(agent.risk_level || "LOW")} text-xs`}>
                          {agent.risk_level || "LOW"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-64 truncate" title={agent.risk_reason || "No risk reason"}>
                          {agent.risk_reason || "No risk reason"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReactivateAgent(agent.agent_id, agent.agent_name || "Unknown Agent")}
                          disabled={loading || !agent.agent_id}
                          className="text-xs px-2 py-1 h-auto bg-transparent"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Preemptive Reactivate</span>
                          <span className="sm:hidden">Reactivate</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Automation Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Automation Configuration</CardTitle>
          <CardDescription className="text-sm">Current automation settings and criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Deactivation Criteria</h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• No activity for 30+ days</li>
                <li>• Less than 10 orders in 7 days AND less than 40 orders in 30 days</li>
                <li>• Agents are automatically set to "pending" status</li>
                <li>• Manual reactivation available for admins</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Schedule & Monitoring</h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• Automation runs daily at 2:00 AM UTC</li>
                <li>• Real-time risk assessment available</li>
                <li>• Comprehensive activity logging</li>
                <li>• Admin override capabilities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
