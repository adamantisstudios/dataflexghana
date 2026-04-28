"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, DollarSign, TrendingUp, Shield, Clock, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { calculateWalletBalance } from "@/lib/earnings-calculator"

interface SavingsPlan {
  id: string
  name: string
  description: string
  interest_rate: number
  minimum_amount: number
  maximum_amount: number | null
  duration_months: number
  early_withdrawal_penalty: number
  formattedDuration: string
}

interface SavingsCommitmentFormProps {
  plan: SavingsPlan
  amount: number
  agentId: string
  walletBalance: number
  onBack: () => void
}

export default function SavingsCommitmentForm({
  plan,
  amount,
  agentId,
  walletBalance,
  onBack,
}: SavingsCommitmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    confirmAmount: "",
    agreeToTerms: false,
    agreeToAutoRenewal: false,
    confirmWalletDeduction: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentWalletBalance, setCurrentWalletBalance] = useState(walletBalance)

  const router = useRouter()

  const formatCurrency = (amount: number) => `₵${amount.toFixed(2)}`

  const calculateProjections = () => {
    const monthlyRate = plan.interest_rate / 100 / 12
    const maturityAmount = amount * Math.pow(1 + monthlyRate, plan.duration_months)
    const interest = maturityAmount - amount
    const maturityDate = new Date()
    maturityDate.setMonth(maturityDate.getMonth() + plan.duration_months)

    return { maturityAmount, interest, maturityDate }
  }

  const { maturityAmount, interest, maturityDate } = calculateProjections()

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.confirmAmount) {
      newErrors.confirmAmount = "Please confirm the amount"
    } else if (Number.parseFloat(formData.confirmAmount) !== amount) {
      newErrors.confirmAmount = "Amount must match your selection"
    }

    if (amount > currentWalletBalance) {
      newErrors.confirmAmount = `Insufficient wallet balance. Available: ${formatCurrency(currentWalletBalance)}, Required: ${formatCurrency(amount)}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions"
    }

    if (!formData.confirmWalletDeduction) {
      newErrors.confirmWalletDeduction = "You must confirm the wallet deduction"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    setLoading(true)
    try {
      // Verify wallet balance one more time before submitting (prevent race conditions)
      const latestBalance = await calculateWalletBalance(agentId)
      setCurrentWalletBalance(latestBalance)

      if (latestBalance < amount) {
        throw new Error(
          `Your wallet balance has changed. Available: ${formatCurrency(latestBalance)}, Required: ${formatCurrency(amount)}. Please refresh and try again.`,
        )
      }

      const response = await fetch("/api/agent/savings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          savingsPlanId: plan.id,
          amount,
          autoRenewal: formData.agreeToAutoRenewal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create savings account")
      }

      toast({
        title: "Savings Account Created!",
        description: `Your ${plan.name} savings account has been created successfully. Your wallet balance has been updated.`,
      })

      setTimeout(() => {
        window.location.href = "/agent/savings"
      }, 1500)
    } catch (error) {
      console.error("[v0] Savings commit error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {step} of 2</span>
          <span>{step === 1 ? "Confirm Details" : "Terms & Commitment"}</span>
        </div>
        <Progress value={step * 50} className="h-2" />
      </div>

      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Plans
      </Button>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-green-600" />
              Confirm Your Investment
            </CardTitle>
            <CardDescription>Review and confirm your savings plan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">{plan.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Interest Rate</p>
                  <p className="font-semibold">{plan.interest_rate}% per annum</p>
                </div>
                <div>
                  <p className="text-blue-700">Duration</p>
                  <p className="font-semibold">{plan.formattedDuration}</p>
                </div>
                <div>
                  <p className="text-blue-700">Maturity Date</p>
                  <p className="font-semibold">
                    {maturityDate.toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Early Withdrawal Penalty</p>
                  <p className="font-semibold">{plan.early_withdrawal_penalty}%</p>
                </div>
              </div>
            </div>

            {/* Amount Confirmation */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="confirm-amount">Confirm Investment Amount</Label>
                <Input
                  id="confirm-amount"
                  type="number"
                  value={formData.confirmAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmAmount: e.target.value }))}
                  placeholder={`Enter ${formatCurrency(amount)}`}
                  className={errors.confirmAmount ? "border-red-500" : ""}
                />
                {errors.confirmAmount && <p className="text-sm text-red-600 mt-1">{errors.confirmAmount}</p>}
                <p className="text-sm text-muted-foreground mt-1">
                  Current wallet balance:{" "}
                  <span className="font-semibold text-blue-600">{formatCurrency(currentWalletBalance)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  After commitment:{" "}
                  <span className="font-semibold text-green-600">
                    {formatCurrency(Math.max(0, currentWalletBalance - amount))}
                  </span>
                </p>
              </div>

              {/* Investment Summary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">Investment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Principal Amount:</span>
                    <span className="font-semibold">{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Projected Interest:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(interest)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 flex justify-between">
                    <span className="text-green-700 font-medium">Expected Maturity Amount:</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(maturityAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleNext} className="w-full" disabled={!formData.confirmAmount}>
              Continue to Terms
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-600" />
              Terms & Commitment
            </CardTitle>
            <CardDescription>Please review and accept the terms for your savings account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Terms */}
            <div className="space-y-4">
              <h4 className="font-semibold">Key Terms & Conditions</h4>

              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Your funds will be locked for {plan.formattedDuration} and will earn {plan.interest_rate}% annual
                    interest.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Early withdrawal before maturity will incur a penalty of {plan.early_withdrawal_penalty}% of the
                    withdrawn amount.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Interest is calculated daily and compounded monthly. Your final amount may vary slightly from
                    projections.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p>
                    At maturity, you can withdraw your funds or renew for another term (if auto-renewal is enabled).
                  </p>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agree-terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeToTerms: checked as boolean }))}
                />
                <div className="space-y-1">
                  <Label htmlFor="agree-terms" className="text-sm font-medium">
                    I agree to the terms and conditions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    I understand the lock-in period, interest calculation, and penalty terms.
                  </p>
                </div>
              </div>
              {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="confirm-deduction"
                  checked={formData.confirmWalletDeduction}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, confirmWalletDeduction: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="confirm-deduction" className="text-sm font-medium">
                    Confirm wallet deduction of {formatCurrency(amount)}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Your wallet balance will change from {formatCurrency(currentWalletBalance)} to{" "}
                    {formatCurrency(Math.max(0, currentWalletBalance - amount))}.
                  </p>
                </div>
              </div>
              {errors.confirmWalletDeduction && <p className="text-sm text-red-600">{errors.confirmWalletDeduction}</p>}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="auto-renewal"
                  checked={formData.agreeToAutoRenewal}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, agreeToAutoRenewal: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="auto-renewal" className="text-sm font-medium">
                    Enable auto-renewal (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically renew this savings plan when it matures.
                  </p>
                </div>
              </div>
            </div>

            {/* Final Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Final Commitment Summary</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Plan:</strong> {plan.name}
                </p>
                <p>
                  <strong>Amount to Save:</strong> {formatCurrency(amount)}
                </p>
                <p>
                  <strong>Duration:</strong> {plan.formattedDuration}
                </p>
                <p>
                  <strong>Expected Return:</strong> {formatCurrency(interest)}
                </p>
                <p>
                  <strong>Maturity Date:</strong> {maturityDate.toLocaleDateString("en-GB")}
                </p>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p>
                    <strong>Current Wallet Balance:</strong>{" "}
                    <span className="text-blue-600">{formatCurrency(currentWalletBalance)}</span>
                  </p>
                  <p>
                    <strong>Remaining Balance After:</strong>{" "}
                    <span className="text-green-600">{formatCurrency(Math.max(0, currentWalletBalance - amount))}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.agreeToTerms || !formData.confirmWalletDeduction}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Savings Account"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
