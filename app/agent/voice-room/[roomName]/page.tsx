"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { toast } from "sonner"

const VoiceRoomAgentClient = dynamic(
  () => import("@/components/voice/VoiceRoomAgentClient").then((m) => m.VoiceRoomAgentClient),
  { ssr: false, loading: () => (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
    </div>
  ) },
)

export default function AgentVoiceRoomJoinPage() {
  const params = useParams()
  const router = useRouter()
  const roomName = decodeURIComponent(String(params.roomName ?? ""))
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomName) return
    const raw = localStorage.getItem("agent")
    if (!raw) {
      router.push("/agent/login")
      return
    }

    const loadToken = async () => {
      try {
        const res = await fetch(
          `/api/agent/voice-rooms/token?roomName=${encodeURIComponent(roomName)}`,
          { headers: getAgentAuthHeaders(), credentials: "same-origin" },
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Cannot join room")
        setToken(data.token)
        setServerUrl(data.serverUrl)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Join failed"
        setError(msg)
        toast.error(msg)
      }
    }

    void loadToken()
  }, [roomName, router])

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 bg-slate-950 text-white text-center">
        <p>{error}</p>
        <button
          type="button"
          className="text-emerald-400 underline"
          onClick={() => router.push("/agent/voice-rooms")}
        >
          Back to voice rooms
        </button>
      </div>
    )
  }

  if (!token || !serverUrl) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
      </div>
    )
  }

  return <VoiceRoomAgentClient token={token} serverUrl={serverUrl} roomName={roomName} />
}
