"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface PendingSubscriptionRequest {
  id: string
  agent_id: string
  agent_name: string
  channel_id: string
  channel_name: string
  request_message?: string
  requested_at: string
  monthly_fee: number
}

interface SubscriptionApprovalPanelProps {
  channelId: string
}

export function SubscriptionApprovalPanel({ channelId }: SubscriptionApprovalPanelProps) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [verificationData, setVerificationData] = useState({
    amount: 0,
    notes: "",
  })

  useEffect(() => {
    loadPendingRequests()
  }, [channelId])

  const loadPendingRequests = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("channel_join_requests_with_agents")
        .select(
          `
          id, agent_id, agent_name, channel_id, request_message, requested_at, full_name,
          channel_subscription_settings(monthly_fee)
        `,
        )
        .eq("channel_id", channelId)
        .eq("status", "pending")

      if (error) throw error

      const filtered = data?.filter((req: any) => req.channel_subscription_settings?.is_enabled) || []
      setPendingRequests(filtered)
    } catch (error) {
      console.error("[v0] Error loading pending requests:", error)
      toast.error("Failed to load pending subscription requests")
    } finally {
      setLoading(false)
    }
  }

  const handleApproveWithPaymentVerification = async (requestId: string, agentId: string) => {
    if (!verificationData.amount || verificationData.amount <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    try {
      setApprovingId(requestId)

      // Call the new payment verification API
      const response = await fetch("/api/subscriptions/verify-and-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinRequestId: requestId,
          channelId,
          agentId,
          amountVerified: verificationData.amount,
          notes: verificationData.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to verify payment")
      }

      const { expiresAt } = await response.json()

      // Update the join request to approved
      const { error: updateError } = await supabase
        .from("channel_join_requests")
        .update({ status: "approved", responded_at: new Date().toISOString() })
        .eq("id", requestId)

      if (updateError) throw updateError

      const expiryDate = new Date(expiresAt)
      toast.success(
        `Payment verified! Member approved and added to channel. Subscription expires on ${expiryDate.toLocaleDateString()}.`,
      )
      setVerifyingId(null)
      setVerificationData({ amount: 0, notes: "" })
      await loadPendingRequests()
    } catch (error: any) {
      console.error("[v0] Error approving subscription:", error)
      toast.error(error.message || "Failed to approve subscription")
    } finally {
      setApprovingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading pending subscriptions...</div>
  }

  if (pendingRequests.length === 0) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-blue-800">
          No pending subscription requests for this channel.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-gray-800">Pending Subscription Requests</h3>
      {pendingRequests.map((request) => (
        <Card key={request.id} className="border-amber-200 bg-amber-50">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800">{request.full_name}</p>
                <p className="text-xs text-gray-600">Wants to join - Awaiting payment verification</p>
              </div>
              <Badge className="bg-amber-600 shrink-0">Pending</Badge>
            </div>

            {request.request_message && (
              <div className="bg-white rounded p-2 text-xs text-gray-600 border border-amber-100">
                "{request.request_message}"
              </div>
            )}

            <Dialog open={verifyingId === request.id} onOpenChange={(open) => !open && setVerifyingId(null)}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  onClick={() => setVerifyingId(request.id)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verify Payment & Approve
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-sm">Verify Payment & Approve Subscription</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded p-3 space-y-2">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Agent:</span> {request.full_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Monthly Fee:</span> GHS{" "}
                      {request.channel_subscription_settings?.monthly_fee.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Requested:</span>{" "}
                      {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Payment Amount */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Amount Received (GHS)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={verificationData.amount || ""}
                      onChange={(e) =>
                        setVerificationData({
                          ...verificationData,
                          amount: e.target.value ? Number.parseFloat(e.target.value) : 0,
                        })
                      }
                      placeholder="Enter payment amount"
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Verification Notes */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Verification Notes (Optional)</Label>
                    <Textarea
                      value={verificationData.notes}
                      onChange={(e) => setVerificationData({ ...verificationData, notes: e.target.value })}
                      placeholder="E.g., Transaction ID: XXX123"
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>

                  {/* Warning */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-3 w-3 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-800">
                      Upon approval, this member's 30-day subscription countdown will start automatically. They will be
                      added to the channel and can access all content.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVerifyingId(null)}
                    className="flex-1 text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleApproveWithPaymentVerification(request.id, request.agent_id)}
                    disabled={approvingId === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  >
                    {approvingId === request.id ? "Approving..." : "Approve & Add Member"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
