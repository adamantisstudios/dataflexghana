"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Calculator,
  PiggyBank,
  TrendingUp,
  Calendar,
  DollarSign,
  Info,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

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
}

interface SavingsPlansProps {
  agentId: string
  walletBalance?: number
}

export default function SavingsPlansSelector({ agentId, walletBalance = 0 }: SavingsPlansProps) {
  const [plans, setPlans] = useState<SavingsPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SavingsPlan | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agent/savings/plans')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch savings plans')
      }

      setPlans(data.plans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `₵${amount.toFixed(2)}`

  const calculateProjectedReturn = (plan: SavingsPlan, amount: number) => {
    const monthlyRate = plan.interest_rate / 100 / 12
    const compoundedAmount = amount * Math.pow(1 + monthlyRate, plan.duration_months)
    return compoundedAmount - amount
  }

  const calculateMaturityAmount = (plan: SavingsPlan, amount: number) => {
    const monthlyRate = plan.interest_rate / 100 / 12
    return amount * Math.pow(1 + monthlyRate, plan.duration_months)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
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
            <Button onClick={fetchPlans} variant="outline">
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
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Savings Plan</h2>
        <p className="text-muted-foreground">
          Start building your financial future with our competitive savings plans
        </p>
        {walletBalance > 0 && (
          <p className="text-sm text-green-600 font-medium">
            Available Balance: {formatCurrency(walletBalance)}
          </p>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {plan.interest_rate}% p.a.
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Min Amount</p>
                    <p className="text-muted-foreground">{formatCurrency(plan.minimum_amount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-muted-foreground">{plan.duration_months} months</p>
                  </div>
                </div>
              </div>

              {plan.maximum_amount && (
                <div className="text-sm">
                  <p className="font-medium">Maximum Amount: {formatCurrency(plan.maximum_amount)}</p>
                </div>
              )}

              {plan.early_withdrawal_penalty > 0 && (
                <div className="text-sm text-amber-600">
                  <p>Early withdrawal penalty: {plan.early_withdrawal_penalty}%</p>
                </div>
              )}

              {/* Quick Returns Preview */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium">Projected Returns:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">₵1,000 →</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(calculateMaturityAmount(plan, 1000))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">₵5,000 →</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(calculateMaturityAmount(plan, 5000))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      Calculate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Interest Calculator - {plan.name}</DialogTitle>
                      <DialogDescription>
                        Calculate your potential returns with this savings plan
                      </DialogDescription>
                    </DialogHeader>
                    <InterestCalculator plan={plan} />
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link href={`/agent/savings/commit?planId=${plan.id}`}>
                    Select Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <PiggyBank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Plans Available</h3>
              <p className="text-gray-500">Check back later for new savings plans.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InterestCalculator({ plan }: { plan: SavingsPlan }) {
  const [amount, setAmount] = useState(Math.max(1000, plan.minimum_amount))

  const formatCurrency = (amount: number) => `₵${amount.toFixed(2)}`

  const calculateReturns = () => {
    const monthlyRate = plan.interest_rate / 100 / 12
    const maturityAmount = amount * Math.pow(1 + monthlyRate, plan.duration_months)
    const interest = maturityAmount - amount
    return { maturityAmount, interest }
  }

  const { maturityAmount, interest } = calculateReturns()

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Investment Amount</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(plan.minimum_amount, Number(e.target.value)))}
              min={plan.minimum_amount}
              max={plan.maximum_amount || undefined}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">₵</span>
          </div>
        </div>

        <div>
          <Label>Amount Slider</Label>
          <Slider
            value={[amount]}
            onValueChange={(value) => setAmount(value[0])}
            min={plan.minimum_amount}
            max={plan.maximum_amount || 50000}
            step={100}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatCurrency(plan.minimum_amount)}</span>
            <span>{formatCurrency(plan.maximum_amount || 50000)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
        <h4 className="font-semibold text-blue-900">Projection Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700">Principal Amount</p>
            <p className="font-bold text-blue-900">{formatCurrency(amount)}</p>
          </div>
          <div>
            <p className="text-blue-700">Interest Rate</p>
            <p className="font-bold text-blue-900">{plan.interest_rate}% p.a.</p>
          </div>
          <div>
            <p className="text-blue-700">Duration</p>
            <p className="font-bold text-blue-900">{plan.duration_months} months</p>
          </div>
          <div>
            <p className="text-blue-700">Interest Earned</p>
            <p className="font-bold text-green-600">{formatCurrency(interest)}</p>
          </div>
        </div>
        <div className="border-t border-blue-200 pt-3">
          <p className="text-blue-700">Maturity Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(maturityAmount)}</p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>* Calculations are based on compound interest and are for illustration purposes only.</p>
        <p>* Actual returns may vary based on market conditions and plan terms.</p>
      </div>
    </div>
  )
}
