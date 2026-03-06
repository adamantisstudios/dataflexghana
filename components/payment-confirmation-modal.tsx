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
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto p-3 sm:p-6 gap-3 sm:gap-4">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-lg">Confirm Payment</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Choose your payment method</DialogDescription>
        </DialogHeader>

        {/* Order Summary - Compact */}
        <div className="rounded-lg border p-3 space-y-1 text-xs sm:text-sm bg-gray-50">
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className="font-medium">{orderSummary.service}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span>₵{orderSummary.amount.toFixed(2)}</span>
          </div>
          {orderSummary.serviceCharge !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Charge:</span>
              <span>₵{orderSummary.serviceCharge.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-1 border-gray-200">
            <span>Total:</span>
            <span className="text-green-600">₵{orderSummary.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Reference - Compact */}
        {paymentReference && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-center space-y-1">
            <p className="text-xs text-green-700 font-semibold">Reference Code</p>
            <div className="flex items-center justify-center gap-1">
              <span className="font-mono text-sm font-bold">{paymentReference}</span>
              <Button size="sm" variant="ghost" onClick={() => copy(paymentReference)} className="h-6 w-6 p-0">
                {copied ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}

        {/* Payment Details - Compact */}
        <div className="rounded-lg border p-2 space-y-1 text-xs">
          <div className="flex justify-between items-center gap-1">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium text-right line-clamp-1">{paymentName}</span>
          </div>
          <div className="flex justify-between items-center gap-1">
            <span className="text-gray-600">Line:</span>
            <div className="flex items-center gap-1">
              <span className="font-bold">{paymentLine}</span>
              <Button size="sm" variant="ghost" onClick={() => copy(paymentLine)} className="h-6 w-6 p-0">
                {copied ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions - Compact */}
        <div className="space-y-2 pt-2">
          <Button onClick={onConfirmPayment} className="w-full h-10 text-sm">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Payment Completed
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full bg-transparent h-10 text-sm">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
