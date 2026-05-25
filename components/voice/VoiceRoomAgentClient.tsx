"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionState } from "livekit-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Hand, LogOut, Mic, MicOff, FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  VOICE_TOPIC_ADMIN_SHARE,
  VOICE_TOPIC_GRANT_SPEAK,
  VOICE_TOPIC_HAND_RAISE,
} from "@/lib/voice-room-topics"

type SharedFile = {
  id: string
  name: string
  mimeType: string
  url: string
}

type Props = {
  token: string
  serverUrl: string
  roomName: string
}

function AgentRoomUI({ roomName }: { roomName: string }) {
  const router = useRouter()
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const [handRaised, setHandRaised] = useState(false)
  const [canSpeak, setCanSpeak] = useState(false)
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [connectingMic, setConnectingMic] = useState(false)

  const refreshSpeakerToken = useCallback(async () => {
    const res = await fetch(
      `/api/agent/voice-rooms/token?roomName=${encodeURIComponent(roomName)}&speak=1`,
      { headers: getAgentAuthHeaders(), credentials: "same-origin" },
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Could not get speaker access")
    return data.token as string
  }, [roomName])

  useEffect(() => {
    room.registerByteStreamHandler(VOICE_TOPIC_ADMIN_SHARE, async (reader) => {
      try {
        const chunks = await reader.readAll()
        const blob = new Blob(chunks as BlobPart[], { type: reader.info.mimeType || "application/octet-stream" })
        const url = URL.createObjectURL(blob)
        setSharedFiles((prev) => [
          {
            id: reader.info.id || `${Date.now()}`,
            name: reader.info.name || "shared-file",
            mimeType: reader.info.mimeType || blob.type,
            url,
          },
          ...prev,
        ])
      } catch (e) {
        console.error("[voice] file receive", e)
      }
    })

    room.registerTextStreamHandler(VOICE_TOPIC_GRANT_SPEAK, async (reader) => {
      const text = await reader.readAll()
      if (text.includes(localParticipant.identity)) {
        setCanSpeak(true)
        setHandRaised(false)
        setConnectingMic(true)
        try {
          await localParticipant.setMicrophoneEnabled(true)
          toast.success("You can speak now")
        } catch {
          try {
            await refreshSpeakerToken()
            toast.info("Speaker access granted — enable your microphone")
            await localParticipant.setMicrophoneEnabled(true)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Enable mic failed")
          }
        } finally {
          setConnectingMic(false)
        }
      }
    })

    return () => {
      room.unregisterByteStreamHandler(VOICE_TOPIC_ADMIN_SHARE)
      room.unregisterTextStreamHandler(VOICE_TOPIC_GRANT_SPEAK)
    }
  }, [room, localParticipant, refreshSpeakerToken])

  const raiseHand = async () => {
    try {
      await localParticipant.sendText(
        JSON.stringify({
          type: VOICE_TOPIC_HAND_RAISE,
          identity: localParticipant.identity,
          name: localParticipant.name,
        }),
        { topic: VOICE_TOPIC_HAND_RAISE },
      )
      setHandRaised(true)
      toast.success("Hand raised — waiting for host")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not raise hand")
    }
  }

  const leaveRoom = async () => {
    await room.disconnect()
    router.push("/agent/voice-rooms")
  }

  const connected = connectionState === ConnectionState.Connected

  useEffect(() => {
    if (connectionState === ConnectionState.Connected && !canSpeak) {
      void localParticipant.setMicrophoneEnabled(false)
    }
  }, [connectionState, canSpeak, localParticipant])

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-emerald-950 to-slate-950 text-white">
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-emerald-200/80 uppercase tracking-wide">Voice conference</p>
          <h1 className="font-semibold truncate text-sm sm:text-base">{roomName}</h1>
        </div>
        <Badge className={connected ? "bg-[#0E8F3D]" : "bg-amber-600"}>
          {connected ? "Live" : "Connecting…"}
        </Badge>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <div
          className={`h-28 w-28 rounded-full flex items-center justify-center border-4 ${
            isMicrophoneEnabled ? "border-[#35B24A] bg-[#0E8F3D]/30" : "border-white/20 bg-white/5"
          }`}
        >
          {connectingMic ? (
            <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
          ) : isMicrophoneEnabled ? (
            <Mic className="h-10 w-10 text-emerald-300" />
          ) : (
            <MicOff className="h-10 w-10 text-white/50" />
          )}
        </div>
        <p className="text-center text-sm text-white/80 max-w-xs">
          {canSpeak || isMicrophoneEnabled
            ? "You are unmuted. Speak clearly."
            : "You are listening only. Raise your hand to request to speak."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          {!canSpeak && !isMicrophoneEnabled && (
            <Button
              type="button"
              className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={raiseHand}
              disabled={handRaised || !connected}
            >
              <Hand className="h-5 w-5 mr-2" />
              {handRaised ? "Hand raised" : "Raise hand"}
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            className="flex-1 h-12"
            onClick={leaveRoom}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Leave room
          </Button>
        </div>
      </main>

      {sharedFiles.length > 0 && (
        <section className="px-4 pb-6 space-y-2">
          <h2 className="text-sm font-medium text-emerald-200">Shared files</h2>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {sharedFiles.map((f) => (
              <div key={f.id} className="rounded-lg bg-white/10 p-3">
                <p className="text-xs truncate mb-2">{f.name}</p>
                {f.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="max-h-40 rounded-md w-full object-contain" />
                ) : (
                  <a
                    href={f.url}
                    download={f.name}
                    className="inline-flex items-center text-sm text-emerald-300 underline"
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    Download PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function VoiceRoomAgentClient({ token, serverUrl, roomName }: Props) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video={false}
      options={{ publishDefaults: { simulcast: false } }}
      onError={(e) => toast.error(e.message)}
      className="min-h-[100dvh]"
    >
      <AgentRoomUI roomName={roomName} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}
