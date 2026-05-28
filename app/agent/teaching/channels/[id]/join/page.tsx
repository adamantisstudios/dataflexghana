"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { ArrowLeft, AlertCircle, Check, Lock, DollarSign, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { SubscriptionPaymentNotification } from "@/components/teaching/subscription-payment-notification"
import { teachingHubMainClass, teachingHubPageClass } from "@/components/teaching/teaching-hub-ui"

interface Channel {
  id: string
  name: string
  description: string
  image_url?: string
  created_by: string
}

interface SubscriptionSettings {
  is_enabled: boolean
  monthly_fee: number
  payment_contact_name?: string
  payment_contact_number?: string
  payment_instructions?: string
}

interface JoinRequest {
  id: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  request_message?: string | null
}

export default function JoinChannelPage() {
  const params = useParams()
  const router = useRouter()
  const channelId = params.id as string
  const { user } = useAuth()

  const [channel, setChannel] = useState<Channel | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionSettings | null>(null)
  const [joinRequest, setJoinRequest] = useState<JoinRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")
  const [showPaymentNotification, setShowPaymentNotification] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<string>("none")
  const [canRenew, setCanRenew] = useState(false)

  useEffect(() => {
    if (user?.id && channelId) {
      loadData()
    }
  }, [user?.id, channelId])

  const loadData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const res = await fetch(`/api/agent/channels/${channelId}/join`, {
        headers: getAgentAuthHeaders(),
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load channel")

      setChannel(data.channel)
      setSubscription(data.subscription)
      setMembershipStatus(data.membershipStatus || "none")
      setCanRenew(Boolean(data.canRenew))
      if (data.joinRequest) {
        setJoinRequest(data.joinRequest)
        if (data.joinRequest.status === "pending" && data.subscription?.is_enabled) {
          setShowPaymentNotification(true)
        }
      }
    } catch (error) {
      console.error("[join] load error:", error)
      toast.error("Failed to load channel information")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitJoinRequest = async () => {
    if (!user?.id || !channel) return

    if (subscription?.is_enabled && !requestMessage.trim()) {
      toast.error("Please include a message with your join request for this paid channel")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch(`/api/agent/channels/${channelId}/join`, {
        method: "POST",
        headers: { ...getAgentAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ request_message: requestMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit join request")

      setJoinRequest(data.joinRequest)
      setShowPaymentNotification(data.requiresPayment || false)

      if (data.isRenewal) {
        toast.success("Renewal request submitted! Complete payment if required, then await admin verification.")
      } else if (data.requiresPayment) {
        toast.success("Join request sent! Please complete payment using the instructions below.")
      } else {
        toast.success("Join request sent! Awaiting approval.")
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to submit join request"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${teachingHubPageClass}`}>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${teachingHubPageClass}`}>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-medium">Channel not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPaid = Boolean(subscription?.is_enabled)

  return (
    <main className={`${teachingHubPageClass} overflow-x-hidden`}>
      <div className={teachingHubMainClass}>
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {showPaymentNotification ? (
          <div className="space-y-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 flex items-center gap-3">
                <Check className="h-6 w-6 text-[#0E8F3D] shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Join Request Submitted</p>
                  <p className="text-sm text-green-800">
                    Your request to join &quot;{channel.name}&quot; has been sent.
                  </p>
                </div>
              </CardContent>
            </Card>

            {isPaid && subscription && (
              <SubscriptionPaymentNotification
                channelName={channel.name}
                channelId={channelId}
                monthlyFee={subscription.monthly_fee}
                currency="GHS"
                paymentInstructions={
                  subscription.payment_instructions || "Contact the channel admin for payment details"
                }
                paymentContactName={subscription.payment_contact_name}
                paymentContactNumber={subscription.payment_contact_number}
                status="pending"
                requestId={joinRequest?.id || ""}
                onCopyPaymentInfo={() => {
                  navigator.clipboard.writeText(subscription.payment_instructions || "")
                  toast.success("Copied to clipboard")
                }}
              />
            )}

            {!isPaid && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-semibold mb-2">Waiting for Approval</p>
                  <p className="text-sm">
                    The channel admin will review your request. You will be notified once they respond.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <Button variant="outline" onClick={() => router.push("/agent/teaching")} className="w-full">
              Return to Channels
            </Button>
          </div>
        ) : (
          <Card className="shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-gray-900">{channel.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{channel.description}</p>
                </div>
                {isPaid && (
                  <Badge className="bg-amber-100 text-amber-900 shrink-0 border-amber-200">
                    <Lock className="h-3 w-3 mr-1" />
                    Paid
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {isPaid && subscription && (
                <Card className="border-2 border-[#0E8F3D]/30 bg-gradient-to-br from-emerald-50 to-white">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[#0E8F3D]">
                      <CreditCard className="h-5 w-5" />
                      <p className="font-semibold">Subscription required before access</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      GHS {Number(subscription.monthly_fee).toFixed(2)}
                      <span className="text-sm font-normal text-gray-500"> / month</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      After you submit your request, pay using the instructions shown. An admin will verify your
                      payment and grant 30 days of access.
                    </p>
                    {subscription.payment_instructions && (
                      <Alert className="bg-white border-amber-200">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm text-amber-900">
                          <p className="font-medium mb-1">Payment instructions (preview)</p>
                          {subscription.payment_instructions}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">
                  {canRenew || membershipStatus === "expired" ? "Renew subscription" : "Request to Join"}
                </h3>
                {(canRenew || membershipStatus === "expired") && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-900">
                      Your previous subscription has expired. Submit a new request and payment to restore access for
                      another 30 days after admin verification.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    {isPaid ? "Message to Admin (Required)" : "Message to Admin (Optional)"}
                  </Label>
                  <Textarea
                    id="message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value.slice(0, 500))}
                    placeholder={
                      isPaid
                        ? "Introduce yourself and confirm you are ready to pay the monthly fee…"
                        : "Tell the channel admin why you want to join (optional)…"
                    }
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">{requestMessage.length}/500 characters</p>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-800">
                    {isPaid
                      ? "Step 1: Submit request → Step 2: Pay using instructions → Step 3: Admin verifies → Step 4: 30-day access begins."
                      : "After submitting, the channel admin will review and approve or reject your request."}
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSubmitJoinRequest}
                  disabled={submitting}
                  className="w-full bg-[#0E8F3D] hover:bg-[#35B24A] text-white h-11"
                >
                  {submitting
                    ? "Sending…"
                    : canRenew || membershipStatus === "expired"
                      ? "Submit renewal request"
                      : isPaid
                        ? "Submit Request & View Payment Info"
                        : "Send Join Request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
