"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, CreditCard, Copy, Smartphone } from "lucide-react"
import { toast } from "sonner"

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
  onCopyPaymentInfo?: () => void
}

export function SubscriptionPaymentNotification({
  channelName,
  monthlyFee,
  currency,
  paymentInstructions,
  paymentContactName,
  paymentContactNumber,
  status,
  onCopyPaymentInfo,
}: SubscriptionPaymentNotificationProps) {
  const [phone, setPhone] = useState("")
  const [reference, setReference] = useState("")
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    const text = [
      `Channel: ${channelName}`,
      `Amount: ${currency} ${monthlyFee.toFixed(2)}`,
      paymentInstructions,
      paymentContactName,
      paymentContactNumber,
      phone ? `Paid from: ${phone}` : "",
      reference ? `Reference: ${reference}` : "",
    ]
      .filter(Boolean)
      .join("\n")
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopyPaymentInfo?.()
    toast.success("Payment details copied")
  }

  return (
    <Card className="w-full max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 py-5 sm:px-6">
        <CardTitle className="text-lg font-semibold">Subscribe to Channel</CardTitle>
        <p className="text-sm text-emerald-50 mt-1">{channelName}</p>
      </CardHeader>

      <CardContent className="space-y-4 px-4 py-5 sm:px-6">
        <Alert
          className={
            status === "verified"
              ? "rounded-xl border-emerald-200 bg-emerald-50"
              : "rounded-xl border-amber-200 bg-amber-50"
          }
        >
          {status === "verified" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <AlertDescription className="text-sm text-slate-800">
            {status === "verified"
              ? "Payment verified. The admin will approve your access shortly."
              : "Complete payment below, then share your phone number and reference with the channel admin."}
          </AlertDescription>
        </Alert>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Monthly fee</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">
            {currency} {monthlyFee.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Payment instructions
          </p>
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{paymentInstructions}</p>
          {(paymentContactName || paymentContactNumber) && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              {paymentContactName && <p className="font-medium">{paymentContactName}</p>}
              {paymentContactNumber && <p>MoMo: {paymentContactNumber}</p>}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pay-phone" className="text-sm font-medium text-slate-800">
              Phone used for payment
            </Label>
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="pay-phone"
                type="tel"
                placeholder="0241234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 pl-10 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-ref" className="text-sm font-medium text-slate-800">
              Payment reference
            </Label>
            <Input
              id="pay-ref"
              placeholder="Transaction ID"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl border-emerald-200 text-emerald-800 hover:bg-emerald-50"
          onClick={copyAll}
        >
          <Copy className="h-4 w-4 mr-2" />
          {copied ? "Copied!" : "Copy details for admin"}
        </Button>
      </CardContent>
    </Card>
  )
}
