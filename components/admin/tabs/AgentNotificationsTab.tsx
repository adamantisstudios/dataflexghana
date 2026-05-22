"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Bell, Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { AdminAgentSearchField } from "@/components/admin/AdminAgentSearchField"
import { fetchAdminAgentById, type AdminAgentSearchResult } from "@/lib/admin-agent-search"

type Frequency = "once_per_day" | "once_per_session" | "always"

interface NotificationRow {
  id: string
  title: string
  message: string
  start_date: string
  end_date: string
  frequency: Frequency
  template_name: string | null
  is_active: boolean
  target_agent_id?: string | null
  created_at: string
  updated_at: string
}

const emptyForm = {
  title: "",
  message: "",
  start_date: "",
  end_date: "",
  frequency: "once_per_day" as Frequency,
  template_name: "",
  is_active: true,
}

function adminHeaders(): HeadersInit {
  return getAdminAuthHeaders()
}

function getStatus(row: NotificationRow): string {
  const now = new Date()
  if (!row.is_active) return "inactive"
  if (now < new Date(row.start_date)) return "scheduled"
  if (now > new Date(row.end_date)) return "expired"
  return "active"
}

export default function AgentNotificationsTab() {
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NotificationRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [targetAgent, setTargetAgent] = useState<AdminAgentSearchResult | null>(null)
  const [agentNameById, setAgentNameById] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/agent-notifications", { headers: adminHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setRows(data.data || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const ids = [
      ...new Set(
        rows.map((r) => r.target_agent_id).filter((id): id is string => Boolean(id)),
      ),
    ]
    if (ids.length === 0) return

    let cancelled = false

    setAgentNameById((prev) => {
      const missing = ids.filter((id) => !prev[id])
      if (missing.length === 0) return prev

      void (async () => {
        const entries = await Promise.all(
          missing.map(async (id) => {
            const agent = await fetchAdminAgentById(id)
            return [id, agent?.full_name || id.slice(0, 8) + "…"] as const
          }),
        )
        if (cancelled) return
        setAgentNameById((current) => {
          const next = { ...current }
          for (const [id, name] of entries) next[id] = name
          return next
        })
      })()

      return prev
    })

    return () => {
      cancelled = true
    }
  }, [rows])

  const openCreate = () => {
    setEditing(null)
    setTargetAgent(null)
    const now = new Date()
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    setForm({
      ...emptyForm,
      start_date: now.toISOString().slice(0, 16),
      end_date: week.toISOString().slice(0, 16),
    })
    setDialogOpen(true)
  }

  const openEdit = async (row: NotificationRow) => {
    setEditing(row)
    setForm({
      title: row.title,
      message: row.message,
      start_date: row.start_date.slice(0, 16),
      end_date: row.end_date.slice(0, 16),
      frequency: row.frequency,
      template_name: row.template_name || "",
      is_active: row.is_active,
    })
    if (row.target_agent_id) {
      const agent = await fetchAdminAgentById(row.target_agent_id)
      setTargetAgent(agent)
      if (agent) {
        setAgentNameById((prev) => ({ ...prev, [agent.id]: agent.full_name }))
      }
    } else {
      setTargetAgent(null)
    }
    setDialogOpen(true)
  }

  const applyTemplate = (name: string) => {
    const t = rows.find((r) => r.template_name === name)
    if (!t) return
    setForm((f) => ({
      ...f,
      title: t.title,
      message: t.message,
      frequency: t.frequency,
      template_name: name,
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required")
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        template_name: form.template_name.trim() || null,
        target_agent_id: targetAgent?.id || null,
      }
      const res = await fetch("/api/admin/agent-notifications", {
        method: editing ? "PUT" : "POST",
        headers: adminHeaders(),
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      if (targetAgent) {
        setAgentNameById((prev) => ({ ...prev, [targetAgent.id]: targetAgent.full_name }))
      }
      toast.success(editing ? "Notification updated" : "Notification created")
      setDialogOpen(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification?")) return
    try {
      const res = await fetch(`/api/admin/agent-notifications?id=${id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast.success("Deleted")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const templates = [...new Set(rows.map((r) => r.template_name).filter(Boolean))] as string[]

  const displayAgentName = (id: string | null | undefined) =>
    id ? agentNameById[id] || id.slice(0, 8) + "…" : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Agent Notifications
          </h2>
          <p className="text-muted-foreground text-sm">
            Broadcast slide-down messages on the agent dashboard with schedule and frequency controls.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New notification
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold">{row.title}</span>
                      <Badge variant="outline">{getStatus(row)}</Badge>
                      <Badge variant="secondary">{row.frequency.replace(/_/g, " ")}</Badge>
                      {row.template_name && (
                        <Badge className="bg-purple-100 text-purple-800">Template: {row.template_name}</Badge>
                      )}
                      {row.target_agent_id ? (
                        <Badge className="bg-amber-100 text-amber-900">
                          Target: {displayAgentName(row.target_agent_id)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">All agents</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{row.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(row.start_date).toLocaleString()} → {new Date(row.end_date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit notification" : "Create notification"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {templates.length > 0 && !editing && (
              <div>
                <Label>Load from template</Label>
                <Select onValueChange={applyTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Template name (optional)</Label>
              <Input
                value={form.template_name}
                onChange={(e) => setForm({ ...form, template_name: e.target.value })}
                placeholder="e.g. Weekly promo"
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="URLs in the message will appear as clickable links for agents."
              />
            </div>

            <AdminAgentSearchField
              selected={targetAgent}
              onSelect={(agent) => {
                setTargetAgent(agent)
                if (agent) {
                  setAgentNameById((prev) => ({ ...prev, [agent.id]: agent.full_name }))
                }
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v as Frequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once_per_day">Once per day</SelectItem>
                  <SelectItem value="once_per_session">Once per session</SelectItem>
                  <SelectItem value="always">Every visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
