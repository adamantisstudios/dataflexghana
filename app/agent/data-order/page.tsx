"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  supabase,
  generatePaymentReference,
  calculateDataBundleCommission,
  type Agent,
  type DataBundle,
} from "@/lib/supabase"
import { getCurrentAgent } from "@/lib/auth"
import {
  ArrowLeft,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Phone,
  Wallet,
  CreditCard,
  ArrowDown,
  ShoppingCart,
  X,
  Clock,
} from "lucide-react"

export default function DataOrderPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [dataBundles, setDataBundles] = useState<DataBundle[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null)
  const [recipientPhone, setRecipientPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "wallet">("manual")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [generatedReference, setGeneratedReference] = useState("")
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successNotificationData, setSuccessNotificationData] = useState<{
    bundleName: string
    recipientPhone: string
    amount: number
    paymentMethod: string
    reference?: string
    deliveryTime: string
  } | null>(null)
  const [showTCModal, setShowTCModal] = useState(false)
  const [showDataOrderNotice, setShowDataOrderNotice] = useState(false)
  const [noticeTimerStarted, setNoticeTimerStarted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Ref for payment section
  const paymentSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentAgent = getCurrentAgent()
    if (!currentAgent) {
      router.push("/agent/login")
      return
    }
    setAgent(currentAgent)
    loadData(currentAgent.id)

    // Set up real-time wallet balance updates
    setupWalletBalanceListener(currentAgent.id)
  }, [router])

  useEffect(() => {
    if (!noticeTimerStarted) {
      const timer = setTimeout(() => {
        setShowDataOrderNotice(true)
        setNoticeTimerStarted(true)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [noticeTimerStarted])

  // Handle pre-selected bundle from URL parameter
  useEffect(() => {
    const bundleId = searchParams.get("bundle")
    if (bundleId && dataBundles.length > 0) {
      const bundle = dataBundles.find((b) => b.id === bundleId)
      if (bundle) {
        setSelectedBundle(bundle)
        // Auto-scroll to payment section after a short delay
        setTimeout(() => {
          if (paymentSectionRef.current) {
            paymentSectionRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
            // Add a subtle highlight effect
            paymentSectionRef.current.classList.add("animate-pulse")
            setTimeout(() => {
              paymentSectionRef.current?.classList.remove("animate-pulse")
            }, 2000)
          }
        }, 500)
      }
    }
  }, [searchParams, dataBundles])

  const setupWalletBalanceListener = (agentId: string) => {
    // Listen for changes to the agent's wallet balance
    const channel = supabase
      .channel("wallet-balance-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agents",
          filter: `id=eq.${agentId}`,
        },
        (payload) => {
          console.log("Wallet balance updated:", payload)
          if (payload.new && payload.new.wallet_balance !== undefined) {
            setWalletBalance(payload.new.wallet_balance)
          }
        },
      )
      .subscribe()

    // Listen for wallet transactions that might affect balance
    const transactionChannel = supabase
      .channel("wallet-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallet_transactions",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          console.log("Wallet transaction updated:", payload)
          // Refresh wallet balance when transactions are updated
          refreshWalletBalance(agentId)
        },
      )
      .subscribe()

    // Cleanup function
    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(transactionChannel)
    }
  }

  const refreshWalletBalance = async (agentId: string) => {
    try {
      // CRITICAL FIX: Use the corrected wallet balance calculation
      // This ensures only approved transactions are included, excluding pending top-ups
      const { calculateWalletBalance } = await import("@/lib/earnings-calculator")
      const approvedWalletBalance = await calculateWalletBalance(agentId)

      console.log("🔄 Refreshed approved wallet balance:", approvedWalletBalance)
      setWalletBalance(approvedWalletBalance)
    } catch (error) {
      console.error("Error refreshing wallet balance:", error)
    }
  }

  const loadData = async (agentId: string) => {
    try {
      setLoading(true)

      // Load data bundles
      const { data: bundlesData, error: bundlesError } = await supabase
        .from("data_bundles")
        .select("*")
        .eq("is_active", true)
        .order("provider", { ascending: true })
        .order("size_gb", { ascending: true })

      if (bundlesError) throw bundlesError

      // CRITICAL FIX: Load agent's wallet balance using the corrected calculation
      // Import the fixed wallet balance calculator
      const { calculateWalletBalance } = await import("@/lib/earnings-calculator")

      // Get the correct approved wallet balance (excluding pending transactions)
      const approvedWalletBalance = await calculateWalletBalance(agentId)
      console.log("✅ Data-order page using approved wallet balance:", approvedWalletBalance)

      setDataBundles(bundlesData || [])
      setWalletBalance(approvedWalletBalance) // Use corrected balance
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load data bundles")
    } finally {
      setLoading(false)
    }
  }

  const handleBundleSelect = (bundleId: string) => {
    const bundle = dataBundles.find((b) => b.id === bundleId)
    setSelectedBundle(bundle || null)
    setError("")

    // Smooth scroll to payment section with a slight delay
    setTimeout(() => {
      if (paymentSectionRef.current) {
        paymentSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })

        // Add a subtle highlight effect
        paymentSectionRef.current.classList.add("animate-pulse")
        setTimeout(() => {
          paymentSectionRef.current?.classList.remove("animate-pulse")
        }, 2000)
      }
    }, 100)
  }

  const validateOrder = () => {
    if (!selectedBundle) {
      setError("Please select a data bundle")
      return false
    }

    if (!recipientPhone.trim()) {
      setError("Please enter recipient phone number")
      return false
    }

    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(recipientPhone.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit phone number")
      return false
    }

    if (paymentMethod === "wallet" && walletBalance < selectedBundle.price) {
      setError(
        `Insufficient wallet balance. You need GH₵ ${selectedBundle.price.toFixed(2)} but have GH₵ ${walletBalance.toFixed(2)}`,
      )
      return false
    }

    return true
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent || !selectedBundle) return

    if (!validateOrder()) return

    setError("")
    setSuccess("")

    const cleanPhoneNumber = recipientPhone.replace(/\D/g, "").slice(0, 10)

    if (cleanPhoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    const commission = calculateDataBundleCommission(selectedBundle.price, selectedBundle.commission_rate)
    const reference = generatePaymentReference()

    const orderData = {
      agent_id: agent.id,
      bundle_id: selectedBundle.id,
      recipient_phone: cleanPhoneNumber,
      payment_reference: reference,
      commission_amount: commission,
      payment_method: paymentMethod,
      status: paymentMethod === "wallet" ? "processing" : "pending",
    }

    setOrderDetails(orderData)
    setGeneratedReference(reference)
    setShowConfirmDialog(true)
  }

  const confirmOrder = async () => {
    if (!orderDetails || !agent || !selectedBundle) return

    setSubmitting(true)
    try {
      // CRITICAL FIX: If paying with wallet, use APPROVED balance calculation
      if (paymentMethod === "wallet") {
        // CRITICAL FIX: Check APPROVED wallet balance, not database column
        const { calculateWalletBalance } = await import("@/lib/earnings-calculator")
        const approvedWalletBalance = await calculateWalletBalance(agent.id)

        console.log("🔍 Checking approved wallet balance for order:", approvedWalletBalance)

        if (approvedWalletBalance < selectedBundle.price) {
          throw new Error(
            "Insufficient approved wallet balance. Please ensure your wallet top-up has been approved by admin.",
          )
        }

        // Calculate new balance after deduction
        const newBalance = approvedWalletBalance - selectedBundle.price

        // CRITICAL FIX: Create wallet deduction transaction instead of direct balance update
        // This maintains proper transaction history and approval workflow
        const { data: deductionTransaction, error: deductionError } = await supabase
          .from("wallet_transactions")
          .insert({
            agent_id: agent.id,
            transaction_type: "deduction",
            amount: selectedBundle.price,
            description: `Data bundle purchase: ${selectedBundle.name} for ${orderDetails.recipient_phone}`,
            reference_code: generatedReference,
            status: "approved", // Immediate approval for purchases
            source_type: "data_order",
            source_id: null, // Will be updated after order creation
          })
          .select()
          .single()

        if (deductionError) {
          console.error("Error creating wallet deduction transaction:", deductionError)
          throw new Error("Failed to process wallet payment. Please try again.")
        }

        console.log("✅ Wallet deduction transaction created:", deductionTransaction.id)

        // Update local wallet balance state
        setWalletBalance(newBalance)
      }

      // Create the data order
      const { error: orderError } = await supabase.from("data_orders").insert([orderDetails])

      if (orderError) throw orderError

      // CRITICAL FIX: Show clean success notification instead of generic success message
      const deliveryTime = "10-45 minutes"
      setSuccessNotificationData({
        bundleName: selectedBundle.name,
        recipientPhone: orderDetails.recipient_phone,
        amount: selectedBundle.price,
        paymentMethod: paymentMethod === "wallet" ? "Wallet Balance" : "Manual Payment",
        reference: paymentMethod === "manual" ? generatedReference : undefined,
        deliveryTime,
      })
      setShowSuccessNotification(true)

      // Clear the old success message
      setSuccess("")

      // Reset form
      setSelectedBundle(null)
      setRecipientPhone("")
      setPaymentMethod("manual")
      setShowConfirmDialog(false)

      // Auto-dismiss notification after 8 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)
        setSuccessNotificationData(null)
      }, 8000)
    } catch (error: any) {
      console.error("Error placing order:", error)
      setError(error.message || "Failed to place order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefreshBalance = async () => {
    if (!agent) return
    setRefreshing(true)
    await refreshWalletBalance(agent.id)
    setRefreshing(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleReadTCs = () => {
    setShowDataOrderNotice(false)
    // Small delay to ensure notice is closed before opening T&Cs
    setTimeout(() => {
      setShowTCModal(true)
    }, 100)
  }

  const groupedBundles = dataBundles.reduce(
    (acc, bundle) => {
      if (!acc[bundle.provider]) {
        acc[bundle.provider] = []
      }
      acc[bundle.provider].push(bundle)
      return acc
    },
    {} as Record<string, DataBundle[]>,
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data bundles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header - Mobile Responsive */}
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link href="/agent/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent w-fit"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Order Data Bundle</h1>
                <p className="text-sm sm:text-base text-gray-600">Purchase data bundles for your clients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Width Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Bundle Selection with Network Tabs */}
          <Card className="border-emerald-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Select Data Bundle
              </CardTitle>
              <CardDescription className="text-emerald-600">
                Choose from available data bundles by network
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="MTN" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl gap-1 h-auto">
                  {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                    const bundleCount = dataBundles.filter((bundle) => bundle.provider === provider).length
                    return (
                      <TabsTrigger
                        key={provider}
                        value={provider}
                        className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-2 sm:p-3 flex items-center justify-center gap-2 h-auto"
                      >
                        <img
                          src={
                            provider === "MTN"
                              ? "/images/mtn.jpg"
                              : provider === "AirtelTigo"
                                ? "/images/airteltigo.jpg"
                                : "/images/telecel.jpg"
                          }
                          alt={`${provider} logo`}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex flex-col items-center">
                          <span className="hidden sm:inline">{provider}</span>
                          <span className="sm:hidden text-xs">{provider.slice(0, 3)}</span>
                          <span className="text-xs opacity-75">({bundleCount})</span>
                        </div>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                  const providerBundles = dataBundles.filter((bundle) => bundle.provider === provider)
                  return (
                    <TabsContent key={provider} value={provider} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-semibold text-emerald-700 flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden shadow-md border-2 border-emerald-200">
                            <img
                              src={
                                provider === "MTN"
                                  ? "/images/mtn.jpg"
                                  : provider === "AirtelTigo"
                                    ? "/images/airteltigo.jpg"
                                    : "/images/telecel.jpg"
                              }
                              alt={`${provider} logo`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="hidden sm:inline">{provider} Data Bundles</span>
                          <span className="sm:hidden">{provider}</span>
                        </h3>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {providerBundles.length} bundles
                        </Badge>
                      </div>

                      {providerBundles.length === 0 ? (
                        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                          <CardContent className="pt-6 text-center">
                            <div className="text-gray-500 mb-4">
                              <Smartphone className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-2 opacity-50" />
                              <p>No data bundles available for {provider}</p>
                              <p className="text-sm">Please check back later</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {providerBundles.map((bundle) => (
                            <div
                              key={bundle.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 ${
                                selectedBundle?.id === bundle.id
                                  ? "border-emerald-500 bg-emerald-50 shadow-md transform scale-[1.02]"
                                  : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm"
                              }`}
                              onClick={() => handleBundleSelect(bundle.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{bundle.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {bundle.size_gb}GB • {bundle.validity_months} months
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-emerald-600">GH₵ {bundle.price.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">
                                    Commission: GH₵{" "}
                                    {calculateDataBundleCommission(bundle.price, bundle.commission_rate).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              {selectedBundle?.id === bundle.id && (
                                <div className="mt-3 flex items-center justify-center text-emerald-600">
                                  <ArrowDown className="h-4 w-4 animate-bounce" />
                                  <span className="text-sm ml-2">Scroll down to complete your order</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>

          {/* Order Form - Full Width Mobile Responsive */}
          <Card
            ref={paymentSectionRef}
            className={`border-emerald-100 shadow-lg transition-all duration-500 ${
              selectedBundle ? "ring-2 ring-emerald-200 ring-opacity-50" : ""
            }`}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Details
              </CardTitle>
              <CardDescription className="text-emerald-600">Enter recipient details and payment method</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="recipientPhone" className="text-gray-700 font-medium">
                    Recipient Phone Number *
                  </Label>
                  <Input
                    id="recipientPhone"
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10)
                      setRecipientPhone(cleaned)
                    }}
                    placeholder="e.g., 0241234567"
                    maxLength={10}
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a valid 10-digit Ghana phone number</p>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-3 block">Payment Method *</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: "manual" | "wallet") => setPaymentMethod(value)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="manual" id="manual" />
                        <div className="flex items-center gap-2 flex-1">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                          <Label htmlFor="manual" className="font-medium cursor-pointer">
                            Manual Payment
                          </Label>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Pay Before Order
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="wallet" id="wallet" />
                        <div className="flex items-center gap-2 flex-1">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                          <Label htmlFor="wallet" className="font-medium cursor-pointer">
                            Pay with Wallet
                          </Label>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${walletBalance >= (selectedBundle?.price || 0) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          GH₵ {walletBalance.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "wallet" && selectedBundle && walletBalance < selectedBundle.price && (
                    <Alert className="mt-3 border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        Insufficient wallet balance. You need GH₵ {selectedBundle.price.toFixed(2)} but have GH₵{" "}
                        {walletBalance.toFixed(2)}.{" "}
                        <Link href="/agent/wallet" className="underline font-medium">
                          Top up your wallet
                        </Link>{" "}
                        or choose manual payment.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {selectedBundle && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 animate-in slide-in-from-top duration-300">
                    <h4 className="font-semibold text-emerald-800 mb-2">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Bundle:</span>
                        <span className="font-medium text-emerald-900">{selectedBundle.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Size:</span>
                        <span className="font-medium text-emerald-900">{selectedBundle.size_gb}GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Price:</span>
                        <span className="font-bold text-emerald-900">GH₵ {selectedBundle.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Your Commission:</span>
                        <span className="font-bold text-green-600">
                          GH₵{" "}
                          {calculateDataBundleCommission(selectedBundle.price, selectedBundle.commission_rate).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-emerald-200">
                        <span className="text-emerald-700">Payment Method:</span>
                        <span className="font-medium text-emerald-900 capitalize">
                          {paymentMethod === "wallet" ? "Wallet Balance" : "Manual Payment"}
                        </span>
                      </div>
                      {paymentMethod === "wallet" && (
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Remaining Balance:</span>
                          <span className="font-medium text-emerald-900">
                            GH₵ {Math.max(0, walletBalance - selectedBundle.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    !selectedBundle ||
                    !recipientPhone.trim() ||
                    (paymentMethod === "wallet" && walletBalance < (selectedBundle?.price || 0))
                  }
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg py-3 text-lg font-semibold transition-all duration-300 hover:scale-[1.02]"
                >
                  <Smartphone className="h-5 w-5 mr-2" />
                  Place Order
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Mobile Responsive */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/agent/data-orders">
            <Button
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent w-full sm:w-auto"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              View All Orders
            </Button>
          </Link>
          <Link href="/agent/wallet">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent w-full sm:w-auto"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Manage Wallet
            </Button>
          </Link>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-emerald-800">Confirm Your Order</AlertDialogTitle>
              <AlertDialogDescription>Please review your order details before confirming.</AlertDialogDescription>
            </AlertDialogHeader>
            {selectedBundle && (
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Bundle:</span>
                      <span className="font-medium text-emerald-900">{selectedBundle.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Recipient:</span>
                      <span className="font-medium text-emerald-900">{recipientPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Amount:</span>
                      <span className="font-bold text-emerald-900">GH₵ {selectedBundle.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Payment:</span>
                      <span className="font-medium text-emerald-900">
                        {paymentMethod === "wallet" ? "Wallet Balance" : "Manual Payment"}
                      </span>
                    </div>
                    {paymentMethod === "wallet" && (
                      <div className="flex justify-between">
                        <span className="text-emerald-700">New Balance:</span>
                        <span className="font-medium text-emerald-900">
                          GH₵ {Math.max(0, walletBalance - selectedBundle.price).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {paymentMethod === "manual" && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Payment Instructions:</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Send GH₵ {selectedBundle.price.toFixed(2)} to <strong>0557943392</strong> (Adamantis Solutions).
                        Pay Before Order
                      </p>
                      <p className="text-sm text-blue-700">
                        Reference: <strong>{generatedReference}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "wallet" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      GH₵ {selectedBundle.price.toFixed(2)} will be deducted from your wallet balance immediately.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmOrder}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CRITICAL FIX: Clean Success Notification - Made Shorter & Mobile Responsive */}
        {showSuccessNotification && successNotificationData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Header - Simplified */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 text-white relative">
                <button
                  onClick={() => {
                    setShowSuccessNotification(false)
                    setSuccessNotificationData(null)
                  }}
                  className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                  <div>
                    <h3 className="text-lg font-bold">Order Placed!</h3>
                    <p className="text-emerald-100 text-xs">Data bundle ordered successfully</p>
                  </div>
                </div>
              </div>

              {/* Content - Simplified */}
              <div className="p-4 space-y-3">
                {/* Essential Order Details Only */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bundle:</span>
                    <span className="font-semibold text-gray-900 text-right">{successNotificationData.bundleName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-semibold text-gray-900">{successNotificationData.recipientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-emerald-600">GH₵ {successNotificationData.amount.toFixed(2)}</span>
                  </div>
                  {successNotificationData.reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {successNotificationData.reference}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delivery Info - Shortened */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Delivery</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Data will be delivered within <strong>{successNotificationData.deliveryTime}</strong>.
                  </p>
                </div>

                {/* Payment Instructions - Simplified */}
                {successNotificationData.reference && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Payment Required</span>
                    </div>
                    <p className="text-amber-700 text-sm mb-2">
                      Send <strong>GH₵ {successNotificationData.amount.toFixed(2)}</strong> to{" "}
                      <strong>0557943392</strong>
                    </p>
                    <div className="bg-white rounded border border-amber-300 p-2 text-center">
                      <span className="font-mono text-sm text-amber-900 font-bold">
                        {successNotificationData.reference}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      setShowSuccessNotification(false)
                      setSuccessNotificationData(null)
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2"
                  >
                    Got it!
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSuccessNotification(false)
                      setSuccessNotificationData(null)
                      router.push("/agent/data-orders")
                    }}
                    className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm py-2"
                  >
                    View Orders
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDataOrderNotice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5" />
                  <h2 className="text-lg font-bold">Important Notice</h2>
                </div>
                <button
                  onClick={() => setShowDataOrderNotice(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>You do not need to alert us</strong> when placing manual or wallet data orders. Your order
                    will be processed automatically and delivered to the recipient within 10 minutes-24 Hours.
                  </p>
                </div>
                <p className="text-xs text-gray-600">
                  Simply select your data bundle, enter the recipient's phone number, choose your payment method, and
                  confirm. That's it!
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t flex gap-2">
                <Button
                  onClick={() => setShowDataOrderNotice(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Got it
                </Button>
                <Button onClick={handleReadTCs} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  Read T&Cs
                </Button>
              </div>
            </div>
          </div>
        )}

        {showTCModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4 text-white flex items-center justify-between">
                <h2 className="text-lg font-bold">Terms & Conditions</h2>
                <button
                  onClick={() => setShowTCModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-gray-700">
                <p>
                  <strong>Platform Terms & Conditions Summary:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Data delivery takes 10 minutes to 24 hours depending on network conditions</li>
                  <li>No refunds - double-check all phone numbers and amounts before submitting</li>
                  <li>Bundles are valid for 90 days and roll over with the next purchase</li>
                  <li>Platform operates 24/7 including weekends</li>
                  <li>
                    <strong>Sunday data sales and processing is slow but not fast - please exercise patience</strong>
                  </li>
                  <li>Prices are market-driven and may change without notice</li>
                  <li>You must not advertise the platform publicly or use it for mass marketing</li>
                  <li>Maintain professional conduct in all client interactions</li>
                  <li>Report any technical issues or suspicious activities immediately</li>
                </ul>
                <p className="pt-4 border-t">
                  For the complete Terms & Conditions, visit our{" "}
                  <Link href="/terms" className="text-emerald-600 underline hover:text-emerald-700">
                    full Terms & Conditions page
                  </Link>
                </p>
              </div>
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-2">
                <Button
                  onClick={() => setShowTCModal(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  I Understand
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
