"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { downloadCsv } from "@/lib/download-csv"
import { Loader2, Download, TrendingUp, Eye, Users, Calendar } from "lucide-react"
import { toast } from "sonner"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const BRAND = "#0E8F3D"

type AnalyticsData = {
  visitsToday: number
  visitsWeek: number
  visitsMonth: number
  peakDays: { date: string; count: number }[]
  topPaths: { path: string; count: number }[]
  topAgents: { agent_id: string; full_name: string; views_count: number }[]
  recentLogins: { id: string; full_name: string; last_login_at: string }[]
  auditLogins: { actor_id: string | null; action: string; created_at: string }[]
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load")
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="text-center text-red-600 py-12">{error || "No data"}</p>
    )
  }

  const downloadReport = () => {
    try {
      const rows: string[][] = [
        ["Visits today", String(data.visitsToday)],
        ["Visits this week", String(data.visitsWeek)],
        ["Visits this month", String(data.visitsMonth)],
        ["", ""],
        ["Peak days (date)", "Visits"],
        ...data.peakDays.map((d) => [d.date, String(d.count)]),
        ["", ""],
        ["Top pages (path)", "Views"],
        ...data.topPaths.map((r) => [r.path, String(r.count)]),
        ["", ""],
        ["Top agents (name)", "Views"],
        ...data.topAgents.map((r) => [r.full_name, String(r.views_count)]),
        ["", ""],
        ["Recent logins (agent)", "Last login"],
        ...data.recentLogins.map((a) => [
          a.full_name,
          a.last_login_at ? new Date(a.last_login_at).toISOString() : "",
        ]),
      ]
      downloadCsv(
        `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Metric", "Value"],
        rows,
      )
      toast.success("Analytics report downloaded")
    } catch {
      toast.error("Could not export report")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={downloadReport} className="text-gray-900">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" style={{ color: BRAND }} />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: BRAND }}>
              {data.visitsToday.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: BRAND }} />
              This week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: BRAND }}>
              {data.visitsWeek.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: BRAND }} />
              This month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: BRAND }}>
              {data.visitsMonth.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.peakDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peak visit days (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...data.peakDays].reverse()}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most visited pages</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPaths.length === 0 ? (
              <p className="text-sm text-muted-foreground">No page views yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.topPaths.map((row) => (
                  <li
                    key={row.path}
                    className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0"
                  >
                    <span className="font-mono text-xs truncate">{row.path}</span>
                    <span className="font-semibold shrink-0" style={{ color: BRAND }}>
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top agents by page views
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logged-in agent views tracked.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.topAgents.map((row) => (
                  <li
                    key={row.agent_id}
                    className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0"
                  >
                    <span className="truncate">{row.full_name}</span>
                    <span className="font-semibold shrink-0" style={{ color: BRAND }}>
                      {row.views_count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent agent logins</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 pr-4">Agent</th>
                <th className="pb-2">Last login</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLogins.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4">{a.full_name}</td>
                  <td className="py-2 text-muted-foreground">
                    {a.last_login_at
                      ? new Date(a.last_login_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
