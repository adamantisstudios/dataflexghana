"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, CreditCard } from "lucide-react"

interface PaymentConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPayment: () => void
  orderSummary: {
    service: string
    amount: number
    serviceCharge?: number
    total: number
  }
  paymentReference?: string
}

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirmPayment,
  orderSummary,
  paymentReference,
}: PaymentConfirmationModalProps) {
  const [copied, setCopied] = useState(false)

  const paymentName = "Adamantis Solutions (Francis Ani-Johnson .K)"
  const paymentLine = "0557943392"

  const copy = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CreditCard className="h-7 w-7 text-green-600" />
          </div>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>Complete payment to continue</DialogDescription>
        </DialogHeader>

        {/* Order Summary */}
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Service</span>
            <span className="font-medium">{orderSummary.service}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount</span>
            <span>₵{orderSummary.amount.toFixed(2)}</span>
          </div>
          {orderSummary.serviceCharge !== undefined && (
            <div className="flex justify-between">
              <span>Service Charge</span>
              <span>₵{orderSummary.serviceCharge.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>₵{orderSummary.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Processing Time Notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <p className="text-blue-800">
            <strong>⏱️ Processing Time:</strong> Data bundles are typically processed and delivered within 10-30 minutes
            after payment confirmation.
          </p>
        </div>

        {/* Reference */}
        {paymentReference && (
          <div className="rounded-lg border p-3 text-center space-y-2">
            <p className="text-xs text-muted-foreground">Payment Reference</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-xl font-bold">{paymentReference}</span>
              <Button size="icon" variant="ghost" onClick={() => copy(paymentReference)}>
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="rounded-lg border p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Payment Name</span>
            <span className="font-medium text-right">{paymentName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Payment Line</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{paymentLine}</span>
              <Button size="icon" variant="ghost" onClick={() => copy(paymentLine)}>
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={onConfirmPayment} className="w-full h-12">
            <CheckCircle className="mr-2 h-5 w-5" />
            I’ve Completed Payment
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
