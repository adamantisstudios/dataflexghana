"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Phone, Users } from "lucide-react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { toast } from "sonner"

const BRAND = "#0E8F3D"

type VoiceRoom = {
  id: string
  room_name: string
  region: string
  participant_count?: number
  created_at: string
}

export default function AgentVoiceRoomsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<VoiceRoom[]>([])
  const [agentRegion, setAgentRegion] = useState<string>("")

  const load = useCallback(async () => {
    const raw = localStorage.getItem("agent")
    if (!raw) {
      router.push("/agent/login")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/agent/voice-rooms", {
        headers: getAgentAuthHeaders(),
        credentials: "same-origin",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setRooms(data.rooms || [])
      setAgentRegion(data.agentRegion || "")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load meetings")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const primary = rooms[0]

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50 to-white">
      <header
        className="sticky top-0 z-10 px-4 py-3 text-white shadow-md"
        style={{ background: `linear-gradient(135deg, ${BRAND}, #35B24A)` }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/agent/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="font-semibold text-lg leading-tight">Voice Conference Room</h1>
            {agentRegion && (
              <p className="text-xs text-white/85 truncate">Your region: {agentRegion}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Join invitation-only live audio meetings for agents in your region. You will enter as a listener and can
          raise your hand to speak.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#0E8F3D]" />
          </div>
        ) : primary ? (
          <Card className="border-2 border-[#0E8F3D]/30 shadow-lg overflow-hidden">
            <CardHeader className="bg-[#0E8F3D]/5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-[#0E8F3D]" />
                Live meeting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                <Badge style={{ backgroundColor: BRAND }} className="text-white">
                  {primary.region}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {primary.participant_count ?? 0} in room
                </Badge>
              </div>
              <Button
                className="w-full h-14 text-lg font-semibold"
                style={{ backgroundColor: BRAND }}
                onClick={() => router.push(`/agent/voice-room/${encodeURIComponent(primary.room_name)}`)}
              >
                Join now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <Phone className="h-12 w-12 mx-auto text-slate-300" />
              <p className="font-medium text-slate-700">No active meetings</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                When an admin opens a voice conference for your region, you will be notified and can join from here.
              </p>
            </CardContent>
          </Card>
        )}

        {rooms.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase">Other active rooms</p>
            {rooms.slice(1).map((r) => (
              <Button
                key={r.id}
                variant="outline"
                className="w-full justify-between h-12"
                onClick={() => router.push(`/agent/voice-room/${encodeURIComponent(r.room_name)}`)}
              >
                <span>{r.region}</span>
                <span className="text-xs text-muted-foreground">{r.participant_count ?? 0} participants</span>
              </Button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
