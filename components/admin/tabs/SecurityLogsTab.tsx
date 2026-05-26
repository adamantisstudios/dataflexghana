"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Loader2, RefreshCw, Shield, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"

type SecurityLogRow = {
  id: string
  actor_id: string | null
  actor_type: string
  action: string
  severity: string
  target_table: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

function severityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return <Badge className="bg-red-600 text-white border-0">Critical</Badge>
    case "warning":
      return <Badge className="bg-amber-500 text-white border-0">Warning</Badge>
    default:
      return <Badge variant="secondary">Info</Badge>
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GH", {
      dateStyle: "short",
      timeStyle: "medium",
    })
  } catch {
    return iso
  }
}

export default function SecurityLogsTab() {
  const [logs, setLogs] = useState<SecurityLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [severity, setSeverity] = useState("all")
  const [actionSearch, setActionSearch] = useState("")
  const [debouncedAction, setDebouncedAction] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedAction(actionSearch)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [actionSearch])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: "10",
        severity,
      })
      if (debouncedAction) q.set("action", debouncedAction)
      if (fromDate) q.set("from", new Date(fromDate).toISOString())
      if (toDate) {
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        q.set("to", end.toISOString())
      }

      const res = await fetch(`/api/admin/security-logs?${q}`, {
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load logs")
      setLogs(data.logs || [])
      setTotalPages(data.totalPages ?? 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load security logs")
    } finally {
      setLoading(false)
    }
  }, [page, severity, debouncedAction, fromDate, toDate])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  useEffect(() => {
    const interval = setInterval(() => void loadLogs(), 30_000)
    return () => clearInterval(interval)
  }, [loadLogs])

  return (
    <Card className="border-blue-200 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          Security Log
        </CardTitle>
        <CardDescription>
          Audit trail for logins, withdrawals, rate limits, and other security-sensitive events. Refreshes
          every 30 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Severity</Label>
            <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1) }}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[160px]">
            <Label className="text-xs">Action search</Label>
            <Input
              placeholder="e.g. failed_login"
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
              className="h-9 w-[140px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1) }}
              className="h-9 w-[140px]"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadLogs()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">No security events match your filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <TableRow className="align-top">
                      <TableCell>
                        {log.details ? (
                          <button
                            type="button"
                            className="p-1"
                            onClick={() =>
                              setExpandedId(expandedId === log.id ? null : log.id)
                            }
                            aria-label="Toggle details"
                          >
                            {expandedId === log.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatTime(log.created_at)}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[180px] truncate">
                        {log.action}
                      </TableCell>
                      <TableCell>{severityBadge(log.severity)}</TableCell>
                      <TableCell className="text-xs">
                        <span className="text-muted-foreground">{log.actor_type}</span>
                        {log.actor_id ? (
                          <span className="block truncate max-w-[120px]" title={log.actor_id}>
                            {log.actor_id.slice(0, 8)}…
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.ip_address || "—"}
                      </TableCell>
                    </TableRow>
                    {expandedId === log.id && log.details && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-slate-50">
                          <pre className="text-[10px] sm:text-xs overflow-x-auto p-2 rounded border bg-white max-h-48">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  )
}
