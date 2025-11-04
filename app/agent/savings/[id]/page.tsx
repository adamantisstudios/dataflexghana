"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PiggyBank,
  TrendingUp,
  Calendar,
  DollarSign,
  Download,
  Clock,
  Target,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Info,
  Banknote,
  Calculator
} from 'lucide-react'
import Link from 'next/link'
import { getStoredAgent, type Agent } from '@/lib/unified-auth-system'
import { savingsApi } from '@/lib/api-client-enhanced'
import { BackToTop } from '@/components/back-to-top'

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
    minimum_amount: number
    maximum_amount: number
  }
  transactions?: Array<{
    id: string
    amount: number
    transaction_type: string
    created_at: string
    description: string
  }>
}

export default function SavingsDetailsPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [savings, setSavings] = useState<SavingsAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const savingsId = params.id as string

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get agent from localStorage
        const storedAgent = getStoredAgent()
        if (!storedAgent) {
          router.push('/agent/login')
          return
        }
        setAgent(storedAgent)

        // Load specific savings account details
        const response = await fetch(`/api/agent/savings?agentId=${storedAgent.id}&savingsId=${savingsId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch savings details')
        }

        if (data.savings && data.savings.length > 0) {
          const savingsAccount = data.savings[0]
          
          // Calculate progress and days remaining
          const progress = calculateProgress(savingsAccount.start_date, savingsAccount.maturity_date)
          const daysRemaining = calculateDaysRemaining(savingsAccount.maturity_date)
          const isMatured = progress >= 100

          setSavings({
            ...savingsAccount,
            progress,
            daysRemaining,
            isMatured
          })
        } else {
          throw new Error('Savings account not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (savingsId) {
      loadData()
    }
  }, [router, savingsId])

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate projected earnings
  const calculateProjectedEarnings = () => {
    if (!savings) return { monthly: 0, total: 0 }
    
    const monthlyRate = savings.savings_plans.interest_rate / 12 / 100
    const monthlyEarnings = savings.principal_amount * monthlyRate
    const totalProjected = savings.principal_amount * (savings.savings_plans.interest_rate / 100) * (savings.savings_plans.duration_months / 12)
    
    return {
      monthly: monthlyEarnings,
      total: totalProjected
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading savings details...</p>
        </div>
      </div>
    )
  }

  if (error || !savings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Savings</h3>
            <p className="text-gray-600 mb-4">{error || 'Savings account not found'}</p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/agent/savings">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Savings
                </Link>
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const projectedEarnings = calculateProjectedEarnings()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agent/savings" className="text-white hover:text-blue-200 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                  <PiggyBank className="w-full h-full text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                    {savings.savings_plans.name}
                  </h1>
                  <p className="text-blue-100 font-medium">
                    Savings Account Details
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={savings.isMatured ? "default" : "secondary"}
                className={savings.isMatured ? "bg-green-500 text-white" : "bg-white/20 text-white"}
              >
                {savings.isMatured ? "Matured" : "Active"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Principal Amount</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(savings.principal_amount)}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Current Balance</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(savings.current_balance)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Interest Earned</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(savings.interest_earned)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Interest Rate</p>
                    <p className="text-2xl font-bold text-orange-900">{savings.savings_plans.interest_rate}% p.a.</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Savings Progress
              </CardTitle>
              <CardDescription>
                Track your savings journey from start to maturity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{savings.progress}%</span>
                </div>
                <Progress value={savings.progress} className="h-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-700 font-medium">Start Date</p>
                  <p className="text-lg font-bold text-blue-900">{formatDate(savings.start_date)}</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-700 font-medium">
                    {savings.isMatured ? "Matured" : "Days Remaining"}
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {savings.isMatured ? "Complete!" : `${savings.daysRemaining} days`}
                  </p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-medium">Maturity Date</p>
                  <p className="text-lg font-bold text-green-900">{formatDate(savings.maturity_date)}</p>
                </div>
              </div>

              {savings.isMatured && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Congratulations!</h4>
                  </div>
                  <p className="text-green-700">
                    Your savings plan has matured. You can now withdraw your funds including the earned interest.
                  </p>
                  <div className="mt-4">
                    <Button asChild>
                      <Link href={`/agent/savings/withdraw?savingsId=${savings.id}`}>
                        <Download className="h-4 w-4 mr-2" />
                        Withdraw Funds
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Information */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projections">Projections</TabsTrigger>
              <TabsTrigger value="plan-details">Plan Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account ID:</span>
                      <span className="font-mono text-sm">{savings.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={savings.isMatured ? "default" : "secondary"}>
                        {savings.isMatured ? "Matured" : "Active"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold">{savings.savings_plans.duration_months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-semibold">{savings.savings_plans.interest_rate}% per annum</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Initial Deposit:</span>
                      <span className="font-semibold">{formatCurrency(savings.principal_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Earned:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(savings.interest_earned)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Value:</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(savings.current_balance)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-medium">Total Growth:</span>
                        <span className="font-bold text-purple-600">
                          {formatCurrency(savings.current_balance - savings.principal_amount)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="projections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Earnings Projections
                  </CardTitle>
                  <CardDescription>
                    Estimated earnings based on your savings plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <p className="text-sm text-blue-700 font-medium mb-2">Estimated Monthly Earnings</p>
                      <p className="text-3xl font-bold text-blue-900">{formatCurrency(projectedEarnings.monthly)}</p>
                    </div>

                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-sm text-green-700 font-medium mb-2">Total Projected Interest</p>
                      <p className="text-3xl font-bold text-green-900">{formatCurrency(projectedEarnings.total)}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Projection Details:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Monthly interest rate: {(savings.savings_plans.interest_rate / 12).toFixed(2)}%</li>
                      <li>• Total duration: {savings.savings_plans.duration_months} months</li>
                      <li>• Compounding: Monthly</li>
                      <li>• Final projected balance: {formatCurrency(savings.principal_amount + projectedEarnings.total)}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plan-details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{savings.savings_plans.name}</CardTitle>
                  <CardDescription>{savings.savings_plans.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Plan Features:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{savings.savings_plans.interest_rate}% annual interest rate</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{savings.savings_plans.duration_months} months duration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Minimum: {formatCurrency(savings.savings_plans.minimum_amount || 0)}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Maximum: {formatCurrency(savings.savings_plans.maximum_amount || 0)}</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Important Notes:</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Early Withdrawal Policy:</p>
                            <p>Early withdrawal may result in penalty charges and loss of accrued interest. Please contact support for more information.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline">
              <Link href="/agent/savings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Savings
              </Link>
            </Button>
            
            {savings.isMatured && (
              <Button asChild>
                <Link href={`/agent/savings/withdraw?savingsId=${savings.id}`}>
                  <Download className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Link>
              </Button>
            )}
            
            <Button asChild variant="outline">
              <Link href="/agent/savings/plans">
                <PiggyBank className="h-4 w-4 mr-2" />
                Start New Savings
              </Link>
            </Button>
          </div>
        </div>
      </main>
      
      <BackToTop />
    </div>
  )
}
