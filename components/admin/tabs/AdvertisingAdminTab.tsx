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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import {
  AD_MEDIA_TYPES,
  AD_MEDIA_LABELS,
  AD_ORDER_STATUSES,
  AD_ORDER_STATUS_LABELS,
  customFieldsToRows,
  rowsToCustomFields,
  type AdPackage,
  type AdOrder,
  type AdMediaType,
  type AdOrderStatus,
} from "@/lib/advertising-types"
import { Loader2, Megaphone, Plus, Trash2, Pencil, RefreshCw } from "lucide-react"

const emptyPackageForm = () => ({
  station_name: "",
  media_type: "radio" as AdMediaType,
  package_name: "",
  description: "",
  number_of_spots: "",
  spot_duration: "",
  price: "",
  agent_commission: "",
  is_active: true,
  customRows: [{ key: "", value: "" }],
})

function AdvertisingAdminTab() {
  const [packages, setPackages] = useState<AdPackage[]>([])
  const [orders, setOrders] = useState<AdOrder[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyPackageForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletePkg, setDeletePkg] = useState<AdPackage | null>(null)
  const [orderEdits, setOrderEdits] = useState<Record<string, { status: AdOrderStatus; admin_notes: string }>>({})

  const loadPackages = useCallback(async () => {
    setLoadingPackages(true)
    try {
      const res = await fetch("/api/admin/advertising/packages", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load packages")
      setPackages(data.data || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load packages")
      setPackages([])
    } finally {
      setLoadingPackages(false)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const res = await fetch("/api/admin/advertising/orders", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load orders")
      const rows: AdOrder[] = data.data || []
      setOrders(rows)
      const edits: Record<string, { status: AdOrderStatus; admin_notes: string }> = {}
      for (const o of rows) {
        edits[o.id] = {
          status: o.status,
          admin_notes: o.admin_notes || "",
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
    loadPackages()
    loadOrders()
  }, [loadPackages, loadOrders])

  const resetForm = () => {
    setForm(emptyPackageForm())
    setEditingId(null)
  }

  const startEdit = (pkg: AdPackage) => {
    setEditingId(pkg.id)
    setForm({
      station_name: pkg.station_name,
      media_type: pkg.media_type,
      package_name: pkg.package_name,
      description: pkg.description || "",
      number_of_spots: pkg.number_of_spots != null ? String(pkg.number_of_spots) : "",
      spot_duration: pkg.spot_duration || "",
      price: String(pkg.price),
      agent_commission: String(pkg.agent_commission),
      is_active: pkg.is_active,
      customRows:
        customFieldsToRows(pkg.custom_fields).length > 0
          ? customFieldsToRows(pkg.custom_fields)
          : [{ key: "", value: "" }],
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const savePackage = async () => {
    if (!form.station_name.trim() || !form.package_name.trim() || !form.price) {
      toast.error("Station name, package name, and price are required")
      return
    }
    setSaving(true)
    try {
      const payload = {
        station_name: form.station_name.trim(),
        media_type: form.media_type,
        package_name: form.package_name.trim(),
        description: form.description.trim() || null,
        number_of_spots: form.number_of_spots ? Number(form.number_of_spots) : null,
        spot_duration: form.spot_duration.trim() || null,
        price: Number(form.price),
        agent_commission: Number(form.agent_commission || 0),
        is_active: form.is_active,
        custom_fields: rowsToCustomFields(form.customRows),
      }
      const url = editingId
        ? `/api/admin/advertising/packages/${editingId}`
        : "/api/admin/advertising/packages"
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")
      toast.success(editingId ? "Package updated" : "Package created")
      resetForm()
      loadPackages()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (pkg: AdPackage) => {
    try {
      const res = await fetch(`/api/admin/advertising/packages/${pkg.id}`, {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ is_active: !pkg.is_active }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed")
      toast.success(pkg.is_active ? "Package deactivated" : "Package activated")
      loadPackages()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  const confirmDelete = async () => {
    if (!deletePkg) return
    try {
      const res = await fetch(`/api/admin/advertising/packages/${deletePkg.id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed")
      toast.success("Package deleted")
      setDeletePkg(null)
      if (editingId === deletePkg.id) resetForm()
      loadPackages()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const saveOrder = async (orderId: string) => {
    const edit = orderEdits[orderId]
    if (!edit) return
    try {
      const res = await fetch(`/api/admin/advertising/orders/${orderId}`, {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          status: edit.status,
          admin_notes: edit.admin_notes,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed")
      if (data.commission_credited > 0) {
        toast.success(`Order updated — agent credited ₵${Number(data.commission_credited).toFixed(2)}`)
      } else {
        toast.success("Order updated")
      }
      loadOrders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#0E8F3D] to-[#35B24A] text-white p-6 shadow-md">
        <div className="flex items-center gap-3">
          <Megaphone className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
              Advertising marketplace
            </h1>
            <p className="text-sm text-white/90 mt-1">
              Manage media packages for agent storefronts. Mark orders completed to credit agent commission.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="packages">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit package" : "Create package"}</CardTitle>
              <CardDescription>Radio, TV, outdoor, and other media partner offerings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Station / media house *</Label>
                  <Input
                    className="mt-1"
                    value={form.station_name}
                    onChange={(e) => setForm((f) => ({ ...f, station_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Media type *</Label>
                  <Select
                    value={form.media_type}
                    onValueChange={(v) => setForm((f) => ({ ...f, media_type: v as AdMediaType }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AD_MEDIA_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {AD_MEDIA_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Package name *</Label>
                  <Input
                    className="mt-1"
                    value={form.package_name}
                    onChange={(e) => setForm((f) => ({ ...f, package_name: e.target.value }))}
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
                  <Label>Number of spots</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    value={form.number_of_spots}
                    onChange={(e) => setForm((f) => ({ ...f, number_of_spots: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Spot duration</Label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. 30 seconds"
                    value={form.spot_duration}
                    onChange={(e) => setForm((f) => ({ ...f, spot_duration: e.target.value }))}
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
                <div className="flex items-center gap-3 sm:col-span-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                  />
                  <Label>Active (visible to agents when enabled on their store)</Label>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label className="text-base font-semibold">Custom fields</Label>
                <p className="text-xs text-muted-foreground">
                  Add key-value details shown as feature tags (e.g. Prime Time Only → Yes)
                </p>
                {form.customRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={row.key}
                        onChange={(e) => {
                          const customRows = [...form.customRows]
                          customRows[i] = { ...customRows[i], key: e.target.value }
                          setForm((f) => ({ ...f, customRows }))
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Value</Label>
                      <Input
                        value={row.value}
                        onChange={(e) => {
                          const customRows = [...form.customRows]
                          customRows[i] = { ...customRows[i], value: e.target.value }
                          setForm((f) => ({ ...f, customRows }))
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={form.customRows.length <= 1}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          customRows: f.customRows.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      customRows: [...f.customRows, { key: "", value: "" }],
                    }))
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add field
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  className="bg-[#0E8F3D] hover:bg-[#0A5C2A]"
                  onClick={savePackage}
                  disabled={saving}
                >
                  {saving ? "Saving…" : editingId ? "Update package" : "Create package"}
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
              <CardTitle>Packages</CardTitle>
              <Button variant="outline" size="sm" onClick={loadPackages}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPackages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : packages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No packages yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Station</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell>{pkg.station_name}</TableCell>
                          <TableCell>{AD_MEDIA_LABELS[pkg.media_type]}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{pkg.package_name}</TableCell>
                          <TableCell>₵{pkg.price.toFixed(2)}</TableCell>
                          <TableCell>₵{pkg.agent_commission.toFixed(2)}</TableCell>
                          <TableCell>
                            <Switch checked={pkg.is_active} onCheckedChange={() => toggleActive(pkg)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEdit(pkg)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeletePkg(pkg)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
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
                <CardTitle>Ad orders</CardTitle>
                <CardDescription>Customer bookings via agent storefronts</CardDescription>
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
                        <p className="text-sm">
                          <span className="font-medium">{o.ad_packages?.package_name || "Package"}</span>
                          {o.ad_packages?.station_name && (
                            <span className="text-muted-foreground"> · {o.ad_packages.station_name}</span>
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
                        {o.ad_message && (
                          <p className="text-xs bg-slate-50 p-2 rounded border line-clamp-3">{o.ad_message}</p>
                        )}
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Status</Label>
                            <Select
                              value={edit.status}
                              onValueChange={(v) =>
                                setOrderEdits((prev) => ({
                                  ...prev,
                                  [o.id]: { ...edit, status: v as AdOrderStatus },
                                }))
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AD_ORDER_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {AD_ORDER_STATUS_LABELS[s]}
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
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{new Date(o.created_at).toLocaleString()}</span>
                          {o.paystack_reference && (
                            <span className="font-mono">{o.paystack_reference}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#0E8F3D] hover:bg-[#0A5C2A]"
                          onClick={() => saveOrder(o.id)}
                        >
                          Save order
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

      <AlertDialog open={!!deletePkg} onOpenChange={(open) => !open && setDeletePkg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete package?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deletePkg?.package_name}&quot;. Existing orders are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default memo(AdvertisingAdminTab)
