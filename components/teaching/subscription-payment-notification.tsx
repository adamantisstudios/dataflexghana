"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Clock, Copy, DollarSign, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SubscriptionPaymentNotificationProps {
  channelName: string
  channelId: string
  monthlyFee: number
  currency: string
  paymentInstructions: string
  paymentContactName?: string
  paymentContactNumber?: string
  status: "pending" | "paid" | "verified"
  requestId: string
  onCopyPaymentInfo: () => void
}

export function SubscriptionPaymentNotification({
  channelName,
  channelId,
  monthlyFee,
  currency,
  paymentInstructions,
  paymentContactName,
  paymentContactNumber,
  status,
  requestId,
  onCopyPaymentInfo,
}: SubscriptionPaymentNotificationProps) {
  const [copied, setCopied] = useState(false)
  const [reportingPayment, setReportingPayment] = useState(false)

  const handleReportPayment = async () => {
    setReportingPayment(true)
    try {
      navigator.clipboard.writeText(
        `Payment Made for ${channelName}\n\nAmount: ${currency} ${monthlyFee.toFixed(2)}\n\nPayment Details:\n${paymentInstructions}\n\n${paymentContactName || ""}\n${paymentContactNumber || ""}`,
      )
      toast.success("Payment details copied! Contact the admin to report your payment.")
    } finally {
      setReportingPayment(false)
    }
  }

  return (
    <div className="space-y-4">
      <Alert className={status === "verified" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
        <AlertCircle className={status === "verified" ? "h-4 w-4 text-green-600" : "h-4 w-4 text-amber-600"} />
        <AlertDescription
          className={
            status === "verified" ? "text-green-800 text-sm font-medium" : "text-amber-800 text-sm font-medium"
          }
        >
          {status === "verified"
            ? "✓ Your payment has been verified! The admin will approve your subscription access soon."
            : "⚠ Payment Required: Complete the payment below to activate your subscription access."}
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monthly Subscription Payment
          </CardTitle>
          <p className="text-xs text-emerald-100 mt-1">Channel: {channelName}</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="bg-white rounded-lg p-4 border-2 border-emerald-300 shadow-sm">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Amount to Pay</p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold text-emerald-600">{monthlyFee.toFixed(2)}</p>
              <p className="text-xl text-gray-600 font-medium">{currency}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Recurring monthly • 30-day access from approval</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              How to Complete Payment
            </p>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 mb-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {paymentInstructions}
              </p>
            </div>

            {(paymentContactName || paymentContactNumber) && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-3">
                <p className="text-xs font-semibold text-blue-900 mb-2">Contact Channel Admin:</p>
                {paymentContactName && <p className="text-sm text-blue-800 font-medium">{paymentContactName}</p>}
                {paymentContactNumber && <p className="text-sm text-blue-700">📞 {paymentContactNumber}</p>}
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-9 mt-2 bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-700"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${paymentInstructions}\n\n${paymentContactName || ""}\n${paymentContactNumber || ""}`,
                )
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
                toast.success("Payment info copied to clipboard")
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              {copied ? "Copied!" : "Copy Payment Instructions"}
            </Button>
          </div>

          <div className="space-y-2 bg-gradient-to-b from-indigo-50 to-transparent rounded-lg p-3">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              Next Steps - What Happens:
            </p>
            <div className="space-y-3 text-xs ml-6 mt-2">
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex-shrink-0 text-xs">
                  1
                </div>
                <div className="pt-0.5">
                  <p className="font-medium text-gray-800">You make payment using above instructions</p>
                  <p className="text-gray-600">You will have proof of payment (transaction ID/receipt)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex-shrink-0 text-xs">
                  2
                </div>
                <div className="pt-0.5">
                  <p className="font-medium text-gray-800">Report your payment to admin</p>
                  <p className="text-gray-600">Click button below to contact admin with your transaction details</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold flex-shrink-0 text-xs">
                  3
                </div>
                <div className="pt-0.5">
                  <p className="font-medium text-gray-800">Admin verifies and approves</p>
                  <p className="text-gray-600">Your 30-day subscription countdown automatically starts</p>
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-purple-50 border-purple-200">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-xs text-purple-800">
              <span className="font-semibold">💡 Important:</span> After admin approval, your subscription automatically
              expires in 30 days. You'll get a reminder 3 days before expiry so you can renew if needed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm h-11 font-semibold shadow-lg">
            ✓ I've Made Payment - Report to Admin Now
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Report Your Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-700">
              Great! Once you've completed the payment using the instructions above, follow these steps:
            </p>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 space-y-3">
              <div>
                <p className="text-sm font-semibold text-emerald-900 mb-1">What information the admin needs:</p>
                <ul className="text-sm text-emerald-800 space-y-1 ml-4 list-disc">
                  <li>
                    <span className="font-medium">Transaction ID</span> or receipt number
                  </li>
                  <li>
                    <span className="font-medium">Amount paid</span> (GHS {monthlyFee.toFixed(2)})
                  </li>
                  <li>
                    <span className="font-medium">Date</span> you made the payment
                  </li>
                  <li>
                    <span className="font-medium">Payment method</span> (Mobile Money, Bank, etc.)
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-1">Contact admin at:</p>
              <p className="text-sm text-blue-800 font-medium">{paymentContactNumber || "Channel Contact"}</p>
              {paymentContactName && <p className="text-xs text-blue-700 mt-1">{paymentContactName}</p>}
            </div>
            <Button
              onClick={handleReportPayment}
              disabled={reportingPayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-10 font-medium"
            >
              <Copy className="h-4 w-4 mr-2" />
              {reportingPayment ? "Copying..." : "Copy Payment Details to Share"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
