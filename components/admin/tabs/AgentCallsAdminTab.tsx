"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import { Loader2, Phone, RefreshCw, Trash2 } from "lucide-react"
import type { Agent } from "@/lib/supabase"

const CALL_STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "no_answer", label: "No Answer" },
  { value: "voicemail", label: "Voicemail" },
  { value: "scheduled", label: "Scheduled" },
] as const

type CallLog = {
  id: string
  agent_id: string
  agent_name: string
  agent_phone: string
  call_date: string
  call_duration_minutes: number | null
  discussion_notes: string | null
  follow_up_required: boolean
  follow_up_date: string | null
  call_status: string
  created_at: string
}

function toLocalDatetimeInput(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AgentCallsAdminTab() {
  const searchParams = useSearchParams()
  const presetAgentId = searchParams.get("agent_id") || ""

  const [logs, setLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [followUpFilter, setFollowUpFilter] = useState(false)
  const [selected, setSelected] = useState<CallLog | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [agentSearch, setAgentSearch] = useState("")
  const [agentOptions, setAgentOptions] = useState<Agent[]>([])
  const [agentPickerLoading, setAgentPickerLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const [form, setForm] = useState({
    call_date: toLocalDatetimeInput(),
    call_duration_minutes: "",
    call_status: "completed",
    discussion_notes: "",
    follow_up_required: false,
    follow_up_date: "",
  })

  const loadAgents = useCallback(async (term: string) => {
    setAgentPickerLoading(true)
    try {
      const params = new URLSearchParams({ limit: "30" })
      if (term.trim().length >= 4) params.set("search", term.trim())
      const res = await fetch(`/api/admin/agents/list?${params}`, { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAgentOptions(data.agents || [])
    } catch {
      setAgentOptions([])
    } finally {
      setAgentPickerLoading(false)
    }
  }, [])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (search.trim().length >= 2) params.set("search", search.trim())
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (followUpFilter) params.set("follow_up", "true")
      if (presetAgentId) params.set("agent_id", presetAgentId)

      const res = await fetch(`/api/admin/agent-calls?${params}`, { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLogs(data.logs || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load calls")
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, followUpFilter, presetAgentId])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    loadAgents("")
  }, [loadAgents])

  useEffect(() => {
    if (!presetAgentId) return
    const pick = async () => {
      const res = await fetch(`/api/admin/agents/list?id=${encodeURIComponent(presetAgentId)}`, {
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (res.ok && data.agents?.[0]) {
        setSelectedAgent(data.agents[0])
        setAgentSearch(data.agents[0].full_name)
      }
    }
    pick()
  }, [presetAgentId])

  useEffect(() => {
    const t = setTimeout(() => loadAgents(agentSearch), 300)
    return () => clearTimeout(t)
  }, [agentSearch, loadAgents])

  const statusLabel = useMemo(() => {
    const map = Object.fromEntries(CALL_STATUSES.map((s) => [s.value, s.label]))
    return (v: string) => map[v] || v
  }, [])

  const submitCall = async () => {
    if (!selectedAgent?.id) {
      toast.error("Select an agent")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/agent-calls", {
        method: "POST",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          call_date: new Date(form.call_date).toISOString(),
          call_duration_minutes: form.call_duration_minutes || null,
          call_status: form.call_status,
          discussion_notes: form.discussion_notes,
          follow_up_required: form.follow_up_required,
          follow_up_date: form.follow_up_required ? form.follow_up_date : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Call logged")
      setForm({
        call_date: toLocalDatetimeInput(),
        call_duration_minutes: "",
        call_status: "completed",
        discussion_notes: "",
        follow_up_required: false,
        follow_up_date: "",
      })
      loadLogs()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const deleteLog = async (id: string) => {
    if (!confirm("Delete this call log?")) return
    try {
      const res = await fetch(`/api/admin/agent-calls/${id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Deleted")
      setSheetOpen(false)
      setSelected(null)
      loadLogs()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const truncate = (s: string | null, n = 80) => {
    if (!s) return "—"
    return s.length > n ? `${s.slice(0, n)}…` : s
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="h-5 w-5 text-blue-600" /> Agent Calls CRM
        </h2>
        <Link href="/admin/agent-calls">
          <Button variant="outline" size="sm" className="text-xs">
            Full page
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log a new call</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Agent *</Label>
            <Input
              placeholder="Search name or phone (4+ chars)…"
              value={agentSearch}
              onChange={(e) => {
                setAgentSearch(e.target.value)
                setSelectedAgent(null)
              }}
            />
            {agentPickerLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {agentOptions.length > 0 && !selectedAgent && (
              <ul className="border rounded-lg max-h-40 overflow-y-auto text-sm divide-y">
                {agentOptions.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      onClick={() => {
                        setSelectedAgent(a)
                        setAgentSearch(a.full_name)
                        setAgentOptions([])
                      }}
                    >
                      {a.full_name} — {a.phone_number}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedAgent && (
              <p className="text-sm text-emerald-700">
                Selected: <strong>{selectedAgent.full_name}</strong> ({selectedAgent.phone_number})
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Call date</Label>
              <Input
                type="datetime-local"
                value={form.call_date}
                onChange={(e) => setForm((f) => ({ ...f, call_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={0}
                placeholder="Optional"
                value={form.call_duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, call_duration_minutes: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.call_status} onValueChange={(v) => setForm((f) => ({ ...f, call_status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="fu"
                  checked={form.follow_up_required}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, follow_up_required: c === true }))}
                />
                <Label htmlFor="fu" className="font-normal cursor-pointer">
                  Follow-up required
                </Label>
              </div>
            </div>
          </div>

          {form.follow_up_required && (
            <div className="space-y-2 max-w-xs">
              <Label>Follow-up date</Label>
              <Input
                type="date"
                required
                value={form.follow_up_date}
                onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Discussion notes</Label>
            <Textarea
              rows={4}
              value={form.discussion_notes}
              onChange={(e) => setForm((f) => ({ ...f, discussion_notes: e.target.value }))}
              placeholder="Summary of the conversation…"
            />
          </div>

          <Button onClick={submitCall} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save call log
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base">Call history</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              className="h-9 w-full sm:w-48"
              placeholder="Search agent…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadLogs()}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CALL_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={followUpFilter ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setFollowUpFilter((v) => !v)}
            >
              Follow-up only
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={loadLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No call logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Agent</th>
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setSelected(log)
                        setSheetOpen(true)
                      }}
                    >
                      <td className="py-2 pr-3 font-medium">{log.agent_name}</td>
                      <td className="py-2 pr-3">{log.agent_phone}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(log.call_date).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{statusLabel(log.call_status)}</Badge>
                      </td>
                      <td className="py-2 pr-3 max-w-[200px]">{truncate(log.discussion_notes)}</td>
                      <td className="py-2">
                        {log.follow_up_required ? (
                          <span className="text-amber-700 text-xs">
                            Yes{log.follow_up_date ? ` · ${log.follow_up_date}` : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Call details</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Agent:</span> {selected.agent_name}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span> {selected.agent_phone}
              </p>
              <p>
                <span className="text-muted-foreground">Date:</span>{" "}
                {new Date(selected.call_date).toLocaleString()}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> {statusLabel(selected.call_status)}
              </p>
              {selected.call_duration_minutes != null && (
                <p>
                  <span className="text-muted-foreground">Duration:</span> {selected.call_duration_minutes} min
                </p>
              )}
              <div>
                <p className="text-muted-foreground mb-1">Notes</p>
                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 border p-3">
                  {selected.discussion_notes || "—"}
                </p>
              </div>
              <p>
                <span className="text-muted-foreground">Follow-up:</span>{" "}
                {selected.follow_up_required
                  ? `Yes — ${selected.follow_up_date || "date not set"}`
                  : "No"}
              </p>
              <Button variant="destructive" size="sm" onClick={() => deleteLog(selected.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete log
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
