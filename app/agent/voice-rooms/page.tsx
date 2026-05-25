"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Mic2, Users, Radio, Sparkles } from "lucide-react"
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

function RoomCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse space-y-4">
      <div className="h-5 w-24 bg-white/10 rounded" />
      <div className="h-4 w-32 bg-white/10 rounded" />
      <div className="h-12 w-full bg-white/10 rounded-xl" />
    </div>
  )
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

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#0a1628] via-[#0d1b2a] to-black text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/agent/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0 h-11 w-11">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-emerald-400/90">DataFlex Ghana</p>
            <h1 className="font-bold text-xl leading-tight text-white">
              Upcoming Voice Conferences
            </h1>
            {agentRegion && (
              <p className="text-xs text-white/50 truncate mt-0.5">Your region: {agentRegion}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <p className="text-sm text-white/60 leading-relaxed">
          Invitation-only live audio for agents in your region. Join as a listener and raise your hand to speak.
        </p>

        {loading ? (
          <div className="space-y-4">
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-white/10">
              <Mic2 className="h-10 w-10 text-emerald-400/80" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No conferences scheduled</h2>
            <p className="text-sm text-white/50 max-w-xs mx-auto leading-relaxed">
              When an admin opens a voice room for your region, it will appear here. Check back soon or watch for SMS
              notifications.
            </p>
            <Button
              variant="outline"
              className="mt-6 border-white/20 text-white hover:bg-white/10"
              onClick={() => load()}
            >
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room, index) => (
              <article
                key={room.id}
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 shadow-xl ${
                  index === 0 ? "ring-1 ring-[#0E8F3D]/40" : ""
                }`}
              >
                {index === 0 && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#0E8F3D] text-white border-0 text-[10px]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse mr-1" />
                      Live now
                    </Badge>
                  </div>
                )}
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-[#0E8F3D]/20 flex items-center justify-center shrink-0">
                    <Radio className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="min-w-0 pr-16">
                    <h2 className="font-semibold text-lg text-white">{room.region}</h2>
                    <p className="text-xs text-white/45 truncate mt-0.5">{room.room_name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="border-white/20 text-slate-100 bg-slate-800/40">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {room.participant_count ?? 0} participants
                  </Badge>
                </div>
                <Button
                  className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-emerald-900/30 text-white"
                  style={{ background: `linear-gradient(180deg, #35B24A, ${BRAND})` }}
                  onClick={() => router.push(`/agent/voice-room/${encodeURIComponent(room.room_name)}`)}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Join Now
                </Button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
