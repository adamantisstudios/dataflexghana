"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Wallet,
  Users,
  DollarSign,
  RefreshCw,
  Activity,
  BarChart3,
  PieChart,
  AlertCircle,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { calculateWalletBalance } from "@/lib/earnings-calculator"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import { batchCalculateEarnings } from "@/lib/batch-calculator"

interface WalletStats {
  totalBalance: number
  totalCommissionBalance: number
  totalAgents: number
  agentsWithBalance: number
  agentsWithCommission: number
  averageBalance: number
  averageCommission: number
  highestBalance: number
  lowestBalance: number
  highestCommission: number
  lastUpdated: string
  isLoading?: boolean
}

interface WalletOverviewTabProps {
  getCachedData?: () => WalletStats | null
  setCachedData?: (data: WalletStats) => void
}

export default function WalletOverviewTab({ getCachedData, setCachedData }: WalletOverviewTabProps) {
  const [stats, setStats] = useState<WalletStats>({
    totalBalance: 0,
    totalCommissionBalance: 0,
    totalAgents: 0,
    agentsWithBalance: 0,
    agentsWithCommission: 0,
    averageBalance: 0,
    averageCommission: 0,
    highestBalance: 0,
    lowestBalance: 0,
    highestCommission: 0,
    lastUpdated: new Date().toISOString(),
    isLoading: true,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWalletStats = useCallback(
    async (useCache = true) => {
      try {
        if (useCache && getCachedData) {
          const cachedData = getCachedData()
          if (cachedData && Date.now() - new Date(cachedData.lastUpdated).getTime() < 60000) {
            setStats({ ...cachedData, isLoading: false })
            return
          }
        }

        setRefreshing(true)
        setError(null)

        // COST-OPTIMIZED: Single batch query that gets all agent IDs and total count
        const [totalAgentsResult, agentsDataResult] = await Promise.allSettled([
          supabase.from("agents").select("*", { count: "exact", head: true }),
          supabase.from("agents").select("id"),
        ])

        const totalAgents = totalAgentsResult.status === "fulfilled" ? totalAgentsResult.value.count || 0 : 0
        const agentsIds =
          agentsDataResult.status === "fulfilled" && agentsDataResult.value.data
            ? agentsDataResult.value.data.map((a) => a.id)
            : []

        // COST-OPTIMIZED: Batch load all agent balances in parallel
        // This is much more efficient than sequential loading
        let totalBalance = 0
        let totalCommissionBalance = 0
        let agentsWithBalance = 0
        let agentsWithCommission = 0
        let averageBalance = 0
        let averageCommission = 0
        let highestBalance = 0
        let highestCommission = 0
        let lowestBalance = 0

        if (agentsIds.length > 0) {
          console.log(`[v0] Loading ${agentsIds.length} agents in parallel batches`)

          // Load all wallet balances in parallel
          const walletResults = await Promise.allSettled(agentsIds.map((id) => calculateWalletBalance(id)))

          // Load all commission summaries in parallel
          const commissionResults = await Promise.allSettled(
            agentsIds.map((id) => getAgentCommissionSummary(id)),
          )

          const walletBalances: number[] = []
          const commissionBalances: number[] = []

          // Process wallet results
          for (let i = 0; i < walletResults.length; i++) {
            const balance =
              walletResults[i].status === "fulfilled" ? walletResults[i].value : 0
            walletBalances.push(balance)
            totalBalance += balance
            if (balance > 0) agentsWithBalance++
            highestBalance = Math.max(highestBalance, balance)
          }

          // Process commission results
          for (let i = 0; i < commissionResults.length; i++) {
            const commission =
              commissionResults[i].status === "fulfilled"
                ? commissionResults[i].value.availableForWithdrawal
                : 0
            commissionBalances.push(commission)
            totalCommissionBalance += commission
            if (commission > 0) agentsWithCommission++
            highestCommission = Math.max(highestCommission, commission)
          }

          if (walletBalances.length > 0) {
            lowestBalance = Math.min(...walletBalances)
            averageBalance = totalBalance / agentsIds.length
          }

          if (commissionBalances.length > 0) {
            averageCommission = totalCommissionBalance / agentsIds.length
          }

          console.log(`[v0] Loaded ${agentsIds.length} agents - Balance: ${totalBalance}, Commissions: ${totalCommissionBalance}`)
        }

        const newStats: WalletStats = {
          totalBalance: Math.max(totalBalance, 0),
          totalCommissionBalance: Math.max(totalCommissionBalance, 0),
          totalAgents,
          agentsWithBalance,
          agentsWithCommission,
          averageBalance: Math.max(averageBalance, 0),
          averageCommission: Math.max(averageCommission, 0),
          highestBalance: Math.max(highestBalance, 0),
          lowestBalance: Math.max(lowestBalance, 0),
          highestCommission: Math.max(highestCommission, 0),
          lastUpdated: new Date().toISOString(),
          isLoading: false,
        }

        setStats(newStats)

        if (setCachedData) {
          setCachedData(newStats)
        }
      } catch (error) {
        console.error("Error loading wallet stats:", error)
        setError("Failed to load wallet statistics. Please try refreshing.")

        if (getCachedData) {
          const cached = getCachedData()
          if (cached) {
            setStats({ ...cached, isLoading: false })
          }
        }
      } finally {
        setRefreshing(false)
      }
    },
    [getCachedData, setCachedData],
  )

  const handleRefresh = async () => {
    await loadWalletStats(false)
  }

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      if (mounted) {
        setStats((prev) => ({ ...prev, isLoading: true }))
        await loadWalletStats()
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [loadWalletStats])

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (stats.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        <Card className="bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-200">
          <CardContent className="pt-6">
            <div className="h-6 bg-emerald-200 rounded w-48 mb-4"></div>
            <div className="h-12 bg-emerald-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-emerald-200 rounded w-32"></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            Wallet System Overview
          </h2>
          <p className="text-gray-600 mt-1">Real-time overview of all agent wallet balances</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2 bg-white hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-emerald-100 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Total System Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl lg:text-5xl font-bold mb-2">{formatCurrency(stats.totalBalance)}</div>
            <div className="flex items-center gap-4 text-emerald-100">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="text-sm">
                  {stats.totalAgents > 0
                    ? `${stats.agentsWithBalance}/${stats.totalAgents} active wallets`
                    : "No agents"}
                </span>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">
                {refreshing ? "Refreshing..." : "Live Data"}
              </Badge>
            </div>
            <p className="text-xs text-emerald-100 mt-3">
              Last updated:{" "}
              {new Date(stats.lastUpdated).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-blue-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Commission Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl lg:text-5xl font-bold mb-2">
              {formatCurrency(stats.totalCommissionBalance)}
            </div>
            <div className="flex items-center gap-4 text-blue-100">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="text-sm">
                  {stats.totalAgents > 0 ? `${stats.agentsWithCommission}/${stats.totalAgents} earning commissions` : "No earnings"}
                </span>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">
                {refreshing ? "Refreshing..." : "Live Data"}
              </Badge>
            </div>
            <p className="text-xs text-blue-100 mt-3">
              Last updated:{" "}
              {new Date(stats.lastUpdated).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.totalAgents.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Agents with Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.agentsWithBalance.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalAgents > 0 ? Math.round((stats.agentsWithBalance / stats.totalAgents) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Agents with Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.agentsWithCommission.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalAgents > 0 ? Math.round((stats.agentsWithCommission / stats.totalAgents) * 100) : 0}% earning
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Average Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{formatCurrency(stats.averageBalance)}</div>
            <p className="text-xs text-gray-600 mt-1">Per agent</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Average Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">{formatCurrency(stats.averageCommission)}</div>
            <p className="text-xs text-gray-600 mt-1">Per agent</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Wallet Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Wallet Balance</span>
              <span className="font-semibold text-lg text-emerald-700">{formatCurrency(stats.totalBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Average per Agent</span>
              <span className="font-semibold text-gray-700">{formatCurrency(stats.averageBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Highest Balance</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.highestBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Lowest Balance</span>
              <span className="font-semibold text-gray-500">{formatCurrency(stats.lowestBalance)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Commission Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Commission Balance</span>
              <span className="font-semibold text-lg text-blue-700">{formatCurrency(stats.totalCommissionBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Average per Agent</span>
              <span className="font-semibold text-gray-700">{formatCurrency(stats.averageCommission)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Highest Commission</span>
              <span className="font-semibold text-blue-600">{formatCurrency(stats.highestCommission)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Earning Agents</span>
              <span className="font-semibold text-blue-600">{stats.agentsWithCommission.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Agent Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Registered Agents</span>
              <span className="font-semibold text-lg text-purple-700">{stats.totalAgents.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Agents with Wallet</span>
              <span className="font-semibold text-green-600">{stats.agentsWithBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Wallet Ratio</span>
              <span className="font-semibold text-purple-600">
                {stats.totalAgents > 0 ? Math.round((stats.agentsWithBalance / stats.totalAgents) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Commission Ratio</span>
              <span className="font-semibold text-purple-600">
                {stats.totalAgents > 0 ? Math.round((stats.agentsWithCommission / stats.totalAgents) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-4 border-l-emerald-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${stats.totalBalance > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
            ></div>
            <span className={`font-medium ${stats.totalBalance > 0 ? "text-emerald-600" : "text-gray-600"}`}>
              {stats.totalBalance > 0 ? "Wallet System Operational" : "System Initialized - No Balances Yet"}
            </span>
          </div>
          <p className="text-gray-600 mt-2 text-sm">
            Last refresh:{" "}
            {new Date(stats.lastUpdated).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}{" "}
            | Total funds in system: {formatCurrency(stats.totalBalance)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
