"use client"

import { useCallback, useEffect, useState, memo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import {
  WRITING_CATEGORIES,
  WRITING_ORDER_STATUSES,
  WRITING_ORDER_STATUS_LABELS,
  type WritingService,
  type WritingOrder,
  type WritingOrderStatus,
  type WritingCategory,
} from "@/lib/writing-types"
import { Loader2, PenLine, Plus, Pencil, RefreshCw, ExternalLink } from "lucide-react"

const emptyServiceForm = () => ({
  service_name: "",
  description: "",
  price: "",
  agent_commission: "",
  turnaround_time: "2-3 business days",
  category: "General" as WritingCategory,
  is_active: true,
})

function WritingServicesAdminTab() {
  const [services, setServices] = useState<WritingService[]>([])
  const [orders, setOrders] = useState<WritingOrder[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyServiceForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [orderEdits, setOrderEdits] = useState<
    Record<string, { status: WritingOrderStatus; admin_notes: string; completedFile: File | null }>
  >({})
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null)

  const loadServices = useCallback(async () => {
    setLoadingServices(true)
    try {
      const res = await fetch("/api/admin/writing-services/services", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load services")
      setServices(data.data || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load services")
      setServices([])
    } finally {
      setLoadingServices(false)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const res = await fetch("/api/admin/writing-services/orders", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load orders")
      const rows: WritingOrder[] = data.data || []
      setOrders(rows)
      const edits: Record<string, { status: WritingOrderStatus; admin_notes: string; completedFile: File | null }> = {}
      for (const o of rows) {
        edits[o.id] = {
          status: o.status,
          admin_notes: o.admin_notes || "",
          completedFile: null,
        }
      }
      setOrderEdits(edits)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders")
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    loadServices()
    loadOrders()
  }, [loadServices, loadOrders])

  const resetForm = () => {
    setForm(emptyServiceForm())
    setEditingId(null)
  }

  const startEdit = (svc: WritingService) => {
    setEditingId(svc.id)
    setForm({
      service_name: svc.service_name,
      description: svc.description || "",
      price: String(svc.price),
      agent_commission: String(svc.agent_commission),
      turnaround_time: svc.turnaround_time,
      category: svc.category,
      is_active: svc.is_active,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const saveService = async () => {
    if (!form.service_name.trim()) {
      toast.error("Service name is required")
      return
    }
    setSaving(true)
    try {
      const payload = {
        service_name: form.service_name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        agent_commission: Number(form.agent_commission || 0),
        turnaround_time: form.turnaround_time.trim() || "2-3 business days",
        category: form.category,
        is_active: form.is_active,
      }
      const url = editingId
        ? `/api/admin/writing-services/services/${editingId}`
        : "/api/admin/writing-services/services"
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")
      toast.success(editingId ? "Service updated" : "Service created")
      resetForm()
      loadServices()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (svc: WritingService) => {
    try {
      const res = await fetch(`/api/admin/writing-services/services/${svc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ is_active: !svc.is_active }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      loadServices()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  const uploadCompletedPdf = async (orderId: string, file: File): Promise<string> => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("order_id", orderId)
    const res = await fetch("/api/admin/writing-services/upload", {
      method: "POST",
      headers: getAdminAuthHeaders(),
      body: fd,
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || "Upload failed")
    return data.url as string
  }

  const saveOrder = async (orderId: string) => {
    const edit = orderEdits[orderId]
    if (!edit) return

    setUploadingOrderId(orderId)
    try {
      let completed_file_url: string | undefined
      const existing = orders.find((o) => o.id === orderId)

      if (edit.completedFile) {
        completed_file_url = await uploadCompletedPdf(orderId, edit.completedFile)
      }

      if (edit.status === "completed" && !completed_file_url && !existing?.completed_file_url) {
        toast.error("Upload the completed PDF before marking as Completed")
        return
      }

      const payload: Record<string, unknown> = {
        status: edit.status,
        admin_notes: edit.admin_notes,
      }
      if (completed_file_url) payload.completed_file_url = completed_file_url

      const res = await fetch(`/api/admin/writing-services/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")
      toast.success("Order updated")
      loadOrders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setUploadingOrderId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Professional Writing Services</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage writing packages and fulfil orders. Agents deliver completed documents to customers via
          their own WhatsApp — you never contact customers directly.
        </p>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="h-5 w-5 text-[#0E8F3D]" />
                {editingId ? "Edit service" : "Add service"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Service name *</Label>
                <Input
                  className="mt-1"
                  value={form.service_name}
                  onChange={(e) => setForm((f) => ({ ...f, service_name: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Price (GHS) *</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div>
                <Label>Agent commission (GHS)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.agent_commission}
                  onChange={(e) => setForm((f) => ({ ...f, agent_commission: e.target.value }))}
                />
              </div>
              <div>
                <Label>Turnaround time</Label>
                <Input
                  className="mt-1"
                  value={form.turnaround_time}
                  onChange={(e) => setForm((f) => ({ ...f, turnaround_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as WritingCategory }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WRITING_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                <Label>Active on marketplace</Label>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button
                  className="bg-[#0E8F3D] hover:bg-[#0A5C2A]"
                  onClick={saveService}
                  disabled={saving}
                >
                  {saving ? "Saving…" : editingId ? "Update service" : "Create service"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All services</CardTitle>
              <Button variant="outline" size="sm" onClick={loadServices}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingServices ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Turnaround</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((svc) => (
                        <TableRow key={svc.id}>
                          <TableCell className="font-medium">{svc.service_name}</TableCell>
                          <TableCell>{svc.category}</TableCell>
                          <TableCell>₵{svc.price.toFixed(2)}</TableCell>
                          <TableCell>₵{svc.agent_commission.toFixed(2)}</TableCell>
                          <TableCell className="text-sm">{svc.turnaround_time}</TableCell>
                          <TableCell>
                            <Switch checked={svc.is_active} onCheckedChange={() => toggleActive(svc)} />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => startEdit(svc)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer orders</CardTitle>
                <CardDescription>Fulfil work here — agents deliver to customers via WhatsApp</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadOrders}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => {
                    const edit = orderEdits[o.id]
                    if (!edit) return null
                    const showUpload = edit.status === "completed" || edit.completedFile
                    return (
                      <div key={o.id} className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
                        <div className="flex flex-wrap justify-between gap-2">
                          <div>
                            <p className="font-semibold">{o.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{o.customer_phone}</p>
                            {o.customer_email && (
                              <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                            )}
                          </div>
                          <Badge variant="outline">₵{Number(o.total_paid).toFixed(2)}</Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {o.writing_services?.service_name || "Writing service"}
                          {o.writing_services?.category && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              · {o.writing_services.category}
                            </span>
                          )}
                        </p>
                        {o.agents?.full_name && (
                          <p className="text-xs text-muted-foreground">
                            Agent:{" "}
                            <Link href="/admin" className="underline">
                              {o.agents.full_name}
                            </Link>{" "}
                            {o.agents.phone_number}
                          </p>
                        )}
                        {o.instructions && (
                          <p className="text-xs bg-slate-50 p-2 rounded border">{o.instructions}</p>
                        )}
                        {Object.keys(o.cv_fields || {}).length > 0 && (
                          <div className="text-xs bg-blue-50 p-2 rounded border space-y-1">
                            <p className="font-semibold text-blue-900">CV details</p>
                            {Object.entries(o.cv_fields).map(([k, v]) => (
                              <p key={k}>
                                <span className="font-medium capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                                {String(v)}
                              </p>
                            ))}
                          </div>
                        )}
                        {o.attached_file_url && (
                          <a
                            href={o.attached_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#0E8F3D] underline inline-flex items-center gap-1"
                          >
                            Customer brief file <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Status</Label>
                            <Select
                              value={edit.status}
                              onValueChange={(v) =>
                                setOrderEdits((prev) => ({
                                  ...prev,
                                  [o.id]: { ...edit, status: v as WritingOrderStatus },
                                }))
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {WRITING_ORDER_STATUSES.filter((s) => s !== "cancelled").map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {WRITING_ORDER_STATUS_LABELS[s]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Admin notes</Label>
                            <Textarea
                              className="mt-1 min-h-[80px]"
                              value={edit.admin_notes}
                              onChange={(e) =>
                                setOrderEdits((prev) => ({
                                  ...prev,
                                  [o.id]: { ...edit, admin_notes: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                        {showUpload && (
                          <div>
                            <Label className="text-xs">Completed PDF (required for Completed status)</Label>
                            <Input
                              className="mt-1"
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={(e) =>
                                setOrderEdits((prev) => ({
                                  ...prev,
                                  [o.id]: {
                                    ...edit,
                                    completedFile: e.target.files?.[0] || null,
                                  },
                                }))
                              }
                            />
                            {o.completed_file_url && !edit.completedFile && (
                              <a
                                href={o.completed_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#0E8F3D] underline mt-1 inline-block"
                              >
                                View current completed file
                              </a>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{new Date(o.created_at).toLocaleString()}</span>
                          {o.paystack_reference && (
                            <span className="font-mono">{o.paystack_reference}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#0E8F3D] hover:bg-[#0A5C2A]"
                          disabled={uploadingOrderId === o.id}
                          onClick={() => saveOrder(o.id)}
                        >
                          {uploadingOrderId === o.id ? "Saving…" : "Save order"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default memo(WritingServicesAdminTab)
