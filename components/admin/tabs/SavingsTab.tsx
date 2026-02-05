"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  PiggyBank,
  TrendingUp,
  Users,
  Plus,
  Edit,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Settings,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface SavingsPlan {
  id: string
  name: string
  description: string
  interest_rate: number
  minimum_amount: number
  maximum_amount: number | null
  duration_months: number
  early_withdrawal_penalty: number
  is_active: boolean
  created_at: string
}

interface WithdrawalRequest {
  id: string
  agent_id: string
  requested_amount: number
  withdrawal_type: string
  mobile_money_number: string
  mobile_money_network: string
  reason: string
  status: string
  created_at: string
  agents: {
    full_name: string
    phone_number: string
  }
  agent_savings: {
    current_balance: number
    savings_plans: {
      name: string
    }
  }
}

interface SavingsAccount {
  id: string
  agent_id: string
  savings_plan_id: string
  current_balance: number
  interest_earned: number
  status: "active" | "paused" | "stopped" | "completed"
  created_at: string
  agents: {
    full_name: string
    phone_number: string
  }
  savings_plans: {
    name: string
    duration_months: number
  }
}

interface SavingsStats {
  totalSavings: number
  totalInterest: number
  activePlans: number
  totalAgents: number
  pendingWithdrawals: number
}

export default function SavingsTab() {
  const [activeTab, setActiveTab] = useState("overview")
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([])
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [stats, setStats] = useState<SavingsStats>({
    totalSavings: 0,
    totalInterest: 0,
    activePlans: 0,
    totalAgents: 0,
    pendingWithdrawals: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SavingsPlan | null>(null)
  const [showAccountActionDialog, setShowAccountActionDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null)
  const [accountAction, setAccountAction] = useState<"pause" | "resume" | "stop" | "delete" | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    interest_rate: "",
    minimum_amount: "",
    maximum_amount: "",
    duration_months: "",
    early_withdrawal_penalty: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchSavingsPlans(),
        fetchWithdrawalRequests(),
        fetchSavingsAccounts(),
        fetchStats(),
      ])
    } catch (error) {
      let errorMessage = "Unknown error occurred"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      } else if (error && typeof error === "object") {
        errorMessage =
          (error as any).message ||
          (error as any).error_description ||
          (error as any).details ||
          JSON.stringify(error) ||
          "Database error occurred"
      }
      toast.error(`Failed to load savings data: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavingsPlans = async () => {
    const { data, error } = await supabase
      .from("savings_plans")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    setSavingsPlans(data || [])
  }

  const fetchWithdrawalRequests = async () => {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select(`
        *,
        agents (full_name, phone_number),
        agent_savings (
          current_balance,
          savings_plans (name)
        )
      `)
      .order("created_at", { ascending: false })
    if (error) throw error
    setWithdrawalRequests(data || [])
  }

  const fetchSavingsAccounts = async () => {
    const { data, error } = await supabase
      .from("agent_savings")
      .select(`
        *,
        agents (full_name, phone_number),
        savings_plans (name, duration_months)
      `)
      .order("created_at", { ascending: false })
    if (error) throw error
    setSavingsAccounts(data || [])
  }

  const fetchStats = async () => {
    try {
      const { data: savingsData, error: savingsError } = await supabase
        .from("agent_savings")
        .select("current_balance, interest_earned")
        .eq("status", "active")
      if (savingsError) throw savingsError

      const { data: plansData, error: plansError } = await supabase
        .from("savings_plans")
        .select("id")
        .eq("is_active", true)
      if (plansError) throw plansError

      const { data: agentsData, error: agentsError } = await supabase
        .from("agent_savings")
        .select("agent_id")
        .eq("status", "active")
      if (agentsError) throw agentsError

      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawal_requests")
        .select("id")
        .eq("status", "pending")
      if (withdrawalsError) throw withdrawalsError

      const totalSavings = savingsData?.reduce((sum, item) => sum + (item?.current_balance || 0), 0) || 0
      const totalInterest = savingsData?.reduce((sum, item) => sum + (item?.interest_earned || 0), 0) || 0
      const uniqueAgents = agentsData ? new Set(agentsData.map((item) => item?.agent_id).filter(Boolean)).size : 0

      setStats({
        totalSavings,
        totalInterest,
        activePlans: plansData?.length || 0,
        totalAgents: uniqueAgents,
        pendingWithdrawals: withdrawalsData?.length || 0,
      })
    } catch (error) {
      setStats({
        totalSavings: 0,
        totalInterest: 0,
        activePlans: 0,
        totalAgents: 0,
        pendingWithdrawals: 0,
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const planData = {
        name: planForm.name,
        description: planForm.description,
        interest_rate: Number.parseFloat(planForm.interest_rate),
        minimum_amount: Number.parseFloat(planForm.minimum_amount),
        maximum_amount: planForm.maximum_amount ? Number.parseFloat(planForm.maximum_amount) : null,
        duration_months: Number.parseInt(planForm.duration_months),
        early_withdrawal_penalty: Number.parseFloat(planForm.early_withdrawal_penalty),
      }
      if (editingPlan) {
        const { error } = await supabase
          .from("savings_plans")
          .update(planData)
          .eq("id", editingPlan.id)
        if (error) throw error
        toast.success("Savings plan updated successfully")
      } else {
        const { error } = await supabase.from("savings_plans").insert(planData)
        if (error) throw error
        toast.success("Savings plan created successfully")
      }
      setShowPlanDialog(false)
      setEditingPlan(null)
      setPlanForm({
        name: "",
        description: "",
        interest_rate: "",
        minimum_amount: "",
        maximum_amount: "",
        duration_months: "",
        early_withdrawal_penalty: "",
      })
      fetchSavingsPlans()
    } catch (error) {
      toast.error("Failed to save savings plan")
    }
  }

  const handlePlanToggle = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("savings_plans")
        .update({ is_active: !isActive })
        .eq("id", planId)
      if (error) throw error
      toast.success(`Plan ${!isActive ? "activated" : "deactivated"} successfully`)
      fetchSavingsPlans()
    } catch (error) {
      toast.error("Failed to update plan status")
    }
  }

  const handleWithdrawalAction = async (requestId: string, action: "approve" | "reject", notes?: string) => {
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          admin_notes: notes,
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
      if (error) throw error
      toast.success(`Withdrawal request ${action}d successfully`)
      fetchWithdrawalRequests()
    } catch (error) {
      toast.error("Failed to process withdrawal request")
    }
  }

  const handleSavingsAccountAction = async () => {
    if (!selectedAccount || !accountAction) return
    try {
      let updateData: any = {
        status:
          accountAction === "resume"
            ? "active"
            : accountAction === "pause"
            ? "paused"
            : "stopped",
        admin_notes: actionReason || `Account ${accountAction}d by admin`,
      }
      if (accountAction === "delete") {
        updateData.status = "stopped"
        updateData.admin_notes = `Account deleted: ${actionReason || "Deleted by admin"}`
        updateData.deleted_at = new Date().toISOString()
      }
      const { error } = await supabase
        .from("agent_savings")
        .update(updateData)
        .eq("id", selectedAccount.id)
      if (error) throw error
      await supabase.from("admin_logs").insert([
        {
          action: `savings_account_${accountAction}`,
          details: {
            account_id: selectedAccount.id,
            agent_id: selectedAccount.agent_id,
            reason: actionReason,
            timestamp: new Date().toISOString(),
          },
        },
      ])
      toast.success(`Savings account ${accountAction}d successfully`)
      setShowAccountActionDialog(false)
      setSelectedAccount(null)
      setAccountAction(null)
      setActionReason("")
      fetchSavingsAccounts()
    } catch (error) {
      toast.error("Failed to update savings account")
    }
  }

  const exportData = async (type: "plans" | "withdrawals" | "reports") => {
    try {
      const response = await fetch(`/api/admin/savings/export?type=${type}`)
      if (!response.ok) throw new Error("Export failed")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `savings_${type}_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Export completed successfully")
    } catch (error) {
      toast.error("Failed to export data")
    }
  }

  const filteredWithdrawals = withdrawalRequests.filter((request) => {
    const matchesSearch =
      request.agents.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.agents.phone_number.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-16 md:pb-0">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Total Savings</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(stats.totalSavings)}</p>
              </div>
              <PiggyBank className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">Interest Earned</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(stats.totalInterest)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700">Active Plans</p>
                <p className="text-xl font-bold text-purple-900">{stats.activePlans}</p>
              </div>
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700">Total Agents</p>
                <p className="text-xl font-bold text-orange-900">{stats.totalAgents}</p>
              </div>
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700">Pending Withdrawals</p>
                <p className="text-xl font-bold text-red-900">{stats.pendingWithdrawals}</p>
              </div>
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Desktop Tab Navigation */}
        <TabsList className="hidden md:flex w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest savings and withdrawal activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {withdrawalRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{request.agents.full_name}</p>
                        <p className="text-xs text-gray-600">
                          {request.withdrawal_type} - {formatCurrency(request.requested_amount)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          request.status === "pending"
                            ? "secondary"
                            : request.status === "approved"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("plans")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Savings Plan
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("withdrawals")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Review Pending Withdrawals ({stats.pendingWithdrawals})
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => exportData("reports")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Savings Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold">Savings Plans</h3>
              <p className="text-sm text-gray-600">Manage available savings plans</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => exportData("plans")} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setShowPlanDialog(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savingsPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Interest Rate</p>
                      <p className="font-semibold text-green-600">{plan.interest_rate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-semibold">{plan.duration_months} months</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Minimum</p>
                      <p className="font-semibold">{formatCurrency(plan.minimum_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Maximum</p>
                      <p className="font-semibold">
                        {plan.maximum_amount ? formatCurrency(plan.maximum_amount) : "No limit"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingPlan(plan)
                        setPlanForm({
                          name: plan.name,
                          description: plan.description,
                          interest_rate: plan.interest_rate.toString(),
                          minimum_amount: plan.minimum_amount.toString(),
                          maximum_amount: plan.maximum_amount?.toString() || "",
                          duration_months: plan.duration_months.toString(),
                          early_withdrawal_penalty: plan.early_withdrawal_penalty.toString(),
                        })
                        setShowPlanDialog(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant={plan.is_active ? "destructive" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePlanToggle(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold">Savings Accounts</h3>
              <p className="text-sm text-gray-600">Manage agent savings accounts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => exportData("reports")} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Agent</TableHead>
                    <TableHead className="whitespace-nowrap">Plan</TableHead>
                    <TableHead className="whitespace-nowrap">Balance</TableHead>
                    <TableHead className="whitespace-nowrap">Interest</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savingsAccounts
                    .filter(
                      (account) =>
                        (searchTerm === "" ||
                          account.agents.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.agents.phone_number.includes(searchTerm)) &&
                        (statusFilter === "all" || account.status === statusFilter),
                    )
                    .map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <p className="font-medium text-sm">{account.agents.full_name}</p>
                            <p className="text-xs text-gray-500">{account.agents.phone_number}</p>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{account.savings_plans.name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatCurrency(account.current_balance)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-green-600">
                          {formatCurrency(account.interest_earned)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              account.status === "active"
                                ? "default"
                                : account.status === "paused"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {account.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-1">
                            {account.status === "active" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAccount(account)
                                    setAccountAction("pause")
                                    setShowAccountActionDialog(true)
                                  }}
                                >
                                  Pause
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedAccount(account)
                                    setAccountAction("stop")
                                    setShowAccountActionDialog(true)
                                  }}
                                >
                                  Stop
                                </Button>
                              </>
                            )}
                            {account.status === "paused" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedAccount(account)
                                    setAccountAction("resume")
                                    setShowAccountActionDialog(true)
                                  }}
                                >
                                  Resume
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedAccount(account)
                                    setAccountAction("delete")
                                    setShowAccountActionDialog(true)
                                  }}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                            {account.status !== "active" && account.status !== "paused" && (
                              <span className="text-xs text-gray-500">No actions</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold">Withdrawal Requests</h3>
              <p className="text-sm text-gray-600">Review and process requests</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => exportData("withdrawals")} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Agent</TableHead>
                    <TableHead className="whitespace-nowrap">Plan</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Mobile Money</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <p className="font-medium text-sm">{request.agents.full_name}</p>
                          <p className="text-xs text-gray-500">{request.agents.phone_number}</p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {request.agent_savings.savings_plans.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatCurrency(request.requested_amount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {request.withdrawal_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <p className="font-medium text-xs">{request.mobile_money_network}</p>
                          <p className="text-xs text-gray-500">{request.mobile_money_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : request.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {request.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleWithdrawalAction(request.id, "approve")}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleWithdrawalAction(request.id, "reject")}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Reports & Analytics</h3>
            <p className="text-gray-600">Generate comprehensive reports</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Savings Summary
                </CardTitle>
                <CardDescription>Overall savings performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={() => exportData("reports")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Agent Performance
                </CardTitle>
                <CardDescription>Individual agent savings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={() => exportData("reports")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Interest Analysis
                </CardTitle>
                <CardDescription>Interest calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={() => exportData("reports")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mobile Tab Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden">
          <TabsList className="grid grid-cols-5 w-full h-12">
            <TabsTrigger value="overview" className="h-full flex flex-col items-center justify-center text-xs">
              <PiggyBank className="h-4 w-4 mb-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="plans" className="h-full flex flex-col items-center justify-center text-xs">
              <Settings className="h-4 w-4 mb-1" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="accounts" className="h-full flex flex-col items-center justify-center text-xs">
              <Users className="h-4 w-4 mb-1" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="h-full flex flex-col items-center justify-center text-xs">
              <Clock className="h-4 w-4 mb-1" />
              Withdrawals
            </TabsTrigger>
            <TabsTrigger value="reports" className="h-full flex flex-col items-center justify-center text-xs">
              <Download className="h-4 w-4 mb-1" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Savings Plan" : "Create New Savings Plan"}</DialogTitle>
            <DialogDescription>Configure the savings plan details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePlanSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={planForm.name}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.1"
                  value={planForm.interest_rate}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, interest_rate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_amount">Minimum Amount (₵)</Label>
                <Input
                  id="minimum_amount"
                  type="number"
                  step="0.01"
                  value={planForm.minimum_amount}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, minimum_amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximum_amount">Maximum Amount (₵)</Label>
                <Input
                  id="maximum_amount"
                  type="number"
                  step="0.01"
                  value={planForm.maximum_amount}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, maximum_amount: e.target.value }))}
                  placeholder="Leave empty for no limit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_months">Duration (Months)</Label>
                <Input
                  id="duration_months"
                  type="number"
                  value={planForm.duration_months}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, duration_months: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="early_withdrawal_penalty">Early Withdrawal Penalty (%)</Label>
                <Input
                  id="early_withdrawal_penalty"
                  type="number"
                  step="0.1"
                  value={planForm.early_withdrawal_penalty}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, early_withdrawal_penalty: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={planForm.description}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPlanDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingPlan ? "Update Plan" : "Create Plan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Action Dialog */}
      <Dialog open={showAccountActionDialog} onOpenChange={setShowAccountActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {accountAction === "pause"
                ? "Pause Savings Account"
                : accountAction === "resume"
                ? "Resume Savings Account"
                : accountAction === "stop"
                ? "Stop Savings Account"
                : "Delete Savings Account"}
            </DialogTitle>
            <DialogDescription>
              {accountAction === "pause"
                ? "The account will be paused and no further interest will accrue."
                : accountAction === "resume"
                ? "The account will be resumed and interest accrual will continue."
                : accountAction === "stop"
                ? "The account will be stopped. The agent can still withdraw their balance."
                : "The account and all associated data will be permanently deleted."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAccount && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Agent:</span>{" "}
                  <span className="font-medium">{selectedAccount.agents.full_name}</span>
                </p>
                <p>
                  <span className="text-gray-600">Balance:</span>{" "}
                  <span className="font-medium">{formatCurrency(selectedAccount.current_balance)}</span>
                </p>
                <p>
                  <span className="text-gray-600">Current Status:</span>{" "}
                  <span className="font-medium capitalize">{selectedAccount.status}</span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for this action</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for pausing, stopping, or deleting this account..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAccountActionDialog(false)
                setSelectedAccount(null)
                setActionReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavingsAccountAction}
              variant={accountAction === "delete" ? "destructive" : "default"}
            >
              {accountAction === "pause" && "Pause Account"}
              {accountAction === "resume" && "Resume Account"}
              {accountAction === "stop" && "Stop Account"}
              {accountAction === "delete" && "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
