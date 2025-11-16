"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PiggyBank, TrendingUp, Calendar, DollarSign, Plus, Eye, Download, Clock, Wallet } from "lucide-react"
import Link from "next/link"

interface SavingsAccount {
  id: string
  principal_amount: number
  current_balance: number
  interest_earned: number
  start_date: string
  maturity_date: string
  status: string
  progress: number
  daysRemaining: number
  isMatured: boolean
  savings_plans: {
    name: string
    description: string
    interest_rate: number
    duration_months: number
  }
}

interface SavingsDashboardProps {
  agentId: string
  walletBalance?: number
  onBalanceUpdate?: () => void
}

export default function SavingsDashboard({ agentId, walletBalance = 0, onBalanceUpdate }: SavingsDashboardProps) {
  const [savings, setSavings] = useState<SavingsAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSavings()
  }, [agentId])

  const fetchSavings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agent/savings?agentId=${agentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch savings")
      }

      setSavings(data.savings || [])

      if (onBalanceUpdate) {
        onBalanceUpdate()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Format currency in Cedi
  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Calculate progress percentage
  const calculateProgress = (startDate: string, maturityDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(maturityDate).getTime()
    const now = new Date().getTime()

    if (now >= end) return 100
    if (now <= start) return 0

    return Math.round(((now - start) / (end - start)) * 100)
  }

  // Calculate days remaining
  const calculateDaysRemaining = (maturityDate: string) => {
    const end = new Date(maturityDate).getTime()
    const now = new Date().getTime()
    const diffTime = end - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const totalSavings = savings.reduce((sum, saving) => sum + saving.current_balance, 0)
  const totalInterest = savings.reduce((sum, saving) => sum + saving.interest_earned, 0)
  const activeSavings = savings.filter((s) => s.status === "active")
  const maturedSavings = savings.filter((s) => s.status === "matured")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSavings} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Wallet Balance</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(walletBalance)}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Invested</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totalSavings)}</p>
              </div>
              <PiggyBank className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Current Balance</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalSavings)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Interest Earned</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalInterest)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/agent/savings/plans">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Start New Savings
          </Button>
        </Link>
        <Link href="/agent/savings/withdraw">
          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Request Withdrawal
          </Button>
        </Link>
      </div>

      {/* Savings Accounts */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({activeSavings.length})</TabsTrigger>
          <TabsTrigger value="matured">Matured ({maturedSavings.length})</TabsTrigger>
          <TabsTrigger value="all">All ({savings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeSavings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <PiggyBank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Savings</h3>
                  <p className="text-gray-500 mb-4">Start your savings journey today!</p>
                  <Link href="/agent/savings/plans">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Browse Savings Plans
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            activeSavings.map((saving) => <SavingsAccountCard key={saving.id} saving={saving} />)
          )}
        </TabsContent>

        <TabsContent value="matured" className="space-y-4">
          {maturedSavings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Matured Savings</h3>
                  <p className="text-gray-500">Your matured savings will appear here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            maturedSavings.map((saving) => <SavingsAccountCard key={saving.id} saving={saving} />)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {savings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <PiggyBank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Savings Yet</h3>
                  <p className="text-gray-500 mb-4">Start building your financial future today!</p>
                  <Link href="/agent/savings/plans">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {savings.map((account) => {
                const progress = calculateProgress(account.start_date, account.maturity_date)
                const daysRemaining = calculateDaysRemaining(account.maturity_date)
                const isMatured = progress >= 100

                return (
                  <Card key={account.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{account.savings_plans.name}</CardTitle>
                        <Badge variant={isMatured ? "default" : "secondary"}>{isMatured ? "Matured" : "Active"}</Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {account.savings_plans.interest_rate}% p.a. • {account.savings_plans.duration_months} months
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Principal</p>
                          <p className="font-semibold">{formatCurrency(account.principal_amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Current Balance</p>
                          <p className="font-semibold text-green-600">{formatCurrency(account.current_balance)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Interest Earned</p>
                          <p className="font-semibold text-blue-600">{formatCurrency(account.interest_earned)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Days Left</p>
                          <p className="font-semibold">{isMatured ? "Matured" : `${daysRemaining} days`}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                          <Link href={`/agent/savings/progress?savingsId=${account.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                        {isMatured && (
                          <Button size="sm" className="flex-1" asChild>
                            <Link href={`/agent/savings/withdraw?savingsId=${account.id}`}>
                              <Download className="h-4 w-4 mr-2" />
                              Withdraw
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SavingsAccountCard({ saving }: { saving: SavingsAccount }) {
  const formatCurrency = (amount: number) => `₵${amount.toFixed(2)}`
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "matured":
        return "bg-blue-100 text-blue-800"
      case "withdrawn":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "matured":
        return "Matured"
      case "withdrawn":
        return "Withdrawn"
      default:
        return status
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{saving.savings_plans.name}</CardTitle>
            <CardDescription>{saving.savings_plans.description}</CardDescription>
          </div>
          <Badge className={getStatusColor(saving.status)}>{getStatusLabel(saving.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Principal</p>
            <p className="text-lg font-semibold">{formatCurrency(saving.principal_amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(saving.current_balance)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Interest Earned</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(saving.interest_earned)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Interest Rate</p>
            <p className="text-lg font-semibold">{saving.savings_plans.interest_rate}% p.a.</p>
          </div>
        </div>

        {saving.status === "active" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{saving.progress}%</span>
            </div>
            <Progress value={saving.progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Started: {formatDate(saving.start_date)}</span>
              <span>
                {saving.daysRemaining > 0 ? (
                  <span className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {saving.daysRemaining} days left
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">Matured!</span>
                )}
              </span>
            </div>
          </div>
        )}

        {saving.status === "matured" && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Congratulations!</strong> Your savings has matured on {formatDate(saving.maturity_date)}. You can
              now withdraw your funds.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Link href={`/agent/savings/${saving.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </Link>
          {(saving.status === "active" || saving.status === "matured") && (
            <Link href={`/agent/savings/withdraw?savingsId=${saving.id}`}>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
