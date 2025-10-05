"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Coins,
  ShoppingCart,
  Activity,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"
import Link from "next/link"
import { toast } from "sonner"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"

interface AgentDetails extends Agent {
  data_orders_count_7d?: number
  data_orders_count_30d?: number
  wallet_balance?: number
  commission_balance?: number
  last_activity_at?: string
  auto_deactivation_reason?: string
  auto_deactivated_at?: string
}

export default function AgentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<AgentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (agentId) {
      fetchAgentDetails()
    }
  }, [agentId])

  const fetchAgentDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("agents").select("*").eq("id", agentId).single()

      if (error) throw error

      let availableCommissions = 0
      try {
        const commissionSummary = await getAgentCommissionSummary(agentId)
        availableCommissions = commissionSummary.availableCommissions || 0

        console.log("✅ Admin agent details using unified commission system:", {
          agentId,
          availableCommissions,
          totalCommissions: commissionSummary.totalCommissions,
          referralCommissions: commissionSummary.referralCommissions,
          dataOrderCommissions: commissionSummary.dataOrderCommissions,
          wholesaleCommissions: commissionSummary.wholesaleCommissions,
        })
      } catch (earningsError) {
        console.error("Error with unified commission system, falling back to legacy:", earningsError)

        const totalCommissions = Number(data.totalcommissions) || 0
        const totalPaidOut = Number(data.totalpaidout) || 0
        availableCommissions = Math.max(0, totalCommissions - totalPaidOut)

        console.log("⚠️ Admin agent details using legacy fallback:", {
          agentId,
          totalCommissions,
          totalPaidOut,
          availableCommissions,
        })
      }

      setAgent({ ...data, commission_balance: availableCommissions })
    } catch (error) {
      console.error("Error fetching agent details:", error)
      toast.error("Failed to fetch agent details")
      router.push("/admin/agents")
    } finally {
      setLoading(false)
    }
  }

  const toggleAgentApproval = async () => {
    if (!agent) return

    try {
      setUpdating(true)
      const { error } = await supabase.from("agents").update({ isapproved: !agent.isapproved }).eq("id", agentId)

      if (error) throw error

      setAgent({ ...agent, isapproved: !agent.isapproved })
      toast.success(`Agent ${!agent.isapproved ? "approved" : "suspended"} successfully`)
    } catch (error) {
      console.error("Error updating agent:", error)
      toast.error("Failed to update agent status")
    } finally {
      setUpdating(false)
    }
  }

  const reactivateAgent = async () => {
    if (!agent) return

    try {
      setUpdating(true)
      const { data, error } = await supabase.rpc("reactivate_agent", {
        p_agent_id: agentId,
        p_admin_notes: `Manually reactivated by admin on ${new Date().toISOString()}`,
      })

      if (error) throw error

      if (data) {
        toast.success("Agent has been reactivated successfully")
        fetchAgentDetails()
      } else {
        toast.error("Agent could not be reactivated")
      }
    } catch (error) {
      console.error("Error reactivating agent:", error)
      toast.error("Failed to reactivate agent")
    } finally {
      setUpdating(false)
    }
  }

  const getActivityStatus = (agent: AgentDetails) => {
    if (!agent.last_activity_at) return "No Activity"

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(agent.last_activity_at).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (daysSinceActivity <= 7) return "Active"
    if (daysSinceActivity <= 30) return "Inactive (7d+)"
    return "Inactive (30d+)"
  }

  const getActivityBadgeColor = (agent: AgentDetails) => {
    if (!agent.last_activity_at) return "bg-gray-100 text-gray-800"

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(agent.last_activity_at).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (daysSinceActivity <= 7) return "bg-green-100 text-green-800"
    if (daysSinceActivity <= 30) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading agent details...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h2>
          <p className="text-gray-600 mb-6">The requested agent could not be found.</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button variant="outline" size="sm" asChild className="w-fit bg-transparent">
              <Link href="/admin/agents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agents
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agent Details</h1>
              <p className="text-sm sm:text-base text-gray-600">Complete information for {agent.full_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {agent.auto_deactivated_at ? (
              <Button
                onClick={reactivateAgent}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Reactivating...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reactivate
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={toggleAgentApproval}
                disabled={updating}
                variant={agent.isapproved ? "destructive" : "default"}
                size="sm"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : agent.isapproved ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Suspend
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg font-semibold">{agent.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {agent.phone_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Region</label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {agent.region}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(agent.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {agent.momo_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mobile Money Number</label>
                    <p className="text-lg font-semibold">{agent.momo_number}</p>
                  </div>
                )}

                {agent.referral_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Referral ID</label>
                    <p className="text-lg font-semibold">{agent.referral_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Activity Status</label>
                    <div className="mt-1">
                      <Badge className={getActivityBadgeColor(agent)}>{getActivityStatus(agent)}</Badge>
                    </div>
                  </div>
                  {agent.last_activity_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Activity</label>
                      <p className="text-lg font-semibold">{new Date(agent.last_activity_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Orders (7 days)</label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      {agent.data_orders_count_7d || 0}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Orders (30 days)</label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      {agent.data_orders_count_30d || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deactivation Information */}
            {agent.auto_deactivated_at && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-5 w-5" />
                    Deactivation Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-orange-700">Deactivated On</label>
                    <p className="text-lg font-semibold text-orange-900">
                      {new Date(agent.auto_deactivated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {agent.auto_deactivation_reason && (
                    <div>
                      <label className="text-sm font-medium text-orange-700">Reason</label>
                      <p className="text-lg font-semibold text-orange-900">{agent.auto_deactivation_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Status and Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge
                    className={`text-lg px-4 py-2 ${
                      agent.auto_deactivated_at
                        ? "bg-orange-100 text-orange-800"
                        : agent.isapproved
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {agent.auto_deactivated_at ? "Auto-Deactivated" : agent.isapproved ? "Approved" : "Pending"}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Wallet Balance</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      GH₵ {(agent.wallet_balance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available Commission</span>
                    <span className="font-semibold flex items-center gap-1 text-green-600">
                      <Coins className="h-4 w-4" />
                      GH₵ {(agent.commission_balance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available to Withdraw</span>
                    <span className="font-semibold flex items-center gap-1 text-blue-600">
                      <Coins className="h-4 w-4" />
                      GH₵ {(agent.commission_balance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-semibold">
                      {(agent.data_orders_count_7d || 0) + (agent.data_orders_count_30d || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Registration</span>
                    <span className="font-semibold">
                      {Math.floor((Date.now() - new Date(agent.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href={`/admin/agents/${agentId}/chat-history`}>
                    <Activity className="h-4 w-4 mr-2" />
                    View Chat History
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href={`/admin/agents/${agentId}/data-orders`}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View Order History
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
