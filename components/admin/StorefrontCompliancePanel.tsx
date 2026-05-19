"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"

type Submission = {
  id: string
  agent_id: string
  form_type: string
  customer_data: Record<string, string>
  status: string
  created_at: string
  agent?: { full_name: string; phone_number: string } | null
}

export function StorefrontCompliancePanel() {
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("pending")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ status, page: "1", limit: "30" })
      const res = await fetch(`/api/admin/storefront/compliance?${q}`, { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.submissions || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/storefront/compliance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Updated")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Storefront compliance submissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="border rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium">{row.agent?.full_name || row.agent_id}</p>
                    <p className="text-xs text-muted-foreground">{row.form_type}</p>
                  </div>
                  <Badge variant="outline">{row.status}</Badge>
                </div>
                <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(row.customer_data, null, 2)}
                </pre>
                <div className="flex gap-2 flex-wrap">
                  {["processing", "completed", "rejected"].map((s) => (
                    <Button key={s} size="sm" variant="outline" onClick={() => updateStatus(row.id, s)}>
                      Mark {s}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
