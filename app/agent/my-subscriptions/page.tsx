"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Subscription {
  id: string
  channel_id: string
  channel_name: string
  subscription_start_date: string
  subscription_end_date: string
  monthly_fee: number
  subscription_status: string
  is_renewal_due: boolean
  days_remaining: number
}

export default function MySubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [renewingId, setRenewingId] = useState<string | null>(null)
  const [renewalData, setRenewalData] = useState({
    amount: 0,
    notes: "",
  })
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      loadSubscriptions()
    }
  }, [user?.id])

  const loadSubscriptions = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const now = new Date()

      const { data, error } = await supabase
        .from("channel_subscriptions")
        .select(`
          id,
          channel_id,
          subscription_start_date,
          subscription_end_date,
          monthly_fee,
          subscription_status,
          is_renewal_due,
          teaching_channels(name)
        `)
        .eq("agent_id", user.id)
        .order("subscription_end_date", { ascending: true })

      if (error) throw error

      const enriched = (data || []).map((item: any) => {
        const daysRemaining = Math.ceil(
          (new Date(item.subscription_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )

        return {
          id: item.id,
          channel_id: item.channel_id,
          channel_name: item.teaching_channels?.name,
          subscription_start_date: item.subscription_start_date,
          subscription_end_date: item.subscription_end_date,
          monthly_fee: item.monthly_fee,
          subscription_status: item.subscription_status,
          is_renewal_due: item.is_renewal_due,
          days_remaining: daysRemaining,
        }
      })

      setSubscriptions(enriched)
    } catch (error) {
      console.error("[v0] Error loading subscriptions:", error)
      toast.error("Failed to load subscriptions")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRenewal = async (subscriptionId: string) => {
    if (!renewalData.amount || renewalData.amount <= 0) {
      toast.error("Please enter a valid renewal amount")
      return
    }

    try {
      setRenewingId(subscriptionId)

      const { error } = await supabase.from("subscription_renewal_requests").insert({
        subscription_id: subscriptionId,
        channel_id: subscriptions.find((s) => s.id === subscriptionId)?.channel_id,
        agent_id: user?.id,
        renewal_start_date: new Date().toISOString(),
        renewal_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        renewal_amount: renewalData.amount,
        payment_status: "pending",
      })

      if (error) throw error

      toast.success("Renewal request sent! Awaiting admin approval.")
      setRenewingId(null)
      setRenewalData({ amount: 0, notes: "" })
      loadSubscriptions()
    } catch (error: any) {
      console.error("[v0] Error requesting renewal:", error)
      toast.error("Failed to request renewal")
    } finally {
      setRenewingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading your subscriptions...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">My Channel Subscriptions</h1>

        {subscriptions.length === 0 ? (
          <Card className="bg-blue-50 border-blue-200 text-center py-12">
            <CardContent>
              <p className="text-gray-600">You don't have any active subscriptions</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg text-blue-900">{sub.channel_name}</CardTitle>
                      <p className="text-xs text-blue-700 mt-1">
                        Joined {new Date(sub.subscription_start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          sub.subscription_status === "active"
                            ? "bg-green-100 text-green-800"
                            : sub.subscription_status === "expired"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {sub.subscription_status.toUpperCase()}
                      </Badge>
                      {sub.is_renewal_due && <Badge className="bg-amber-100 text-amber-800">RENEW SOON</Badge>}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Monthly Fee</p>
                      <p className="text-lg font-bold text-gray-800">GHS {sub.monthly_fee.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Days Remaining</p>
                      <p className="text-lg font-bold text-gray-800">{Math.max(0, sub.days_remaining)} days</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Expires</p>
                      <p className="text-lg font-bold text-gray-800">
                        {new Date(sub.subscription_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {sub.subscription_status === "active" && sub.days_remaining <= 3 && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 flex gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        Your subscription expires soon. Renew now to avoid losing access.
                      </p>
                    </div>
                  )}

                  {sub.subscription_status === "expired" && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">
                        Your subscription has expired and you no longer have access to this channel.
                      </p>
                    </div>
                  )}

                  {sub.subscription_status === "active" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renew Subscription
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Renew Subscription - {sub.channel_name}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-xs text-gray-600">Monthly Fee</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">GHS {sub.monthly_fee.toFixed(2)}</p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Payment Amount (GHS)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={renewalData.amount || ""}
                              onChange={(e) =>
                                setRenewalData({
                                  ...renewalData,
                                  amount: e.target.value ? Number.parseFloat(e.target.value) : 0,
                                })
                              }
                              placeholder="Enter renewal amount"
                              className="h-9 text-xs"
                            />
                          </div>

                          <Button
                            onClick={() => handleRequestRenewal(sub.id)}
                            disabled={renewingId === sub.id}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                          >
                            {renewingId === sub.id ? "Processing..." : "Request Renewal"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
