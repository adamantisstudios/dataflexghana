"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
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

function parseFilterFromSearch(raw: string | null): FilterKey {
  if (raw === "verified" || raw === "pending" || raw === "unverified" || raw === "all") {
    return raw
  }
  return "pending"
}

export default function PhotoVerificationAdminTab() {
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [bulkActing, setBulkActing] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterKey>(() =>
    parseFilterFromSearch(searchParams?.get("filter") ?? null),
  )
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filteredTotal, setFilteredTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [previewAgent, setPreviewAgent] = useState<AgentRow | null>(null)
  const [stats, setStats] = useState({
    verified: 0,
    pending: 0,
    unverified: 0,
    total: 0,
  })

  useEffect(() => {
    const next = parseFilterFromSearch(searchParams?.get("filter") ?? null)
    setFilter((prev) => (prev === next ? prev : next))
  }, [searchParams])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: "12",
        filter,
        ...(search.trim() ? { search: search.trim() } : {}),
      })
      const res = await fetch(`/api/admin/photo-verification?${q}`, { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      const rows = (data.agents || []) as AgentRow[]
      setAgents(rows)
      setFilteredTotal(data.filtered_total ?? rows.length)
      setTotalPages(data.total_pages ?? 1)
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
  }, [filter, page, search])

  useEffect(() => {
    load()
  }, [load])

  const filteredAgents = useMemo(() => agents, [agents])

  useEffect(() => {
    setPage(1)
  }, [filter, search])

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
        <Select
          value={filter}
          onValueChange={(v) => {
            const next = v as FilterKey
            setFilter(next)
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href)
              url.searchParams.set("tab", "photo-verification")
              url.searchParams.set("filter", next)
              window.history.replaceState({}, "", url.toString())
            }
          }}
        >
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
                    <button
                      type="button"
                      onClick={() => setPreviewAgent(agent)}
                      className="relative mx-auto block aspect-square w-36 overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      title="Open photo preview"
                    >
                      <Image
                        src={agent.profile_image_url}
                        alt={`${agent.full_name} profile`}
                        fill
                        sizes="144px"
                        className="object-cover"
                        loading="lazy"
                        quality={45}
                      />
                    </button>
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

      {!loading && filteredTotal > 0 && (
        <div className="flex flex-col items-center justify-between gap-2 rounded-lg border bg-white p-3 text-sm sm:flex-row">
          <span className="text-muted-foreground">
            Showing {filteredAgents.length} of {filteredTotal} matching agent(s)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="min-w-20 text-center">
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
        </div>
      )}

      {previewAgent?.profile_image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewAgent(null)}
        >
          <div className="w-full max-w-xl rounded-xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={previewAgent.profile_image_url}
                alt={`${previewAgent.full_name || "Agent"} profile preview`}
                fill
                sizes="(max-width: 640px) 92vw, 576px"
                className="object-contain"
                unoptimized
                priority
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-slate-900">
                {previewAgent.full_name || "Agent photo"}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreviewAgent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
