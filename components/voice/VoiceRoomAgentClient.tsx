"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionState } from "livekit-client"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Hand,
  LogOut,
  Mic,
  MicOff,
  FileDown,
  Loader2,
  Users,
  Radio,
  FolderOpen,
  Sparkles,
  Headphones,
} from "lucide-react"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  VOICE_TOPIC_ADMIN_SHARE,
  VOICE_TOPIC_GRANT_SPEAK,
  VOICE_TOPIC_HAND_RAISE,
  VOICE_REACTION_EMOJIS,
} from "@/lib/voice-room-topics"
import {
  formatVoiceDuration,
  voiceAvatarRingColor,
  voiceInitials,
} from "@/lib/voice-ui-utils"
import { getParticipantRole, isSpeakerRole } from "@/components/voice/voice-participant-utils"
import { useParticipantAudioLevel } from "@/components/voice/useParticipantAudioLevel"
import { VoiceReactionsLayer, sendVoiceReaction } from "@/components/voice/VoiceReactionsLayer"
import { ChatPanel } from "@/components/voice/ChatPanel"

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

function PreJoinScreen({
  roomName,
  onJoin,
}: {
  roomName: string
  onJoin: () => void
}) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#0a1628] via-[#1a0f2e] to-black text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-[#0E8F3D]/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
          <Radio className="h-7 w-7 text-emerald-400" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-2">Voice conference</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 break-all">{roomName}</h1>
        <p className="text-sm text-slate-300 mb-10 leading-relaxed">
          Join as a listener. Raise your hand when you want to speak — the host will approve you.
        </p>
        <button type="button" onClick={onJoin} className="relative group w-full max-w-xs">
          <span className="absolute inset-0 rounded-full bg-[#0E8F3D] blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
          <span className="relative flex items-center justify-center gap-2 h-16 w-full rounded-full bg-gradient-to-b from-[#35B24A] to-[#0E8F3D] text-lg font-semibold text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/30 active:scale-[0.98] transition-transform">
            <Sparkles className="h-5 w-5" />
            Join Room
          </span>
        </button>
      </div>
    </div>
  )
}

function StageAvatar({
  name,
  identity,
  isLocal,
  isSpeaking,
  isActiveSpeaker,
}: {
  name: string
  identity: string
  isLocal?: boolean
  isSpeaking?: boolean
  isActiveSpeaker?: boolean
}) {
  const ring = voiceAvatarRingColor(identity)
  return (
    <div className="flex flex-col items-center gap-2 w-[80px] shrink-0">
      <div className="relative">
        {isActiveSpeaker && isSpeaking && (
          <span
            className="absolute inset-0 rounded-full border-2 border-emerald-400/60 animate-voice-soundwave"
            aria-hidden
          />
        )}
        <div
          className={`relative h-16 w-16 rounded-full flex items-center justify-center text-sm font-bold text-white transition-transform ${
            isSpeaking ? "scale-105" : ""
          }`}
          style={{
            boxShadow: `0 0 0 3px ${ring}`,
            background: `linear-gradient(135deg, ${ring}99, ${ring})`,
          }}
        >
          {voiceInitials(name || identity)}
          {isLocal && (
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#0E8F3D] border-2 border-slate-950 text-[8px] flex items-center justify-center text-white">
              ✓
            </span>
          )}
        </div>
      </div>
      <span className="text-[11px] text-slate-300 truncate max-w-full px-1 text-center">
        {isLocal ? "You" : (name || "Guest").split(" ")[0]}
      </span>
    </div>
  )
}

function AgentRoomUI({ roomName }: { roomName: string }) {
  const router = useRouter()
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const participants = useParticipants()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const localLevel = useParticipantAudioLevel(localParticipant)
  const [handRaised, setHandRaised] = useState(false)
  const [handAnimating, setHandAnimating] = useState(false)
  const [canSpeak, setCanSpeak] = useState(false)
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [connectingMic, setConnectingMic] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

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
    if (connectionState !== ConnectionState.Connected) return
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [connectionState])

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
        toast.info("New file shared by host")
      } catch (e) {
        console.error("[voice] file receive", e)
      }
    })

    room.registerTextStreamHandler(VOICE_TOPIC_GRANT_SPEAK, async (reader) => {
      const text = await reader.readAll()
      if (text.includes(localParticipant.identity)) {
        setCanSpeak(true)
        setHandRaised(false)
        setHandAnimating(false)
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
      setHandAnimating(true)
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
      setHandAnimating(false)
      toast.error(e instanceof Error ? e.message : "Could not raise hand")
    }
  }

  const sendReaction = async (emoji: string) => {
    try {
      await sendVoiceReaction(
        (text, opts) => localParticipant.sendText(text, opts),
        emoji,
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send reaction")
    }
  }

  const leaveRoom = async () => {
    await room.disconnect()
    router.push("/agent/voice-rooms")
  }

  const connected = connectionState === ConnectionState.Connected
  const listenerCount = participants.filter(
    (p) => !isSpeakerRole(getParticipantRole(p)),
  ).length

  const activeSpeaker = participants.find(
    (p) => p.isSpeaking && isSpeakerRole(getParticipantRole(p)),
  )

  useEffect(() => {
    if (connectionState === ConnectionState.Connected && !canSpeak) {
      void localParticipant.setMicrophoneEnabled(false)
    }
  }, [connectionState, canSpeak, localParticipant])

  const isListening = !canSpeak && !isMicrophoneEnabled

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-[#0a1628] via-[#1a0f2e] to-black text-white">
      <VoiceReactionsLayer />

      <header className="px-4 py-4 border-b border-white/10 safe-area-inset-top bg-black/20 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Live conference</p>
            <h1 className="font-semibold truncate text-base sm:text-lg text-white">{roomName}</h1>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                connected ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-100"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
              />
              {connected ? "Live" : "Connecting…"}
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">{formatVoiceDuration(elapsed)}</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold text-white">
          <Users className="inline h-4 w-4 mr-1 text-emerald-400" />
          {Math.max(listenerCount, 1)} listening
        </p>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 gap-5 overflow-hidden relative">
        {isListening ? (
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-2">
              <Headphones className="h-8 w-8 text-emerald-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">You are listening</h2>
            <p className="text-sm text-slate-300 max-w-xs mx-auto">
              Tap reactions below or raise your hand to request the floor.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div
              className={`relative mx-auto h-28 w-28 rounded-full flex items-center justify-center border-4 transition-all ${
                isMicrophoneEnabled
                  ? "border-emerald-400/80 bg-emerald-500/20 shadow-[0_0_40px_rgba(14,143,61,0.35)]"
                  : "border-white/15 bg-white/10"
              } ${localLevel > 0.1 ? "animate-voice-soundwave" : ""}`}
            >
              {connectingMic ? (
                <Loader2 className="h-12 w-12 animate-spin text-emerald-300" />
              ) : isMicrophoneEnabled ? (
                <Mic className="h-12 w-12 text-emerald-300" />
              ) : (
                <MicOff className="h-12 w-12 text-slate-400" />
              )}
            </div>
            <p className="text-sm text-slate-200">You are on stage — speak clearly.</p>
          </div>
        )}

        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 text-center mb-3">Speakers</p>
          <div className="flex gap-5 justify-start sm:justify-center min-w-min px-2">
            {participants
              .filter((p) => isSpeakerRole(getParticipantRole(p)) || p.isLocal && canSpeak)
              .map((p) => (
                <StageAvatar
                  key={p.identity}
                  name={p.name || p.identity}
                  identity={p.identity}
                  isLocal={p.isLocal}
                  isSpeaking={p.isSpeaking}
                  isActiveSpeaker={activeSpeaker?.identity === p.identity}
                />
              ))}
            {participants.filter((p) => isSpeakerRole(getParticipantRole(p))).length === 0 && (
              <p className="text-xs text-slate-400 py-4 w-full text-center">Waiting for host…</p>
            )}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 px-4 pb-6 pt-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl safe-area-inset-bottom space-y-3">
        {/* Reaction bar */}
        <div className="flex justify-center gap-2">
          {VOICE_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={!connected}
              className="h-12 w-12 rounded-full bg-white/10 border border-white/15 text-xl hover:bg-white/20 active:scale-95 transition-transform backdrop-blur-md disabled:opacity-40"
              onClick={() => void sendReaction(emoji)}
              aria-label={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex gap-3 max-w-lg mx-auto">
          {isListening && (
            <Button
              type="button"
              className={`flex-1 h-14 rounded-2xl font-semibold text-base text-white transition-all ${
                handRaised ? "bg-amber-700 hover:bg-amber-700" : "bg-amber-500 hover:bg-amber-600"
              } ${handAnimating ? "animate-hand-rise" : ""}`}
              onClick={raiseHand}
              disabled={handRaised || !connected}
            >
              <Hand
                className={`h-6 w-6 mr-2 shrink-0 ${handAnimating ? "-translate-y-1" : ""} transition-transform`}
              />
              {handRaised ? "Hand raised ✋" : "Raise hand"}
            </Button>
          )}
          <ChatPanel
            roomName={roomName}
            senderName={localParticipant.name || "Agent"}
            senderAgentId={localParticipant.identity}
            apiMode="agent"
            disabled={!connected}
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-14 px-4 rounded-2xl border-white/20 bg-slate-800/80 text-white hover:bg-slate-700"
              >
                <FolderOpen className="h-5 w-5" />
                {sharedFiles.length > 0 && (
                  <span className="ml-1.5 text-xs text-white bg-[#0E8F3D] rounded-full px-1.5 py-0.5">
                    {sharedFiles.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-2xl max-h-[70vh] bg-slate-900 border-white/10 text-white"
            >
              <SheetHeader>
                <SheetTitle className="text-white">Shared files</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[50vh] pb-4">
                {sharedFiles.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No files shared yet</p>
                ) : (
                  sharedFiles.map((f) => (
                    <div key={f.id} className="rounded-xl bg-slate-800/60 border border-white/10 p-3">
                      <p className="text-xs truncate mb-2 text-slate-200">{f.name}</p>
                      {f.mimeType.startsWith("image/") ? (
                        <button type="button" className="w-full" onClick={() => setLightboxUrl(f.url)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.url}
                            alt={f.name}
                            className="max-h-44 rounded-lg w-full object-contain"
                          />
                        </button>
                      ) : (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-emerald-400 underline"
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          Open PDF
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button type="button" variant="destructive" className="h-14 rounded-2xl px-5" onClick={leaveRoom}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </footer>

      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-[95vw] p-2 bg-black/95 border-white/10">
          <DialogTitle className="sr-only">Shared image</DialogTitle>
          {lightboxUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightboxUrl} alt="Shared" className="w-full max-h-[80vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function VoiceRoomAgentClient({ token, serverUrl, roomName }: Props) {
  const [joined, setJoined] = useState(false)

  if (!joined) {
    return <PreJoinScreen roomName={roomName} onJoin={() => setJoined(true)} />
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={joined}
      audio
      video={false}
      options={{ publishDefaults: { simulcast: false } }}
      onError={(e) => toast.error(e.message)}
      className="min-h-[100dvh] bg-gradient-to-b from-[#0a1628] via-[#1a0f2e] to-black text-white"
    >
      <AgentRoomUI roomName={roomName} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}
