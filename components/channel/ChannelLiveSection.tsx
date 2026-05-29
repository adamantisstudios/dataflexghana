"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Radio, Video, X } from "lucide-react"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { realtimeManager } from "@/lib/realtime-manager"
import { VoiceRoomAdminControl } from "@/components/voice/VoiceRoomAdminControl"
import { VoiceRoomAgentClient } from "@/components/voice/VoiceRoomAgentClient"
import { ChannelLiveChat } from "@/components/channel/ChannelLiveChat"

type LiveSession = {
  id: string
  channel_id: string
  room_name: string
  session_type: "audio" | "video"
  host_agent_id: string
  title: string | null
  is_active: boolean
}

type Props = {
  channelId: string
  agentId: string
  agentName: string
  isHost: boolean
}

export function ChannelLiveSection({ channelId, agentId, agentName, isHost }: Props) {
  const [session, setSession] = useState<LiveSession | null>(null)
  const [hostOverlay, setHostOverlay] = useState<{
    token: string
    serverUrl: string
    session: LiveSession
  } | null>(null)
  const [memberJoin, setMemberJoin] = useState<{
    token: string
    serverUrl: string
    roomName: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/agent/channels/${channelId}/live`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      setSession(data.session ?? null)
    } catch {
      /* ignore */
    }
  }, [channelId])

  useEffect(() => {
    void refresh()
    const unsub = realtimeManager.subscribe(
      `channel_live_${channelId}`,
      "channel_live_sessions",
      () => void refresh(),
      `channel_id=eq.${channelId}`,
    )
    return () => unsub()
  }, [channelId, refresh])

  const startLive = async (sessionType: "audio" | "video") => {
    if (!isHost) return
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/channels/${channelId}/live`, {
        method: "POST",
        headers: getAgentAuthHeaders(),
        body: JSON.stringify({ sessionType, title: `${sessionType === "video" ? "Video" : "Audio"} live` }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not start live")
      setSession(data.session)
      setHostOverlay({ token: data.token, serverUrl: data.serverUrl, session: data.session })
      toast.success(`${sessionType === "video" ? "Video" : "Audio"} live started`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start")
    } finally {
      setLoading(false)
    }
  }

  const joinLive = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/channels/${channelId}/live/join`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not join")
      setMemberJoin({
        token: data.token,
        serverUrl: data.serverUrl,
        roomName: data.roomName,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to join")
    } finally {
      setLoading(false)
    }
  }

  if (hostOverlay) {
    return (
      <>
        <VoiceRoomAdminControl
          roomId={hostOverlay.session.id}
          roomName={hostOverlay.session.room_name}
          token={hostOverlay.token}
          serverUrl={hostOverlay.serverUrl}
          recordingEnabled={false}
          enableVideo={hostOverlay.session.session_type === "video"}
          moderationApiBase={`/api/channel-live/${hostOverlay.session.id}`}
          hideRecording
          hideNotify
          onClose={() => setHostOverlay(null)}
          onEnded={() => {
            setHostOverlay(null)
            setSession(null)
            void refresh()
          }}
        />
        <ChannelLiveChat
          sessionId={hostOverlay.session.id}
          senderName={agentName}
          senderAgentId={agentId}
          hostAgentId={hostOverlay.session.host_agent_id}
        />
      </>
    )
  }

  if (memberJoin && session) {
    return (
      <div className="fixed inset-0 z-50 bg-black/20">
        <div className="absolute top-3 right-3 z-[60]">
          <Button variant="secondary" size="sm" className="h-11 border-gray-200 bg-white text-gray-900" onClick={() => setMemberJoin(null)}>
            <X className="h-4 w-4 mr-1" /> Leave live
          </Button>
        </div>
        <VoiceRoomAgentClient
          token={memberJoin.token}
          serverUrl={memberJoin.serverUrl}
          roomName={memberJoin.roomName}
          channelId={channelId}
          roomAllowsVideo={session.session_type === "video"}
        />
        <ChannelLiveChat
          sessionId={session.id}
          senderName={agentName}
          senderAgentId={agentId}
          hostAgentId={session.host_agent_id}
        />
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-green-600" />
          <span className="text-sm font-semibold text-gray-900">Channel Live</span>
          {session && (
            <Badge className="bg-red-500 animate-pulse text-white text-[10px]">
              LIVE · {session.session_type}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isHost && !session && (
            <>
              <Button
                size="sm"
                disabled={loading}
                className="h-11 bg-green-500 text-white hover:bg-green-600"
                onClick={() => void startLive("audio")}
              >
                <Mic className="h-4 w-4 mr-1" />
                Audio live
              </Button>
              <Button
                size="sm"
                disabled={loading}
                className="h-11 bg-gray-900 text-white hover:bg-black"
                onClick={() => void startLive("video")}
              >
                <Video className="h-4 w-4 mr-1" />
                Video live
              </Button>
            </>
          )}
          {isHost && session && (
            <Button
              size="sm"
              variant="outline"
              className="h-11 border-gray-200 text-gray-900"
              onClick={async () => {
                const res = await fetch(`/api/agent/channels/${channelId}/live/join`, {
                  headers: getAgentAuthHeaders(),
                })
                const data = await res.json()
                if (res.ok) {
                  setHostOverlay({
                    token: data.token,
                    serverUrl: data.serverUrl,
                    session,
                  })
                }
              }}
            >
              Rejoin as host
            </Button>
          )}
          {!isHost && session && (
            <Button size="sm" className="h-11 bg-green-500 text-white hover:bg-green-600" disabled={loading} onClick={() => void joinLive()}>
              Join live
            </Button>
          )}
        </div>
      </div>
      {session && (
        <p className="text-xs text-muted-foreground mt-2">
          {isHost
            ? "Members can join, raise hands, and chat. You control who speaks."
            : "The channel host is live. Join to listen, raise your hand, or chat."}
        </p>
      )}
    </div>
  )
}
