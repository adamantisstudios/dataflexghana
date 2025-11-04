"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Wallet, Users, DollarSign, RefreshCw, Activity, BarChart3, PieChart } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface WalletStats {
  totalBalance: number
  totalAgents: number
  agentsWithBalance: number
  averageBalance: number
  highestBalance: number
  lowestBalance: number
  lastUpdated: string
}

interface WalletOverviewTabProps {
  getCachedData?: () => any
  setCachedData?: (data: any) => void
}

export default function WalletOverviewTab({ getCachedData, setCachedData }: WalletOverviewTabProps) {
  const [stats, setStats] = useState<WalletStats>({
    totalBalance: 0,
    totalAgents: 0,
    agentsWithBalance: 0,
    averageBalance: 0,
    highestBalance: 0,
    lowestBalance: 0,
    lastUpdated: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadWalletStats = async (useCache = true) => {
    try {
      // Check cache first
      if (useCache && getCachedData) {
        const cachedData = getCachedData()
        if (cachedData && Date.now() - new Date(cachedData.lastUpdated).getTime() < 300000) {
          // 5 minutes cache
          setStats(cachedData)
          setLoading(false)
          return
        }
      }

      setRefreshing(true)

      const { calculateWalletBalance } = await import("@/lib/earnings-calculator")

      // Get all agents for proper counting
      const { data: agentsData, error: agentsError } = await supabase.from("agents").select("id")

      const totalAgents = agentsData?.length || 0

      const agentBalances = new Map<string, number>()

      if (agentsData && Array.isArray(agentsData)) {
        // Calculate balance for each agent using the same logic as agent side
        for (const agent of agentsData) {
          try {
            const balance = await calculateWalletBalance(agent.id)
            agentBalances.set(agent.id, Math.max(balance, 0))
          } catch (error) {
            console.warn(`Could not calculate balance for agent ${agent.id}:`, error)
            agentBalances.set(agent.id, 0)
          }
        }
      }

      const balances = Array.from(agentBalances.values()).filter(
        (balance) => typeof balance === "number" && !isNaN(balance),
      )
      const positiveBalances = balances.filter((balance) => balance > 0)

      const totalBalance = balances.reduce((sum, balance) => sum + balance, 0)
      const agentsWithBalance = positiveBalances.length
      const averageBalance = balances.length > 0 ? totalBalance / balances.length : 0
      const highestBalance = balances.length > 0 ? Math.max(...balances) : 0
      const lowestBalance = balances.length > 0 ? Math.min(...balances) : 0

      const newStats = {
        totalBalance: Math.max(totalBalance, 0), // Ensure non-negative
        totalAgents,
        agentsWithBalance,
        averageBalance: Math.max(averageBalance, 0),
        highestBalance: Math.max(highestBalance, 0),
        lowestBalance: Math.max(lowestBalance, 0),
        lastUpdated: new Date().toISOString(),
      }

      console.log("✅ Wallet overview stats calculated using agent-side method:", {
        totalBalance: newStats.totalBalance,
        totalAgents: newStats.totalAgents,
        agentsWithBalance: newStats.agentsWithBalance,
        calculationMethod: "agent-side-unified-calculator",
      })

      setStats(newStats)

      // Cache the results
      if (setCachedData) {
        setCachedData(newStats)
      }
    } catch (error) {
      console.error("Error loading wallet stats:", error)
      // Set safe default values on error
      setStats({
        totalBalance: 0,
        totalAgents: 0,
        agentsWithBalance: 0,
        averageBalance: 0,
        highestBalance: 0,
        lowestBalance: 0,
        lastUpdated: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    await loadWalletStats(false)
  }

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (isMounted) {
        await loadWalletStats()
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [getCachedData, setCachedData])

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
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
          <p className="text-gray-600 mt-1">Complete overview of all agent wallet balances in the system</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Total Balance Card */}
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
              <span className="text-sm">System Active</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">Live Data</Badge>
          </div>
          <p className="text-xs text-emerald-100 mt-3">Last updated: {new Date(stats.lastUpdated).toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAgents.toLocaleString()}</div>
            <p className="text-xs text-blue-100 mt-1">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Agents with Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.agentsWithBalance.toLocaleString()}</div>
            <p className="text-xs text-purple-100 mt-1">
              {stats.totalAgents > 0 ? Math.round((stats.agentsWithBalance / stats.totalAgents) * 100) : 0}% of total
              agents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Average Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.averageBalance)}</div>
            <p className="text-xs text-orange-100 mt-1">Per agent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Balance Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(stats.highestBalance)}</div>
            <p className="text-xs text-indigo-100 mt-1">Highest: {formatCurrency(stats.highestBalance)}</p>
            <p className="text-xs text-indigo-100">Lowest: {formatCurrency(stats.lowestBalance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total System Balance</span>
              <span className="font-semibold text-lg">{formatCurrency(stats.totalBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Average per Agent</span>
              <span className="font-semibold">{formatCurrency(stats.averageBalance)}</span>
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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Agent Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Registered Agents</span>
              <span className="font-semibold text-lg">{stats.totalAgents.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Agents with Balance</span>
              <span className="font-semibold text-green-600">{stats.agentsWithBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Agents with Zero Balance</span>
              <span className="font-semibold text-gray-500">
                {(stats.totalAgents - stats.agentsWithBalance).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Active Wallet Ratio</span>
              <span className="font-semibold text-blue-600">
                {stats.totalAgents > 0 ? Math.round((stats.agentsWithBalance / stats.totalAgents) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicator */}
      <Card className="shadow-lg border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-600 font-medium">Wallet System Operational</span>
          </div>
          <p className="text-gray-600 mt-2 text-sm">
            All wallet operations are functioning normally. Last data refresh:{" "}
            {new Date(stats.lastUpdated).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
