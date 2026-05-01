"use client"

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Activity,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAgentAutomation } from '@/hooks/useAgentAutomation'

interface AutomationDashboardProps {
  onSwitchToInactivityTracker?: () => void
}

export function AutomationDashboard({ onSwitchToInactivityTracker }: AutomationDashboardProps) {
  const {
    loading,
    automationStats,
    agentsAtRisk,
    runAutomation,
    reactivateAgent,
    refreshData,
  } = useAgentAutomation()

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRunAutomation = async () => {
    try {
      await runAutomation()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleReactivateAgent = async (agentId: string, agentName: string) => {
    try {
      await reactivateAgent(agentId, `Manually reactivated ${agentName} by admin`)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Manual Run Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automation Dashboard</h2>
          <p className="text-gray-600">Monitor and control agent inactivity automation</p>
        </div>
        <div className="flex items-center space-x-3">
          {onSwitchToInactivityTracker && (
            <Button
              onClick={onSwitchToInactivityTracker}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Activity className="h-4 w-4 mr-2" />
              Go to Inactivity Tracker
            </Button>
          )}
          <Button
            onClick={handleRunAutomation}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Manual Check
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {automationStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs (30d)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{automationStats.total_runs}</div>
              <p className="text-xs text-muted-foreground">
                {automationStats.successful_runs} successful, {automationStats.failed_runs} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents Processed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{automationStats.total_agents_processed}</div>
              <p className="text-xs text-muted-foreground">
                {automationStats.total_agents_deactivated} deactivated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {automationStats.total_runs > 0
                  ? Math.round((automationStats.successful_runs / automationStats.total_runs) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {Math.round(automationStats.avg_execution_time_ms)}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Run</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {automationStats.last_run_at
                  ? new Date(automationStats.last_run_at).toLocaleDateString()
                  : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">
                Next: {automationStats.next_recommended_run
                  ? new Date(automationStats.next_recommended_run).toLocaleDateString()
                  : 'Not scheduled'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agents at Risk */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            Agents at Risk ({agentsAtRisk.length})
          </CardTitle>
          <CardDescription>
            Agents who may be automatically deactivated due to inactivity or low order volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Orders (7d/30d)</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Risk Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentsAtRisk.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No agents at risk found
                    </TableCell>
                  </TableRow>
                ) : (
                  agentsAtRisk.map((agent) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell className="font-medium">{agent.agent_name}</TableCell>
                      <TableCell>{agent.phone_number}</TableCell>
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
                        <Badge className={getRiskBadgeColor(agent.risk_level)}>
                          {agent.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-64 truncate" title={agent.risk_reason}>
                          {agent.risk_reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReactivateAgent(agent.agent_id, agent.agent_name)}
                          disabled={loading}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Preemptive Reactivate
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
          <CardTitle>Automation Configuration</CardTitle>
          <CardDescription>Current automation settings and criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Deactivation Criteria</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• No activity for 30+ days</li>
                <li>• Less than 10 orders in 7 days AND less than 40 orders in 30 days</li>
                <li>• Agents are automatically set to "pending" status</li>
                <li>• Manual reactivation available for admins</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Schedule & Monitoring</h4>
              <ul className="text-sm text-gray-600 space-y-1">
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
