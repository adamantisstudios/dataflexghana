"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { CreditCard } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SubscriptionSettings {
  id: string
  channel_id: string
  is_enabled: boolean
  monthly_fee: number
  payment_contact_name?: string
  payment_contact_number?: string
  payment_instructions?: string
  created_at: string
  updated_at: string
}

interface ChannelSubscriptionManagerProps {
  channelId: string
}

export function ChannelSubscriptionManager({ channelId }: ChannelSubscriptionManagerProps) {
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    is_enabled: false,
    monthly_fee: 0,
    payment_contact_name: "",
    payment_contact_number: "",
    payment_instructions: "",
  })

  useEffect(() => {
    loadSubscriptionSettings()
  }, [channelId])

  const loadSubscriptionSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("channel_subscription_settings")
        .select("*")
        .eq("channel_id", channelId)
        .maybeSingle()

      if (error) {
        console.error("[v0] Error loading subscription settings:", error)
        toast.error("Failed to load subscription settings")
        return
      }

      if (data) {
        setSettings(data)
        setFormData({
          is_enabled: data.is_enabled,
          monthly_fee: data.monthly_fee,
          payment_contact_name: data.payment_contact_name || "",
          payment_contact_number: data.payment_contact_number || "",
          payment_instructions: data.payment_instructions || "",
        })
      } else {
        setFormData({
          is_enabled: false,
          monthly_fee: 0,
          payment_contact_name: "",
          payment_contact_number: "",
          payment_instructions: "",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading subscription settings:", error)
      toast.error("Failed to load subscription settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (formData.is_enabled && (!formData.monthly_fee || formData.monthly_fee <= 0)) {
      toast.error("Please enter a valid monthly fee")
      return
    }

    if (formData.is_enabled && !formData.payment_instructions.trim()) {
      toast.error("Please enter payment instructions")
      return
    }

    try {
      setSaving(true)

      if (settings) {
        const { error } = await supabase
          .from("channel_subscription_settings")
          .update({
            is_enabled: formData.is_enabled,
            monthly_fee: formData.monthly_fee,
            payment_contact_name: formData.payment_contact_name,
            payment_contact_number: formData.payment_contact_number,
            payment_instructions: formData.payment_instructions,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id)

        if (error) throw error
        toast.success("Subscription settings updated")
      } else {
        const { error } = await supabase.from("channel_subscription_settings").insert([
          {
            channel_id: channelId,
            is_enabled: formData.is_enabled,
            monthly_fee: formData.monthly_fee,
            payment_contact_name: formData.payment_contact_name,
            payment_contact_number: formData.payment_contact_number,
            payment_instructions: formData.payment_instructions,
          },
        ])

        if (error) throw error
        toast.success("Subscription settings created")
      }

      setShowDialog(false)
      loadSubscriptionSettings()
    } catch (error) {
      console.error("[v0] Error saving subscription settings:", error)
      toast.error("Failed to save subscription settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 w-full">
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {/* Subscription Status Card */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base text-green-800">Subscription Settings</CardTitle>
            </div>
            <Badge className={formData.is_enabled ? "bg-green-600" : "bg-gray-400"}>
              {formData.is_enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.is_enabled ? (
            <>
              <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Monthly Fee</span>
                  <span className="text-lg font-bold text-green-600">GHS {formData.monthly_fee.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-3">{formData.payment_instructions}</p>
                {formData.payment_contact_name && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Payment Contact:</p>
                    <p className="text-xs text-gray-600">{formData.payment_contact_name}</p>
                    {formData.payment_contact_number && (
                      <p className="text-xs text-gray-600">📞 {formData.payment_contact_number}</p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-green-700 bg-green-100 rounded p-2">
                ℹ️ Your channel subscriptions are enabled. Members must manually pay using the payment details you
                provided.
              </p>
            </>
          ) : (
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600 mb-2">Channel subscriptions are currently disabled</p>
              <p className="text-xs text-gray-500">Enable subscriptions to charge members for channel access</p>
            </div>
          )}

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-8">
                {settings ? "Edit Settings" : "Set Up Subscription"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto w-full">
              <DialogHeader>
                <DialogTitle className="text-base">Manage Channel Subscription</DialogTitle>
                <DialogDescription className="text-xs">
                  Configure subscription settings for your teaching channel. Payment is manual.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 w-full">
                {/* Enable Subscription Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <Label className="text-sm font-medium">Enable Subscriptions</Label>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {formData.is_enabled ? "Subscriptions are active" : "Subscriptions are inactive"}
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      formData.is_enabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        formData.is_enabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {formData.is_enabled && (
                  <>
                    {/* Monthly Fee */}
                    <div className="grid gap-2">
                      <Label htmlFor="fee" className="text-xs font-medium">
                        Monthly Fee (GHS)
                      </Label>
                      <Input
                        id="fee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.monthly_fee || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthly_fee: e.target.value ? Number.parseFloat(e.target.value) : 0,
                          })
                        }
                        placeholder="0.00"
                        className="flex-1 h-9 text-xs"
                      />
                    </div>

                    {/* Payment Instructions */}
                    <div className="grid gap-2">
                      <Label htmlFor="payment-instructions" className="text-xs font-medium">
                        Payment Instructions
                      </Label>
                      <textarea
                        id="payment-instructions"
                        value={formData.payment_instructions}
                        onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                        placeholder="How should members pay? (e.g., Mobile Money, Bank Transfer, etc.)"
                        rows={3}
                        className="px-3 py-2 border border-gray-300 rounded text-xs resize-none"
                      />
                    </div>

                    {/* Payment Contact Name */}
                    <div className="grid gap-2">
                      <Label htmlFor="contact-name" className="text-xs font-medium">
                        Payment Contact Name (Optional)
                      </Label>
                      <Input
                        id="contact-name"
                        value={formData.payment_contact_name}
                        onChange={(e) => setFormData({ ...formData, payment_contact_name: e.target.value })}
                        placeholder="Your name or business name"
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Payment Contact Number */}
                    <div className="grid gap-2">
                      <Label htmlFor="contact-number" className="text-xs font-medium">
                        Payment Contact Number (Optional)
                      </Label>
                      <Input
                        id="contact-number"
                        value={formData.payment_contact_number}
                        onChange={(e) => setFormData({ ...formData, payment_contact_number: e.target.value })}
                        placeholder="Phone number for payments"
                        className="h-9 text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)} className="text-xs h-8">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="space-y-2 text-xs text-blue-800">
            <p className="font-semibold">💡 How Manual Subscriptions Work:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Enable subscriptions and set your monthly fee</li>
              <li>Provide payment instructions (Mobile Money, Bank, etc.)</li>
              <li>Add your contact details so members can reach you</li>
              <li>Members will see your subscription info in the channel</li>
              <li>All payments are managed directly between you and members</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
