"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import type { PublicWritingService } from "@/lib/writing-types"
import { WRITING_ORDER_STATUS_LABELS, type WritingOrder, type WritingOrderStatus } from "@/lib/writing-types"
import { normalizeGhanaPhoneNumber, toWhatsAppHref } from "@/lib/phone-utils"
import { PenLine, Loader2, Download, MessageCircle, CheckCircle2 } from "lucide-react"

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
}

type ServiceRow = PublicWritingService & { is_on_storefront?: boolean }

interface Props {
  agentId: string
  settings: StoreSetting[]
  onSettingsChange: () => void
}

export function MarketplaceWritingSection({ agentId, settings, onSettingsChange }: Props) {
  const [services, setServices] = useState<ServiceRow[]>([])
  const [orders, setOrders] = useState<WritingOrder[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const visibleIds = new Set(
    settings.filter((s) => s.item_type === "writing_service" && s.is_visible).map((s) => s.item_id),
  )

  const loadServices = useCallback(async () => {
    setLoadingServices(true)
    try {
      const res = await fetch(`/api/agent/writing-services/packages?agentId=${agentId}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setServices(data.services || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load writing services")
      setServices([])
    } finally {
      setLoadingServices(false)
    }
  }, [agentId])

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const res = await fetch(`/api/agent/writing-orders?agentId=${agentId}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrders(data.orders || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders")
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }, [agentId])

  useEffect(() => {
    loadServices()
    loadOrders()
  }, [loadServices, loadOrders])

  const toggle = async (serviceId: string, visible: boolean) => {
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          item_id: serviceId,
          item_type: "writing_service",
          is_visible: visible,
          custom_margin: 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      toast.success(visible ? "Service visible on your store" : "Service hidden from store")
      onSettingsChange()
      loadServices()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    }
  }

  const markDelivered = async (orderId: string) => {
    setMarkingId(orderId)
    try {
      const res = await fetch(`/api/agent/writing-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ status: "delivered" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      toast.success(
        data.commission_credited > 0
          ? `Delivered! ₵${Number(data.commission_credited).toFixed(2)} credited to your commission balance.`
          : "Order marked as delivered",
      )
      onSettingsChange()
      loadOrders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setMarkingId(null)
    }
  }

  const openWhatsApp = (order: WritingOrder) => {
    const customerPhone = normalizeGhanaPhoneNumber(order.customer_phone)
    const serviceName = order.writing_services?.service_name || "document"
    const message = `Hello ${order.customer_name}, your ${serviceName} is ready. Please find the document attached.`
    const url = toWhatsAppHref(customerPhone, message)
    if (!url) {
      toast.error("Invalid customer phone number")
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6">
        <div className="flex items-center gap-3">
          <PenLine className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold">Professional Writing</h2>
            <p className="text-sm text-white/90 mt-1">
              Enable CV, cover letter, and business writing on your storefront. You earn commission when
              you deliver completed orders to your customers via WhatsApp.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="orders">Agent orders</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4">
          <Card id="writing-services-section">
            <CardHeader>
              <CardTitle>Writing packages</CardTitle>
              <CardDescription>Toggle services your customers can order from your store</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingServices ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                </div>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No writing services available yet. Check back when admin adds packages.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {services.map((svc) => {
                    const onStore = visibleIds.has(svc.id) || svc.is_on_storefront
                    return (
                      <div
                        key={svc.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{svc.service_name}</h3>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {svc.category}
                            </Badge>
                          </div>
                          <Switch checked={onStore} onCheckedChange={(v) => toggle(svc.id, v)} />
                        </div>
                        {svc.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{svc.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          <span className="text-lg font-bold text-slate-900">₵{svc.price.toFixed(2)}</span>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            Earn ₵{svc.agent_commission.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{svc.turnaround_time}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Label htmlFor={`writing-${svc.id}`} className="text-xs text-muted-foreground">
                            {onStore ? "On your storefront" : "Hidden"}
                          </Label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your writing orders</CardTitle>
              <CardDescription>
                Download completed documents and send them to customers via your WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="border rounded-xl p-4 space-y-2">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="font-semibold">{o.customer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {o.writing_services?.service_name || "Writing"}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {WRITING_ORDER_STATUS_LABELS[o.status as WritingOrderStatus] || o.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Paid ₵{Number(o.total_paid).toFixed(2)}</span>
                        <span className="text-emerald-700 font-medium">
                          Commission ₵{Number(o.agent_commission_earned).toFixed(2)}
                          {o.commission_credited && " ✓"}
                        </span>
                      </div>
                      {o.status === "completed" && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {o.completed_file_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(o.completed_file_url!, "_blank")}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download document
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openWhatsApp(o)}>
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Send via WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#0E8F3D] hover:bg-[#0A5C2A]"
                            disabled={markingId === o.id}
                            onClick={() => markDelivered(o.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {markingId === o.id ? "Saving…" : "Mark delivered"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
