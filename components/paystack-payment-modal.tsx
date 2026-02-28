"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PaystackPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentCompleted: (paymentData: PaymentCompletedData) => void
  orderSummary: {
    service: string
    amount: number
    serviceCharge?: number
    total: number
  }
  paymentReference?: string
  customerPhone: string
  customerName?: string
}

export interface PaymentCompletedData {
  paymentMethod: "manual" | "paystack"
  reference: string
  amount: number
  service: string
  timestamp: string
}

export function PaystackPaymentModal({
  isOpen,
  onClose,
  onPaymentCompleted,
  orderSummary,
  paymentReference,
  customerPhone,
  customerName,
}: PaystackPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "paystack">("manual")
  const [copied, setCopied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentName = "Adamantis Solutions (Francis Ani-Johnson .K)"
  const paymentLine = "0557943392"

  const copy = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast.success("Copied to clipboard!")
  }

  const handlePaystackPayment = async () => {
    try {
      setIsProcessing(true)

      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `user_${customerPhone}@dataflexghana.com`,
          amount: Math.round(orderSummary.total * 100),
          phone: customerPhone,
          reference: paymentReference,
          service: orderSummary.service,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to initialize payment")
      }

      const data = await response.json()

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        throw new Error("No authorization URL received from Paystack")
      }
    } catch (error) {
      console.error("Paystack initialization error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to initialize Paystack payment")
      setIsProcessing(false)
    }
  }

  const handleManualPaymentComplete = () => {
    onPaymentCompleted({
      paymentMethod: "manual",
      reference: paymentReference || "",
      amount: orderSummary.total,
      service: orderSummary.service,
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[400px] rounded-lg p-4 sm:p-6 gap-3 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-1 px-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-lg sm:text-xl">Payment Method</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Choose how you'd like to pay
          </DialogDescription>
        </DialogHeader>

        {/* Order Summary */}
        <div className="rounded-lg border bg-gray-50 p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service:</span>
            <span className="font-medium text-gray-900">{orderSummary.service}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium text-gray-900">₵{orderSummary.amount.toFixed(2)}</span>
          </div>
          {orderSummary.serviceCharge !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Charge:</span>
              <span className="font-medium text-gray-900">₵{orderSummary.serviceCharge.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t pt-2 mt-1 border-gray-200">
            <span className="text-gray-700">Total:</span>
            <span className="text-green-700">₵{orderSummary.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-2">
          {/* Paystack Option */}
          <button
            onClick={() => setPaymentMethod("paystack")}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
              paymentMethod === "paystack"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === "paystack" ? "border-blue-600 bg-blue-600" : "border-gray-300"
                }`}
              >
                {paymentMethod === "paystack" && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">Paystack</p>
                <p className="text-xs text-gray-500">Secure online payment</p>
              </div>
            </div>
          </button>

          {/* Manual Payment Option */}
          <button
            onClick={() => setPaymentMethod("manual")}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
              paymentMethod === "manual"
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === "manual" ? "border-green-600 bg-green-600" : "border-gray-300"
                }`}
              >
                {paymentMethod === "manual" && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">Manual Payment</p>
                <p className="text-xs text-gray-500">Pay with reference code</p>
              </div>
            </div>
          </button>
        </div>

        {/* Manual Payment Details */}
        {paymentMethod === "manual" && (
          <div className="space-y-3">
            {/* Reference */}
            {paymentReference && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs text-gray-600 mb-1">Your Reference Code</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-base break-all">{paymentReference}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copy(paymentReference)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-xs text-gray-600">Account Name:</span>
                <span className="font-medium text-sm break-words">Adamantis Solutions</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-xs text-gray-600">Mobile Money:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{paymentLine}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copy(paymentLine)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p className="text-xs text-orange-800">
                After payment, click "I've Completed Payment" to process your order. You'll receive a WhatsApp confirmation.
              </p>
            </div>
          </div>
        )}

        {/* Paystack Info */}
        {paymentMethod === "paystack" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              You'll be redirected to Paystack's secure payment page to complete your transaction.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {paymentMethod === "paystack" ? (
            <Button
              onClick={handlePaystackPayment}
              disabled={isProcessing}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with Paystack
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleManualPaymentComplete}
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              I've Completed Payment
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-11 bg-transparent hover:bg-gray-50 text-sm"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}