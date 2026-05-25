"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { AdminAgentVerificationBadge } from "@/components/admin/AdminAgentVerificationBadge"

type AgentRow = {
  id: string
  full_name: string | null
  phone_number: string | null
  email: string | null
  profile_image_url: string | null
  profile_verified: boolean | null
}

export default function PhotoVerificationAdminTab() {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [stats, setStats] = useState({ verified: 0, unverified: 0, total: 0 })

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
        unverified: data.unverified_count ?? 0,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          All agents with a profile photo. Auto-verified uploads can still be rejected. Legacy photos show as
          Unverified until you approve.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="bg-emerald-50 text-[#0E8F3D]">
            Verified: {stats.verified}
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-800">
            Unverified: {stats.unverified}
          </Badge>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No agents with profile photos yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const busy = actingId === agent.id
            return (
              <Card key={agent.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{agent.full_name || "—"}</CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{agent.phone_number}</p>
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
                      className="flex-1 bg-[#0E8F3D] hover:bg-[#0a7a34]"
                      disabled={busy || agent.profile_verified === true}
                      onClick={() => approve(agent.id)}
                    >
                      {busy ? (
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
                      className="flex-1"
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
