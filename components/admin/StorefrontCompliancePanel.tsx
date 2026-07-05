"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAdminAuthHeaders } from "@/lib/api-client"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Download, FileText, Search, Trash2 } from "lucide-react"

type Submission = {
  id: string
  agent_id: string
  form_type: string
  customer_data: Record<string, string>
  status: string
  created_at: string
  agent?: { full_name: string; phone_number: string } | null
}

function escapeCsv(value: string | number) {
  const s = String(value ?? "")
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function customerName(data: Record<string, string>): string {
  return data.full_name || data.customer_name || data.name || "—"
}

function customerPhone(data: Record<string, string>): string {
  return data.contact_number || data.phone || data.phone_number || "—"
}

function statusLabel(status: string): string {
  if (status === "canceled") return "Cancelled"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function StorefrontCompliancePanel() {
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteRow, setConfirmDeleteRow] = useState<Submission | null>(null)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        status,
        page: String(page),
        limit: "20",
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      })
      const res = await fetch(`/api/admin/storefront/compliance?${q}`, {
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.submissions || [])
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [status, page, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch("/api/admin/storefront/compliance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(`Marked as ${statusLabel(newStatus)}`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteSubmission = async (row: Submission) => {
    setDeletingId(row.id)
    try {
      const res = await fetch(`/api/admin/storefront/compliance?id=${encodeURIComponent(row.id)}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed")
      toast.success("Compliance submission deleted")
      setConfirmDeleteRow(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const downloadCsv = async () => {
    setExportingCsv(true)
    try {
      const all: Submission[] = []
      let p = 1
      let pages = 1
      while (p <= pages) {
        const q = new URLSearchParams({
          status,
          page: String(p),
          limit: "100",
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        })
        const res = await fetch(`/api/admin/storefront/compliance?${q}`, {
          headers: getAdminAuthHeaders(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        all.push(...(data.submissions || []))
        pages = data.totalPages || 1
        p += 1
      }

      const header = ["Agent", "Form Type", "Customer Name", "Phone", "Status", "Date"]
      const csvRows = all.map((row) => [
        row.agent?.full_name || row.agent_id,
        row.form_type,
        customerName(row.customer_data),
        customerPhone(row.customer_data),
        statusLabel(row.status),
        new Date(row.created_at).toISOString(),
      ])
      const csv = [header, ...csvRows].map((r) => r.map(escapeCsv).join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `storefront-compliance-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${all.length} submission(s)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "CSV export failed")
    } finally {
      setExportingCsv(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadOfficialPdf = async (row: Submission) => {
    setDownloadingPdfId(row.id)
    try {
      const res = await fetch("/api/admin/compliance/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ submissionId: row.id, source: "storefront" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Official PDF generation failed")
      }
      const blob = await res.blob()
      const safeName = `${row.form_type}_${customerName(row.customer_data)}`.replace(/[^a-z0-9]+/gi, "_")
      downloadBlob(blob, `Form_A_${safeName}.pdf`)
      const sizeHeader = Number(res.headers.get("X-PDF-Size-Bytes") || 0)
      if (sizeHeader > 2 * 1024 * 1024) {
        toast.warning("PDF downloaded, but uploaded images kept it above 2MB.")
      } else {
        toast.success("Official Form A PDF downloaded")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF download failed")
    } finally {
      setDownloadingPdfId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search agent name or form type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => void downloadCsv()} disabled={exportingCsv || loading}>
            <Download className={`h-4 w-4 mr-2 ${exportingCsv ? "animate-pulse" : ""}`} />
            Download CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading compliance submissions…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {debouncedSearch || status !== "all"
            ? "No submissions match your filters."
            : "No compliance submissions yet."}
        </p>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Form Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="font-medium">{row.agent?.full_name || row.agent_id}</span>
                    </TableCell>
                    <TableCell>{row.form_type}</TableCell>
                    <TableCell>{customerName(row.customer_data)}</TableCell>
                    <TableCell>{customerPhone(row.customer_data)}</TableCell>
                    <TableCell>
                      <Select
                        value={row.status}
                        onValueChange={(v) => updateStatus(row.id, v)}
                        disabled={updatingId === row.id}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingPdfId === row.id}
                          onClick={() => void downloadOfficialPdf(row)}
                        >
                          <FileText className={`h-4 w-4 mr-1 ${downloadingPdfId === row.id ? "animate-pulse" : ""}`} />
                          Official PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={deletingId === row.id || updatingId === row.id}
                          onClick={() => setConfirmDeleteRow(row)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium">{row.agent?.full_name || row.agent_id}</p>
                    <p className="text-xs text-muted-foreground">{row.form_type}</p>
                  </div>
                  <Badge variant="outline">{statusLabel(row.status)}</Badge>
                </div>
                <p className="text-sm">{customerName(row.customer_data)}</p>
                <p className="text-sm text-muted-foreground">{customerPhone(row.customer_data)}</p>
                <Select
                  value={row.status}
                  onValueChange={(v) => updateStatus(row.id, v)}
                  disabled={updatingId === row.id}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={downloadingPdfId === row.id}
                  onClick={() => void downloadOfficialPdf(row)}
                >
                  <FileText className={`h-4 w-4 mr-1 ${downloadingPdfId === row.id ? "animate-pulse" : ""}`} />
                  Download official PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  disabled={deletingId === row.id || updatingId === row.id}
                  onClick={() => setConfirmDeleteRow(row)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete submission
                </Button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm self-center">
                Page {page} / {totalPages}
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
        </>
      )}

      <AlertDialog open={!!confirmDeleteRow} onOpenChange={(open) => !open && setConfirmDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete compliance submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the{" "}
              <strong>{confirmDeleteRow?.form_type || "compliance"}</strong> submission for{" "}
              <strong>{confirmDeleteRow?.agent?.full_name || confirmDeleteRow?.agent_id}</strong>. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId === confirmDeleteRow?.id}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deletingId === confirmDeleteRow?.id}
              onClick={() => confirmDeleteRow && void deleteSubmission(confirmDeleteRow)}
            >
              {deletingId === confirmDeleteRow?.id ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
