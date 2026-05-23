"use client"

import { useState, useEffect, useCallback, memo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getAdminAuthHeaders } from "@/lib/api-client"
import {
  GROCERY_STATUSES,
  GROCERY_STATUS_LABELS,
  type GroceryRequest,
  type GroceryRequestStatus,
} from "@/lib/grocery-types"
import { toast } from "sonner"
import {
  Search,
  RefreshCw,
  Loader2,
  ExternalLink,
  Phone,
  MapPin,
  ShoppingBasket,
  Ban,
  ShieldOff,
  Trash2,
} from "lucide-react"

function statusBadgeClass(status: GroceryRequestStatus): string {
  switch (status) {
    case "new_request":
      return "bg-amber-100 text-amber-900"
    case "delivered":
      return "bg-green-100 text-green-800"
    case "cancelled":
      return "bg-slate-200 text-slate-700"
    case "processing":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-emerald-50 text-emerald-800"
  }
}

function GroceryRequestsTab() {
  const [requests, setRequests] = useState<GroceryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<GroceryRequest | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [blockedPhones, setBlockedPhones] = useState<{ phone: string; blocked_at: string }[]>([])
  const [loadingBlocked, setLoadingBlocked] = useState(false)
  const [unblockingPhone, setUnblockingPhone] = useState<string | null>(null)
  const [confirmDeleteRequest, setConfirmDeleteRequest] = useState<GroceryRequest | null>(null)
  const [deletingRequest, setDeletingRequest] = useState(false)
  const [edit, setEdit] = useState({
    status: "new_request" as GroceryRequestStatus,
    estimated_price: "",
    delivery_fee: "",
    admin_notes: "",
  })

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search.trim().length >= 2) params.set("search", search.trim())

      const res = await fetch(`/api/admin/grocery/requests?${params}`, {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load")

      setRequests(data.data || [])
      setTotalPages(data.pagination?.totalPages ?? 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load grocery requests")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const loadBlockedPhones = useCallback(async () => {
    setLoadingBlocked(true)
    try {
      const res = await fetch("/api/admin/grocery/block-phone", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load blocked numbers")
      setBlockedPhones(data.data || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load blocked numbers")
      setBlockedPhones([])
    } finally {
      setLoadingBlocked(false)
    }
  }, [])

  useEffect(() => {
    loadBlockedPhones()
  }, [loadBlockedPhones])

  const handleBlockPhone = async (phone: string) => {
    if (!phone.trim()) return
    if (!confirm(`Block ${phone} from placing grocery requests?`)) return
    setBlocking(true)
    try {
      const res = await fetch("/api/admin/grocery/block-phone", {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Block failed")
      toast.success("Phone number blocked")
      loadBlockedPhones()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Block failed")
    } finally {
      setBlocking(false)
    }
  }

  const handleUnblockPhone = async (phone: string) => {
    setUnblockingPhone(phone)
    try {
      const res = await fetch(
        `/api/admin/grocery/block-phone?phone=${encodeURIComponent(phone)}`,
        { method: "DELETE", headers: getAdminAuthHeaders() },
      )
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Unblock failed")
      toast.success("Phone number unblocked")
      loadBlockedPhones()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unblock failed")
    } finally {
      setUnblockingPhone(null)
    }
  }

  const openDetail = (row: GroceryRequest) => {
    setSelected(row)
    setEdit({
      status: row.status,
      estimated_price: row.estimated_price != null ? String(row.estimated_price) : "",
      delivery_fee: row.delivery_fee != null ? String(row.delivery_fee) : "",
      admin_notes: row.admin_notes || "",
    })
    setSheetOpen(true)
  }

  const handleDeleteRequest = async (row: GroceryRequest) => {
    setDeletingRequest(true)
    try {
      const res = await fetch(`/api/admin/grocery/requests/${row.id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed")
      toast.success("Grocery request deleted")
      setConfirmDeleteRequest(null)
      setSheetOpen(false)
      setSelected(null)
      loadRequests()
      window.dispatchEvent(new CustomEvent("grocery-requests-updated"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingRequest(false)
    }
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/grocery/requests/${selected.id}`, {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          status: edit.status,
          estimated_price: edit.estimated_price === "" ? null : edit.estimated_price,
          delivery_fee: edit.delivery_fee === "" ? null : edit.delivery_fee,
          admin_notes: edit.admin_notes,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed")

      toast.success("Request updated")
      setSelected(data.data)
      setSheetOpen(false)
      loadRequests()
      window.dispatchEvent(new CustomEvent("grocery-requests-updated"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-emerald-800">
            <ShoppingBasket className="h-6 w-6" />
            Grocery Requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Customer grocery orders from{" "}
            <Link href="/foodandGroceries" className="text-emerald-700 underline" target="_blank">
              /foodandGroceries
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/grocery">Full page view</Link>
          </Button>
          <Button variant="outline" onClick={loadRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name or phone…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {GROCERY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {GROCERY_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No grocery requests found.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openDetail(row)}
                  className="w-full text-left border rounded-xl p-4 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{row.full_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3.5 w-3.5" />
                        {row.phone}
                      </p>
                    </div>
                    <Badge className={statusBadgeClass(row.status)}>
                      {GROCERY_STATUS_LABELS[row.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{row.shopping_list}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(row.created_at).toLocaleString()}
                    {row.address && (
                      <span className="inline-flex items-center gap-1 ml-2">
                        <MapPin className="h-3 w-3" />
                        {row.landmark || row.address}
                      </span>
                    )}
                  </p>
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm self-center px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-600" />
            Blocked phone numbers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Numbers blocked from submitting new grocery requests via the public form.
          </p>
        </CardHeader>
        <CardContent>
          {loadingBlocked ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : blockedPhones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No blocked numbers.</p>
          ) : (
            <ul className="space-y-2">
              {blockedPhones.map((row) => (
                <li
                  key={row.phone}
                  className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="font-medium font-mono text-sm">{row.phone}</p>
                    <p className="text-xs text-muted-foreground">
                      Blocked {new Date(row.blocked_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={unblockingPhone === row.phone}
                    onClick={() => handleUnblockPhone(row.phone)}
                  >
                    {unblockingPhone === row.phone ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldOff className="h-4 w-4 mr-1" />
                        Unblock
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full"
            onClick={loadBlockedPhones}
            disabled={loadingBlocked}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingBlocked ? "animate-spin" : ""}`} />
            Refresh blocked list
          </Button>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.full_name}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Submitted {new Date(selected.created_at).toLocaleString()}
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-5 pb-8">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p className="font-medium">{selected.phone}</p>
                  </div>
                  {selected.whatsapp && (
                    <div>
                      <span className="text-muted-foreground">WhatsApp</span>
                      <p className="font-medium">{selected.whatsapp}</p>
                    </div>
                  )}
                  {selected.email && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Email</span>
                      <p className="font-medium break-all">{selected.email}</p>
                    </div>
                  )}
                </div>

                {selected.paystack_reference && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Paystack reference</span>
                    <p className="font-mono text-xs font-medium break-all">{selected.paystack_reference}</p>
                  </div>
                )}

                {(selected.address || selected.landmark) && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <p className="font-medium">{selected.address}</p>
                    {selected.landmark && <p className="text-slate-600">Landmark: {selected.landmark}</p>}
                    {selected.delivery_time && (
                      <p className="text-slate-600">Time: {selected.delivery_time}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Shopping list</Label>
                  <pre className="mt-1 text-sm whitespace-pre-wrap bg-slate-50 rounded-lg p-3 border">
                    {selected.shopping_list}
                  </pre>
                </div>

                {selected.notes && (
                  <div>
                    <Label className="text-muted-foreground">Customer notes</Label>
                    <p className="text-sm mt-1">{selected.notes}</p>
                  </div>
                )}

                {selected.attachments?.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Attachments</Label>
                    <ul className="mt-2 space-y-2">
                      {selected.attachments.map((url, i) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-700 flex items-center gap-1 hover:underline break-all"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            Attachment {i + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold">Admin actions</h3>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled={blocking}
                    onClick={() => handleBlockPhone(selected.phone)}
                  >
                    {blocking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Blocking…
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Block Number
                      </>
                    )}
                  </Button>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={edit.status}
                      onValueChange={(v) => setEdit((e) => ({ ...e, status: v as GroceryRequestStatus }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GROCERY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {GROCERY_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Estimated price (₵)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={edit.estimated_price}
                        onChange={(e) => setEdit((x) => ({ ...x, estimated_price: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery fee (₵)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={edit.delivery_fee}
                        onChange={(e) => setEdit((x) => ({ ...x, delivery_fee: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Internal admin notes</Label>
                    <Textarea
                      rows={4}
                      value={edit.admin_notes}
                      onChange={(e) => setEdit((x) => ({ ...x, admin_notes: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled={deletingRequest}
                    onClick={() => setConfirmDeleteRequest(selected)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Request
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!confirmDeleteRequest}
        onOpenChange={(open) => !open && setConfirmDeleteRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete grocery request?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Permanently delete the request from <strong>{confirmDeleteRequest?.full_name}</strong> (
                  {confirmDeleteRequest?.phone})? This cannot be undone.
                </p>
                {confirmDeleteRequest &&
                  confirmDeleteRequest.status !== "delivered" &&
                  confirmDeleteRequest.status !== "cancelled" && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                      <strong>Warning:</strong> This request is still &quot;
                      {GROCERY_STATUS_LABELS[confirmDeleteRequest.status]}&quot;. Deleting active requests may
                      affect customer follow-up.
                    </p>
                  )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingRequest}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deletingRequest}
              onClick={() => confirmDeleteRequest && void handleDeleteRequest(confirmDeleteRequest)}
            >
              {deletingRequest ? "Deleting…" : "Delete request"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default memo(GroceryRequestsTab)
