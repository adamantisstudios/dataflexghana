"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Clock,
  Target,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

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

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  balance_after: number
  description: string
  created_at: string
  formattedAmount: string
  formattedBalance: string
  formattedDate: string
  typeLabel: string
}

interface SavingsProgressTrackerProps {
  savingsId: string
  agentId: string
}

export default function SavingsProgressTracker({ savingsId, agentId }: SavingsProgressTrackerProps) {
  const [savings, setSavings] = useState<SavingsAccount | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSavingsDetails()
    fetchTransactions()
  }, [savingsId, agentId])

  const fetchSavingsDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agent/savings?agentId=${agentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch savings details')
      }

      const savingsAccount = data.savings?.find((s: SavingsAccount) => s.id === savingsId)
      if (!savingsAccount) {
        throw new Error('Savings account not found')
      }

      setSavings(savingsAccount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true)
      const response = await fetch(`/api/agent/savings/transactions?agentId=${agentId}&savingsId=${savingsId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions')
      }

      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setTransactionsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `₵${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  const calculateDailyInterest = () => {
    if (!savings) return 0
    const dailyRate = savings.savings_plans.interest_rate / 100 / 365
    return savings.current_balance * dailyRate
  }

  const calculateMonthlyProjection = () => {
    if (!savings) return 0
    const monthlyRate = savings.savings_plans.interest_rate / 100 / 12
    return savings.current_balance * monthlyRate
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'matured': return 'bg-blue-100 text-blue-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'interest': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'withdrawal': return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'penalty': return <AlertCircle className="h-4 w-4 text-orange-600" />
      default: return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !savings) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Savings account not found'}</p>
            <Button onClick={fetchSavingsDetails} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{savings.savings_plans.name}</h1>
          <p className="text-muted-foreground">{savings.savings_plans.description}</p>
        </div>
        <Badge className={getStatusColor(savings.status)}>
          {savings.status === 'active' ? 'Active' : 
           savings.status === 'matured' ? 'Matured' : 
           savings.status}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(savings.current_balance)}</div>
            <p className="text-xs text-muted-foreground">
              Principal: {formatCurrency(savings.principal_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interest Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(savings.interest_earned)}</div>
            <p className="text-xs text-muted-foreground">
              {savings.savings_plans.interest_rate}% p.a.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{savings.progress}%</div>
            <p className="text-xs text-muted-foreground">
              {savings.daysRemaining > 0 ? `${savings.daysRemaining} days left` : 'Matured'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Interest</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(calculateDailyInterest())}</div>
            <p className="text-xs text-muted-foreground">
              Approx. daily earning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Savings Progress
          </CardTitle>
          <CardDescription>
            Track your savings journey from start to maturity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Maturity</span>
              <span>{savings.progress}%</span>
            </div>
            <Progress value={savings.progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Started: {formatDate(savings.start_date)}</span>
              <span>Matures: {formatDate(savings.maturity_date)}</span>
            </div>
          </div>

          {savings.status === 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">Days Elapsed</p>
                <p className="text-2xl font-bold text-blue-900">
                  {Math.round((100 - savings.progress) / 100 * (savings.savings_plans.duration_months * 30))}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">Monthly Projection</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(calculateMonthlyProjection())}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">Days Remaining</p>
                <p className="text-2xl font-bold text-purple-900">
                  {savings.daysRemaining}
                </p>
              </div>
            </div>
          )}

          {savings.status === 'matured' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="font-semibold text-green-900">Congratulations! Your savings has matured.</p>
                  <p className="text-sm text-green-700">
                    You can now withdraw your funds of {formatCurrency(savings.current_balance)}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={fetchSavingsDetails} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
        {(savings.status === 'active' || savings.status === 'matured') && (
          <Link href={`/agent/savings/withdraw?savingsId=${savings.id}`}>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Request Withdrawal
            </Button>
          </Link>
        )}
        <Link href="/agent/savings">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            View All Savings
          </Button>
        </Link>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All transactions related to this savings account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-gray-100">
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.typeLabel}</p>
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.formattedDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.transaction_type === 'deposit' || transaction.transaction_type === 'interest' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'deposit' || transaction.transaction_type === 'interest' ? '+' : ''}
                      {transaction.formattedAmount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Balance: {transaction.formattedBalance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
