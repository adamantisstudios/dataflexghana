"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, RefreshCw, CheckCircle2, XCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { AdminAgentVerificationBadge } from "@/components/admin/AdminAgentVerificationBadge"
import {
  getPhotoVerificationStatus,
  type PhotoVerificationStatus,
} from "@/lib/photo-verification-status"

type AgentRow = {
  id: string
  full_name: string | null
  phone_number: string | null
  email: string | null
  profile_image_url: string | null
  profile_verified: boolean | null
}

type FilterKey = "all" | PhotoVerificationStatus

export default function PhotoVerificationAdminTab() {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [bulkActing, setBulkActing] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterKey>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    verified: 0,
    pending: 0,
    unverified: 0,
    total: 0,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/photo-verification", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setAgents(data.agents || [])
      setStats({
        total: data.total ?? 0,
        verified: data.verified_count ?? 0,
        pending: data.pending_count ?? 0,
        unverified: data.unverified_count ?? 0,
      })
      setSelected(new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return agents.filter((agent) => {
      const status = getPhotoVerificationStatus(agent)
      if (filter !== "all" && status !== filter) return false
      if (!q) return true
      const hay = [agent.full_name, agent.email, agent.phone_number]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [agents, search, filter])

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(filteredAgents.map((a) => a.id)))
    } else {
      setSelected(new Set())
    }
  }

  const approve = async (agentId: string) => {
    setActingId(agentId)
    try {
      const res = await fetch("/api/admin/photo-verification/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ agent_id: agentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Approve failed")
      toast.success("Photo approved")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed")
    } finally {
      setActingId(null)
    }
  }

  const reject = async (agentId: string) => {
    if (!confirm("Reject this photo? The agent will need to upload a new profile photo.")) return
    setActingId(agentId)
    try {
      const res = await fetch("/api/admin/photo-verification/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ agent_id: agentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Reject failed")
      toast.success("Photo rejected — agent must re-upload")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed")
    } finally {
      setActingId(null)
    }
  }

  const bulkApprove = async () => {
    const ids = [...selected].filter((id) => {
      const a = agents.find((x) => x.id === id)
      return a && getPhotoVerificationStatus(a) !== "verified"
    })
    if (ids.length === 0) {
      toast.info("No unverified or pending agents selected")
      return
    }
    setBulkActing(true)
    let ok = 0
    for (const id of ids) {
      try {
        const res = await fetch("/api/admin/photo-verification/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
          body: JSON.stringify({ agent_id: id }),
        })
        if (res.ok) ok++
      } catch {
        /* continue */
      }
    }
    toast.success(`Approved ${ok} of ${ids.length} selected`)
    setBulkActing(false)
    await load()
  }

  const bulkReject = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (!confirm(`Reject photos for ${ids.length} agent(s)?`)) return
    setBulkActing(true)
    let ok = 0
    for (const id of ids) {
      try {
        const res = await fetch("/api/admin/photo-verification/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
          body: JSON.stringify({ agent_id: id }),
        })
        if (res.ok) ok++
      } catch {
        /* continue */
      }
    }
    toast.success(`Rejected ${ok} of ${ids.length} selected`)
    setBulkActing(false)
    await load()
  }

  const allFilteredSelected =
    filteredAgents.length > 0 && filteredAgents.every((a) => selected.has(a.id))

  return (
    <div className="space-y-4 max-w-full">
      <p className="text-sm text-muted-foreground">
        Agents with a profile photo. Pending = uploaded, awaiting approval. Verified = admin approved.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative flex-1 min-w-0 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
          <SelectTrigger className="w-full sm:w-[180px] h-11">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-11 shrink-0">
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-emerald-50 text-[#0E8F3D]">
          Verified: {stats.verified}
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-800">
          Pending: {stats.pending}
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-800">
          Unverified: {stats.unverified}
        </Badge>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-[#0E8F3D] hover:bg-[#0a7a34] h-11"
              disabled={bulkActing}
              onClick={() => void bulkApprove()}
            >
              {bulkActing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Selected"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-11"
              disabled={bulkActing}
              onClick={() => void bulkReject()}
            >
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      {filteredAgents.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox
            checked={allFilteredSelected}
            onCheckedChange={(c) => toggleSelectAll(c === true)}
          />
          Select all on this page ({filteredAgents.length})
        </label>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            {agents.length === 0
              ? "No agents with profile photos yet."
              : "No agents match your search or filter."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAgents.map((agent) => {
            const busy = actingId === agent.id || bulkActing
            const status = getPhotoVerificationStatus(agent)
            return (
              <Card key={agent.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      className="mt-1"
                      checked={selected.has(agent.id)}
                      onCheckedChange={(c) => toggleSelect(agent.id, c === true)}
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{agent.full_name || "—"}</CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{agent.phone_number}</p>
                      {agent.email && (
                        <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                      )}
                    </div>
                    <AdminAgentVerificationBadge agent={agent} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.profile_image_url && (
                    <div className="relative mx-auto w-28 h-28 rounded-full overflow-hidden border-2 border-slate-200">
                      <Image
                        src={agent.profile_image_url}
                        alt={`${agent.full_name} profile`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-[#0E8F3D] hover:bg-[#0a7a34] min-h-11"
                      disabled={busy || status === "verified"}
                      onClick={() => approve(agent.id)}
                    >
                      {busy && actingId === agent.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 min-h-11"
                      disabled={busy}
                      onClick={() => reject(agent.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
