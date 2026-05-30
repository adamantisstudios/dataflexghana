"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAdminAuthHeaders } from "@/lib/api-client"
import type { SessionEnrichment } from "@/lib/security-enrichment"
import {
  Loader2,
  Download,
  RefreshCw,
  Shield,
  AlertTriangle,
  Info,
  Eye,
  Globe,
} from "lucide-react"
import { toast } from "sonner"

type SecurityLogRow = {
  id: string
  actor_id: string | null
  actor_type: string
  action: string
  severity: string
  target_table: string | null
  target_id: string | null
  session: SessionEnrichment | null
  details: Record<string, unknown> | null
  ip_masked: string | null
  created_at: string
}

const COUNTRY_FLAGS: Record<string, string> = {
  Ghana: "🇬🇭",
  Nigeria: "🇳🇬",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Canada: "🇨🇦",
  Germany: "🇩🇪",
  France: "🇫🇷",
  India: "🇮🇳",
  China: "🇨🇳",
  Local: "🏠",
}

function countryFlag(country: string | undefined): string {
  if (!country) return "🌐"
  return COUNTRY_FLAGS[country] ?? "🌐"
}

function severityBadge(severity: string, compact = false) {
  switch (severity) {
    case "critical":
      return (
        <Badge className="bg-red-600 text-white border-0 gap-1 min-h-[28px]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {!compact && "Critical"}
        </Badge>
      )
    case "warning":
      return (
        <Badge className="bg-amber-500 text-white border-0 gap-1 min-h-[28px]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {!compact && "Warning"}
        </Badge>
      )
    default:
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 min-h-[28px]">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {!compact && "Info"}
        </Badge>
      )
  }
}

function shortAction(action: string): string {
  if (action.length <= 28) return action
  return `${action.slice(0, 26)}…`
}

function formatTime(iso: string, relative = false) {
  try {
    const d = new Date(iso)
    if (relative) {
      return formatDistanceToNow(d, { addSuffix: true })
    }
    return d.toLocaleString("en-GH", { dateStyle: "short", timeStyle: "short" })
  } catch {
    return iso
  }
}

function csvEscape(val: string): string {
  if (val.includes('"') || val.includes(",") || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function downloadCsvBlob(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function sessionFromLog(log: SecurityLogRow): SessionEnrichment | null {
  if (log.session && typeof log.session === "object") {
    return log.session as SessionEnrichment
  }
  const d = log.details as { session?: SessionEnrichment } | null
  return d?.session ?? null
}

function LogDetailContent({ log }: { log: SecurityLogRow }) {
  const session = sessionFromLog(log)

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
        <p className="font-semibold text-emerald-900 flex items-center gap-2">
          <Globe className="h-4 w-4" /> Session intelligence
        </p>
        {session ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-800">
            <div>
              <dt className="text-xs text-muted-foreground">Country</dt>
              <dd className="font-medium">
                {countryFlag(session.country)} {session.country}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">City</dt>
              <dd>{session.city}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">ISP</dt>
              <dd>{session.isp}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Device</dt>
              <dd>{session.device}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Browser</dt>
              <dd>{session.browser}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">OS</dt>
              <dd>{session.os}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">VPN / Proxy</dt>
              <dd>
                {session.proxy ? (
                  <Badge className="bg-red-600 text-white">Proxy / VPN detected</Badge>
                ) : (
                  <Badge variant="secondary">No proxy detected</Badge>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground text-xs">No session enrichment for this event.</p>
        )}
        {log.ip_masked && (
          <p className="text-xs text-muted-foreground">Masked IP: {log.ip_masked}</p>
        )}
      </div>

      <div className="rounded-xl border bg-white p-3 space-y-2 shadow-sm">
        <p className="font-semibold text-gray-900">Event</p>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Action</dt>
            <dd className="font-mono break-all">{log.action}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Severity</dt>
            <dd>{log.severity}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Actor</dt>
            <dd>
              {log.actor_type}
              {log.actor_id ? ` · ${log.actor_id}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time</dt>
            <dd>{formatTime(log.created_at)}</dd>
          </div>
          {log.target_table && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Target</dt>
              <dd>
                {log.target_table}
                {log.target_id ? ` / ${log.target_id}` : ""}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {log.details && Object.keys(log.details).length > 0 && (
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Additional details</p>
          <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap break-words max-h-40">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
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
  const [detailLog, setDetailLog] = useState<SecurityLogRow | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedAction(actionSearch)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [actionSearch])

  const buildQuery = useCallback(
    (pageNum: number, limit: number) => {
      const q = new URLSearchParams({
        page: String(pageNum),
        limit: String(limit),
        severity,
      })
      if (debouncedAction) q.set("action", debouncedAction)
      if (fromDate) q.set("from", new Date(fromDate).toISOString())
      if (toDate) {
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        q.set("to", end.toISOString())
      }
      return q
    },
    [severity, debouncedAction, fromDate, toDate],
  )

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/security-logs?${buildQuery(page, 10)}`, {
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
  }, [page, buildQuery])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  useEffect(() => {
    const interval = setInterval(() => void loadLogs(), 30_000)
    return () => clearInterval(interval)
  }, [loadLogs])

  const fetchAllFiltered = async (): Promise<SecurityLogRow[]> => {
    const collected: SecurityLogRow[] = []
    let pageNum = 1
    let total = 1
    while (pageNum <= total) {
      const res = await fetch(`/api/admin/security-logs?${buildQuery(pageNum, 50)}`, {
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Export failed")
      collected.push(...(data.logs || []))
      total = data.totalPages ?? 1
      pageNum += 1
    }
    return collected
  }

  const downloadFilteredLogs = async () => {
    setExporting(true)
    try {
      const collected = await fetchAllFiltered()
      if (collected.length === 0) {
        toast.message("No logs match the current filters")
        return
      }

      const headers = [
        "Date",
        "Action",
        "Severity",
        "Actor Type",
        "Actor ID",
        "Country",
        "City",
        "ISP",
        "Device",
        "Browser",
        "OS",
        "VPN/Proxy",
        "Masked IP",
        "Details",
      ]

      const rows = collected.map((log) => {
        const s = sessionFromLog(log)
        return [
          formatTime(log.created_at),
          log.action,
          log.severity,
          log.actor_type,
          log.actor_id ?? "",
          s?.country ?? "",
          s?.city ?? "",
          s?.isp ?? "",
          s?.device ?? "",
          s?.browser ?? "",
          s?.os ?? "",
          s?.proxy ? "Yes" : "No",
          log.ip_masked ?? "",
          log.details ? JSON.stringify(log.details) : "",
        ]
      })

      downloadCsvBlob(
        `security-report-${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        rows,
      )
      toast.success(`Downloaded ${collected.length} log entries`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="border-emerald-200/80 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100">
        <CardTitle className="flex items-center gap-2 text-lg text-emerald-900">
          <Shield className="h-5 w-5 text-emerald-600" />
          Security Log
        </CardTitle>
        <CardDescription>
          Session intelligence for logins, withdrawals, rate limits, and critical events. Auto-refreshes
          every 30 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs font-medium">Severity</Label>
            <Select
              value={severity}
              onValueChange={(v) => {
                setSeverity(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] min-h-[44px]">
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
          <div className="space-y-1.5 flex-1 min-w-0 w-full">
            <Label className="text-xs font-medium">Action search</Label>
            <Input
              placeholder="e.g. failed_login"
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="min-h-[44px] w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:contents">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setPage(1)
                }}
                className="min-h-[44px] w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setPage(1)
                }}
                className="min-h-[44px] w-full"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
            <Button
              variant="outline"
              className="min-h-[44px] w-full sm:w-auto border-emerald-200"
              onClick={() => void loadLogs()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              className="min-h-[44px] w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={exporting || loading}
              onClick={() => void downloadFilteredLogs()}
            >
              <Download className={`h-4 w-4 mr-2 ${exporting ? "animate-pulse" : ""}`} />
              Download Report
            </Button>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">
            No security events match your filters.
          </p>
        ) : (
          <>
            {/* Mobile list — no horizontal scroll */}
            <div className="md:hidden space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm flex items-center gap-2"
                >
                  <div className="shrink-0 w-[72px]">{severityBadge(log.severity, true)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={log.action}>
                      {shortAction(log.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(log.created_at, true)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-11 w-11 min-h-[44px] min-w-[44px] border-emerald-200"
                    aria-label="View details"
                    onClick={() => setDetailLog(log)}
                  >
                    <Eye className="h-5 w-5 text-emerald-700" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-emerald-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-emerald-50/80 text-left">
                  <tr>
                    <th className="px-3 py-3 font-medium text-emerald-900 w-[100px]">Severity</th>
                    <th className="px-3 py-3 font-medium text-emerald-900">Action</th>
                    <th className="px-3 py-3 font-medium text-emerald-900 w-[140px]">Time</th>
                    <th className="px-3 py-3 font-medium text-emerald-900">Country</th>
                    <th className="px-3 py-3 font-medium text-emerald-900">Device / Browser</th>
                    <th className="px-3 py-3 font-medium text-emerald-900 w-[90px]">VPN</th>
                    <th className="px-3 py-3 font-medium text-emerald-900 w-[52px]" />
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const session = sessionFromLog(log)
                    return (
                      <tr key={log.id} className="border-t border-emerald-50 hover:bg-emerald-50/30">
                        <td className="px-3 py-3 align-top">{severityBadge(log.severity)}</td>
                        <td className="px-3 py-3 align-top font-mono text-xs">{log.action}</td>
                        <td className="px-3 py-3 align-top text-xs whitespace-nowrap text-muted-foreground">
                          {formatTime(log.created_at)}
                        </td>
                        <td className="px-3 py-3 align-top text-xs">
                          {session ? (
                            <span>
                              {countryFlag(session.country)} {session.country}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                          {session ? (
                            <>
                              <span className="block">{session.device}</span>
                              <span className="block truncate max-w-[200px]">{session.browser}</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          {session?.proxy ? (
                            <Badge className="bg-red-600 text-white text-[10px]">VPN</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11"
                            aria-label="View details"
                            onClick={() => setDetailLog(log)}
                          >
                            <Eye className="h-4 w-4 text-emerald-700" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[100px]"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[100px]"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={!!detailLog} onOpenChange={(open) => !open && setDetailLog(null)}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-900">
              <Shield className="h-5 w-5" />
              Security event details
            </DialogTitle>
          </DialogHeader>
          {detailLog && <LogDetailContent log={detailLog} />}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
