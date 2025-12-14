"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, CheckCircle, Copy } from "lucide-react"
import { useState } from "react"

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
}

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirmPayment,
  orderSummary,
}: PaymentConfirmationModalProps) {
  const [copied, setCopied] = useState(false)

  const paymentDetails = {
    name: "Adamantis Solutions (Francis Ani-Johnson .K)",
    number: "0557943392",
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-2xl text-center">Payment Required</DialogTitle>
          <DialogDescription className="text-center">
            Please complete payment before submitting your order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-blue-900 mb-2">Order Summary</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-700">Service:</span>
                  <span className="font-medium text-blue-900">{orderSummary.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Amount:</span>
                  <span className="font-medium text-blue-900">₵{orderSummary.amount.toFixed(2)}</span>
                </div>
                {orderSummary.serviceCharge !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Service Charge:</span>
                    <span className="font-medium text-blue-900">₵{orderSummary.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-blue-900 border-t border-blue-300 pt-2 mt-2">
                  <span>Total:</span>
                  <span className="text-lg">₵{orderSummary.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-green-900 mb-2">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-green-700">Payment Name:</span>
                  <span className="font-medium text-green-900 text-right">{paymentDetails.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Payment Line:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-900 text-lg">{paymentDetails.number}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(paymentDetails.number)}
                      className="h-7 px-2"
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
                <p className="text-xs text-green-800">
                  <strong>Instructions:</strong>
                  <br />
                  1. Send ₵{orderSummary.total.toFixed(2)} to the payment line above
                  <br />
                  2. Click "Completed Payment" below
                  <br />
                  3. Your order will be sent to WhatsApp for processing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={onConfirmPayment}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
              size="lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Completed Payment
            </Button>
            <Button onClick={onClose} variant="outline" className="w-full bg-transparent" size="lg">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
