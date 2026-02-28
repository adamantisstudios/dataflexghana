"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"

interface SubscriptionPaymentVerificationDialogProps {
  requestId: string
  agentName: string
  agentPhone: string
  channelName: string
  channelId: string
  agentId: string
  monthlyFee: number
  requestedAt: string
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function SubscriptionPaymentVerificationDialog({
  requestId,
  agentName,
  agentPhone,
  channelName,
  channelId,
  agentId,
  monthlyFee,
  requestedAt,
  onSuccess,
  trigger,
}: SubscriptionPaymentVerificationDialogProps) {
  const [open, setOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verificationData, setVerificationData] = useState({
    amountVerified: monthlyFee,
    notes: "",
  })

  const handleVerifyPayment = async () => {
    if (!verificationData.amountVerified || verificationData.amountVerified <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    try {
      setVerifying(true)

      const response = await fetch("/api/subscriptions/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: requestId,
          channelId,
          agentId,
          amountVerified: verificationData.amountVerified,
          verifiedBy: "admin", // Should be current user
          notes: verificationData.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to verify payment")
      }

      const data = await response.json()

      const { error: updateError } = await fetch("/api/channel-join-requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })

      toast.success(data.message)
      setOpen(false)
      setVerificationData({ amountVerified: monthlyFee, notes: "" })
      onSuccess()
    } catch (error: any) {
      console.error("[v0] Error verifying payment:", error)
      toast.error(error.message || "Failed to verify payment")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Verify & Approve
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Verify Payment & Approve Subscription</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Request Summary */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div>
              <p className="text-xs text-gray-600 font-medium">Agent</p>
              <p className="text-sm text-gray-800">{agentName}</p>
              <p className="text-xs text-gray-500">Phone: {agentPhone}</p>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs text-gray-600 font-medium">Channel</p>
              <p className="text-sm text-gray-800">{channelName}</p>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs text-gray-600 font-medium">Monthly Fee</p>
              <p className="text-lg font-bold text-green-600">GHS {monthlyFee.toFixed(2)}</p>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs text-gray-600 font-medium">Requested</p>
              <p className="text-xs text-gray-800">{new Date(requestedAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-medium">
              Amount Verified (GHS)
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={verificationData.amountVerified}
              onChange={(e) =>
                setVerificationData({
                  ...verificationData,
                  amountVerified: e.target.value ? Number.parseFloat(e.target.value) : 0,
                })
              }
              className="h-9 text-xs"
            />
          </div>

          {/* Verification Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-medium">
              Notes (Transaction ID, etc.)
            </Label>
            <Textarea
              id="notes"
              value={verificationData.notes}
              onChange={(e) => setVerificationData({ ...verificationData, notes: e.target.value })}
              placeholder="E.g., Mobile Money Ref: ABC123456"
              rows={2}
              className="resize-none text-xs"
            />
          </div>

          {/* Timeline Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              Upon approval, this member will be added to the channel and their 30-day subscription countdown will begin
              automatically.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="text-xs h-8">
            Cancel
          </Button>
          <Button
            onClick={handleVerifyPayment}
            disabled={verifying}
            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
          >
            {verifying ? "Verifying..." : "Verify & Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
