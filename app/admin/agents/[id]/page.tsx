"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
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
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
    if (agentId) fetchAgentDetails()
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
      } catch (err) {
        console.error("Commission fallback:", err)
        const totalCommissions = Number(data.totalcommissions) || 0
        const totalPaidOut = Number(data.totalpaidout) || 0
        availableCommissions = Math.max(0, totalCommissions - totalPaidOut)
      }

      setAgent({ ...data, commission_balance: availableCommissions })
    } catch (err) {
      console.error("Error fetching agent:", err)
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
      const { error } = await supabase
        .from("agents")
        .update({ isapproved: !agent.isapproved })
        .eq("id", agentId)
      if (error) throw error
      setAgent({ ...agent, isapproved: !agent.isapproved })
      toast.success(`Agent ${!agent.isapproved ? "approved" : "suspended"} successfully`)
    } catch (err) {
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
        p_admin_notes: `Manually reactivated on ${new Date().toISOString()}`,
      })
      if (error) throw error
      if (data) {
        toast.success("Agent reactivated successfully")
        fetchAgentDetails()
      } else toast.error("Agent could not be reactivated")
    } catch {
      toast.error("Failed to reactivate agent")
    } finally {
      setUpdating(false)
    }
  }

  const getActivityStatus = (agent: AgentDetails) => {
    if (!agent.last_activity_at) return "No Activity"
    const days = Math.floor((Date.now() - new Date(agent.last_activity_at).getTime()) / 86400000)
    if (days <= 7) return "Active"
    if (days <= 30) return "Inactive (7d+)"
    return "Inactive (30d+)"
  }

  const getActivityBadgeColor = (agent: AgentDetails) => {
    if (!agent.last_activity_at) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    const days = Math.floor((Date.now() - new Date(agent.last_activity_at).getTime()) / 86400000)
    if (days <= 7) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (days <= 30) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading agent details...</p>
        </div>
      </div>
    )

  if (!agent)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Agent Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-5">The requested agent could not be found.</p>
          <Button asChild>
            <Link href="/admin/agents">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Agents
            </Link>
          </Button>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/agents">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Agent Details</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete information for {agent.full_name}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {agent.auto_deactivated_at ? (
              <Button
                onClick={reactivateAgent}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {updating ? "Reactivating..." : <><RotateCcw className="h-4 w-4 mr-2" /> Reactivate</>}
              </Button>
            ) : (
              <Button
                onClick={toggleAgentApproval}
                disabled={updating}
                variant={agent.isapproved ? "destructive" : "default"}
                size="sm"
              >
                {updating
                  ? "Updating..."
                  : agent.isapproved
                  ? <><XCircle className="h-4 w-4 mr-2" /> Suspend</>
                  : <><CheckCircle className="h-4 w-4 mr-2" /> Approve</>}
              </Button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-5 w-5" /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ["Full Name", agent.full_name, <User key="1" className="h-4 w-4" />],
                    ["Phone Number", agent.phone_number, <Phone key="2" className="h-4 w-4" />],
                    ["Region", agent.region, <MapPin key="3" className="h-4 w-4" />],
                    ["Registration Date", new Date(agent.created_at).toLocaleDateString(), <Calendar key="4" className="h-4 w-4" />],
                  ].map(([label, value, icon], i) => (
                    <div key={i}>
                      <label className="text-gray-500 dark:text-gray-400">{label}</label>
                      <p className="font-medium flex items-center gap-2">{icon} {value}</p>
                    </div>
                  ))}
                </div>

                {agent.momo_number && (
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Mobile Money Number</label>
                    <p className="font-medium">{agent.momo_number}</p>
                  </div>
                )}
                {agent.referral_id && (
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Referral ID</label>
                    <p className="font-medium">{agent.referral_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Info */}
            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Activity className="h-5 w-5" /> Activity Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Activity Status</label>
                    <div className="mt-1">
                      <Badge className={`${getActivityBadgeColor(agent)} px-3 py-1`}>
                        {getActivityStatus(agent)}
                      </Badge>
                    </div>
                  </div>
                  {agent.last_activity_at && (
                    <div>
                      <label className="text-gray-500 dark:text-gray-400">Last Activity</label>
                      <p className="font-medium">
                        {new Date(agent.last_activity_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Orders (7 days)</label>
                    <p className="font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" /> {agent.data_orders_count_7d || 0}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Orders (30 days)</label>
                    <p className="font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" /> {agent.data_orders_count_30d || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deactivation Info */}
            {agent.auto_deactivated_at && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 hover:shadow-md transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                    <AlertTriangle className="h-5 w-5" /> Deactivation Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <label className="text-orange-700 dark:text-orange-400">Deactivated On</label>
                    <p className="font-medium">{new Date(agent.auto_deactivated_at).toLocaleDateString()}</p>
                  </div>
                  {agent.auto_deactivation_reason && (
                    <div>
                      <label className="text-orange-700 dark:text-orange-400">Reason</label>
                      <p className="font-medium">{agent.auto_deactivation_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Section */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="text-center">
                  <Badge
                    className={`px-3 py-1 ${
                      agent.auto_deactivated_at
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        : agent.isapproved
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {agent.auto_deactivated_at ? "Auto-Deactivated" : agent.isapproved ? "Approved" : "Pending"}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  {[
                    ["Wallet Balance", agent.wallet_balance || 0, "text-gray-900"],
                    ["Available Commission", agent.commission_balance || 0, "text-green-600"],
                    ["Available to Withdraw", agent.commission_balance || 0, "text-blue-600"],
                  ].map(([label, val, color], i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">{label}</span>
                      <span className={`font-medium flex items-center gap-1 ${color}`}>
                        <Coins className="h-4 w-4" /> GH₵ {Number(val).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Orders</span>
                    <span className="font-medium">
                      {(agent.data_orders_count_7d || 0) + (agent.data_orders_count_30d || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Registered</span>
                    <span className="font-medium">
                      {Math.floor((Date.now() - new Date(agent.created_at).getTime()) / 86400000)} days ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/agents/${agentId}/chat-history`}>
                    <Activity className="h-4 w-4 mr-2" /> View Chat History
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/agents/${agentId}/data-orders`}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> View Order History
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
