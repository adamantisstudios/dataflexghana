"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { toast } from "sonner"
import { CreditCard, Smartphone } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelName: string
  channelId: string
  monthlyFee: number
  subscriptionId: string
  paymentInstructions?: string
  paymentContactNumber?: string
  onSuccess?: () => void
}

export function SubscriptionRenewalDialog({
  open,
  onOpenChange,
  channelName,
  channelId,
  monthlyFee,
  subscriptionId,
  paymentInstructions = "Pay via Mobile Money and use your phone number as reference.",
  paymentContactNumber,
  onSuccess,
}: Props) {
  const [phone, setPhone] = useState("")
  const [reference, setReference] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast.error("Enter the phone number used for payment")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/agent/subscriptions", {
        method: "POST",
        headers: { ...getAgentAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          channelId,
          amount: monthlyFee,
          phone: phone.trim(),
          reference: reference.trim() || phone.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit renewal")

      toast.success("Renewal request sent! Awaiting admin verification.")
      onOpenChange(false)
      onSuccess?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit renewal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 p-0 gap-0">
        <DialogHeader className="space-y-1 border-b border-slate-100 px-4 py-4 sm:px-6 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-900">Subscribe to Channel</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Complete payment for <span className="font-medium text-slate-900">{channelName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Monthly fee</p>
            <p className="mt-1 text-3xl font-bold text-emerald-700">GHS {monthlyFee.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Payment instructions
            </p>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{paymentInstructions}</p>
            {paymentContactNumber && (
              <p className="text-sm text-slate-600">
                MoMo / contact: <span className="font-medium">{paymentContactNumber}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="renew-phone" className="text-sm font-medium text-slate-800">
              Your MoMo phone number
            </Label>
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="renew-phone"
                type="tel"
                inputMode="tel"
                placeholder="e.g. 0241234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 pl-10 rounded-xl border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="renew-ref" className="text-sm font-medium text-slate-800">
              Payment reference (optional)
            </Label>
            <Input
              id="renew-ref"
              placeholder="Transaction ID or reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-11 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-slate-100 px-4 py-4 sm:px-6 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full sm:w-auto rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            className="h-11 w-full sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Submitting…" : "Submit payment details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
