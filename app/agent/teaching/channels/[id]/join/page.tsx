"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, AlertCircle, Check, Lock, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { SubscriptionPaymentNotification } from "@/components/teaching/subscription-payment-notification"

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

  useEffect(() => {
    if (user?.id && channelId) {
      loadData()
    }
  }, [user?.id, channelId])

  const loadData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      console.log("[v0] Loading channel data for:", channelId)

      const { data: channelData, error: channelError } = await supabase
        .from("teaching_channels")
        .select("*")
        .eq("id", channelId)
        .single()

      if (channelError) throw channelError
      console.log("[v0] Channel loaded:", channelData)
      setChannel(channelData)

      const { data: subData } = await supabase
        .from("channel_subscription_settings")
        .select("*")
        .eq("channel_id", channelId)
        .maybeSingle()

      console.log("[v0] Subscription settings loaded:", subData)
      setSubscription(subData)

      const { data: requestData } = await supabase
        .from("channel_join_requests")
        .select("*")
        .eq("channel_id", channelId)
        .eq("agent_id", user.id)
        .maybeSingle()

      console.log("[v0] Existing join request:", requestData)
      if (requestData) {
        setJoinRequest(requestData)
        if (requestData.status === "pending" && subData?.is_enabled) {
          console.log("[v0] Setting payment notification from existing request")
          setShowPaymentNotification(true)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
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
      console.log("[v0] Submitting join request:", {
        channelId,
        userId: user.id,
        subscriptionEnabled: subscription?.is_enabled,
        subscriptionFee: subscription?.monthly_fee,
      })

      const { data: newRequest, error } = await supabase
        .from("channel_join_requests")
        .insert([
          {
            channel_id: channelId,
            agent_id: user.id,
            request_message: requestMessage || null,
            status: "pending",
            requested_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.log("[v0] Error inserting join request:", error)
        throw error
      }

      console.log("[v0] Join request created successfully:", newRequest)
      setJoinRequest(newRequest)
      setShowPaymentNotification(subscription?.is_enabled || false)
      console.log("[v0] Setting showPaymentNotification to:", subscription?.is_enabled)

      if (subscription?.is_enabled) {
        toast.success("Join request sent! Please proceed with payment.")
      } else {
        toast.success("Join request sent! Awaiting approval.")
      }
    } catch (error: any) {
      console.error("[v0] Error submitting join request:", error)
      if (error.code === "23505") {
        toast.error("You have already requested to join this channel")
      } else {
        toast.error("Failed to submit join request: " + (error.message || "Unknown error"))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-medium">Channel not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Main Content */}
        {showPaymentNotification ? (
          // AFTER submission - show confirmation and payment notification
          <div className="space-y-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 flex items-center gap-3">
                <Check className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Join Request Submitted</p>
                  <p className="text-sm text-green-800">Your request to join "{channel.name}" has been sent.</p>
                </div>
              </CardContent>
            </Card>

            {subscription?.is_enabled && (
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

            {!subscription?.is_enabled && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-semibold mb-2">Waiting for Approval</p>
                  <p className="text-sm">
                    The channel admin/teacher will review your request and approve or reject it. You'll be notified once
                    they respond. Check back here or your notifications for updates.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <Button variant="outline" onClick={() => router.push("/agent/teaching")} className="w-full">
              Return to Channels
            </Button>
          </div>
        ) : (
          // BEFORE submission - show the join request form
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-blue-900">{channel.name}</CardTitle>
                  <p className="text-sm text-blue-700 mt-2">{channel.description}</p>
                </div>
                {subscription?.is_enabled && (
                  <Badge className="bg-red-100 text-red-800 shrink-0">
                    <Lock className="h-3 w-3 mr-1" />
                    Paid Channel
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Subscription Info */}
              {subscription?.is_enabled && (
                <Alert className="bg-amber-50 border-amber-200">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 space-y-2">
                    <p className="font-semibold">Monthly Subscription Required</p>
                    <p className="text-sm">
                      This is a paid channel. You must pay{" "}
                      <span className="font-bold">GHS {subscription.monthly_fee.toFixed(2)}</span> monthly to access the
                      content. After your request is approved and payment verified, your 30-day access countdown begins.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Join Request Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Request to Join</h3>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    {subscription?.is_enabled
                      ? "Message to Admin/Teacher (Required)"
                      : "Message to Admin/Teacher (Optional)"}
                  </Label>
                  <Textarea
                    id="message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder={
                      subscription?.is_enabled
                        ? "Introduce yourself and confirm you're ready to make payment..."
                        : "Tell the channel admin why you want to join (optional)..."
                    }
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">{requestMessage.length}/500 characters</p>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-800">
                    {subscription?.is_enabled
                      ? "After submitting, you'll see payment instructions. Complete payment and wait for admin verification and approval."
                      : "After submitting, the channel admin/teacher will review your request and approve or reject it."}
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSubmitJoinRequest}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm"
                >
                  {submitting ? "Sending..." : "Send Join Request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
