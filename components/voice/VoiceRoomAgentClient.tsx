"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionState, RoomEvent, Track } from "livekit-client"
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
  Mic,
  MicOff,
  FileDown,
  Loader2,
  Radio,
  Sparkles,
  PhoneOff,
  Smile,
} from "lucide-react"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  VOICE_TOPIC_ADMIN_SHARE,
  VOICE_TOPIC_DEMOTE,
  VOICE_TOPIC_GRANT_SPEAK,
  VOICE_TOPIC_HAND_RAISE,
  VOICE_TOPIC_UNMUTE_COMMAND,
  VOICE_REACTION_EMOJIS,
} from "@/lib/voice-room-topics"
import {
  formatVoiceDuration,
  voiceAvatarRingColor,
  voiceInitials,
} from "@/lib/voice-ui-utils"
import { getParticipantRole, isHostParticipant, isSpeakerRole } from "@/components/voice/voice-participant-utils"
import { useParticipantAudioLevel } from "@/components/voice/useParticipantAudioLevel"
import { VoiceReactionsLayer, sendVoiceReaction } from "@/components/voice/VoiceReactionsLayer"
import { ChatPanel } from "@/components/voice/ChatPanel"
import { HostVideoPanel } from "@/components/voice/HostVideoPanel"
import { decodeVoiceData } from "@/lib/voice-room-data"

const MEET_BG = "#202124"
const MEET_TEXT = "#e8eaed"
const MEET_GREEN = "#0E8F3D"

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
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-[#e8eaed]"
      style={{ background: MEET_BG }}
    >
      <div className="flex flex-col items-center text-center max-w-md w-full">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#3c4043]">
          <Radio className="h-7 w-7" style={{ color: MEET_GREEN }} />
        </div>
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: MEET_GREEN }}>
          Agent Conference
        </p>
        <h1 className="text-2xl font-medium mb-2 break-all">{roomName}</h1>
        <p className="text-sm text-[#9aa0a6] mb-10 leading-relaxed">
          Join as a listener. Raise your hand when you want to speak — the host will approve you.
        </p>
        <button type="button" onClick={onJoin} className="w-full max-w-xs">
          <span
            className="flex items-center justify-center gap-2 h-12 w-full rounded-full text-base font-medium text-white"
            style={{ background: MEET_GREEN }}
          >
            <Sparkles className="h-5 w-5" />
            Join conference
          </span>
        </button>
      </div>
    </div>
  )
}

function MeetAvatar({
  name,
  identity,
  size = "lg",
  isSpeaking,
  showWave,
}: {
  name: string
  identity: string
  size?: "sm" | "lg"
  isSpeaking?: boolean
  showWave?: boolean
}) {
  const ring = voiceAvatarRingColor(identity)
  const dim = size === "lg" ? "h-28 w-28 text-2xl" : "h-10 w-10 text-xs"
  return (
    <div className="relative shrink-0">
      {showWave && isSpeaking && (
        <span
          className="absolute inset-0 rounded-full border-2 animate-voice-soundwave"
          style={{ borderColor: `${MEET_GREEN}99` }}
          aria-hidden
        />
      )}
      <div
        className={`relative rounded-full flex items-center justify-center font-semibold text-white ${dim}`}
        style={{
          boxShadow: `0 0 0 3px ${ring}`,
          background: `linear-gradient(135deg, ${ring}99, ${ring})`,
        }}
      >
        {voiceInitials(name || identity)}
      </div>
    </div>
  )
}

function AgentRoomUI({
  roomName,
  pendingSpeak,
  onTokenUpgrade,
  onSpeakActivated,
}: {
  roomName: string
  pendingSpeak: boolean
  onTokenUpgrade: (token: string) => void
  onSpeakActivated: () => void
}) {
  const router = useRouter()
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const participants = useParticipants()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const localLevel = useParticipantAudioLevel(localParticipant)
  const [handRaised, setHandRaised] = useState(false)
  const [canSpeak, setCanSpeak] = useState(false)
  const [wasDemoted, setWasDemoted] = useState(false)
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [connectingMic, setConnectingMic] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [reactionsOpen, setReactionsOpen] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)

  const refreshSpeakerToken = useCallback(async () => {
    const res = await fetch(
      `/api/agent/voice-rooms/token?roomName=${encodeURIComponent(roomName)}&speak=1`,
      { headers: getAgentAuthHeaders(), credentials: "same-origin" },
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Could not get speaker access")
    return data.token as string
  }, [roomName])

  const handleUnmuteCommand = useCallback(() => {
    void (async () => {
      setConnectingMic(true)
      try {
        const newToken = await refreshSpeakerToken()
        await room.disconnect()
        onTokenUpgrade(newToken)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not go live")
        setConnectingMic(false)
      }
    })()
  }, [room, refreshSpeakerToken, onTokenUpgrade])

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

    const onLegacyGrant = () => handleUnmuteCommand()

    room.registerTextStreamHandler(VOICE_TOPIC_GRANT_SPEAK, async (reader) => {
      const text = await reader.readAll()
      if (text.includes(localParticipant.identity)) onLegacyGrant()
    })

    const onData = (payload: Uint8Array, _p?: unknown, _k?: unknown, topic?: string) => {
      if (topic === VOICE_TOPIC_UNMUTE_COMMAND || topic === VOICE_TOPIC_GRANT_SPEAK) {
        const id = new TextDecoder().decode(payload)
        if (id === localParticipant.identity || id.includes(localParticipant.identity)) {
          handleUnmuteCommand()
        }
      }
      if (topic === VOICE_TOPIC_DEMOTE) {
        const msg = decodeVoiceData(payload)
        if (msg?.type === "demote" && msg.identity === localParticipant.identity) {
          setCanSpeak(false)
          setWasDemoted(true)
          setHandRaised(false)
          void localParticipant.setMicrophoneEnabled(false)
          toast.message("You are back in listen-only mode")
        }
      }
    }
    room.on(RoomEvent.DataReceived, onData)

    return () => {
      room.unregisterByteStreamHandler(VOICE_TOPIC_ADMIN_SHARE)
      room.unregisterTextStreamHandler(VOICE_TOPIC_GRANT_SPEAK)
      room.off(RoomEvent.DataReceived, onData)
    }
  }, [room, localParticipant, handleUnmuteCommand])

  useEffect(() => {
    if (!pendingSpeak || connectionState !== ConnectionState.Connected) return
    setCanSpeak(true)
    setWasDemoted(false)
    setHandRaised(false)
    void (async () => {
      try {
        await localParticipant.setMicrophoneEnabled(true)
        toast.success("You are now live. Speak now.")
      } catch {
        toast.error("Allow microphone access in your browser to speak")
      } finally {
        setConnectingMic(false)
        onSpeakActivated()
      }
    })()
  }, [pendingSpeak, connectionState, localParticipant, onSpeakActivated])

  useEffect(() => {
    if (connectionState === ConnectionState.Connected && !canSpeak && !pendingSpeak) {
      void localParticipant.setMicrophoneEnabled(false)
    }
  }, [connectionState, canSpeak, pendingSpeak, localParticipant])

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

  const sendReaction = async (emoji: string) => {
    try {
      await sendVoiceReaction(
        (text, opts) => localParticipant.sendText(text, opts),
        emoji,
      )
      setReactionsOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send reaction")
    }
  }

  const leaveRoom = async () => {
    await room.disconnect()
    router.push("/agent/voice-rooms")
  }

  const toggleSelfMute = () => {
    if (!canSpeak) return
    void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
  }

  const connected = connectionState === ConnectionState.Connected

  const hostOrSpeaker = useMemo(() => {
    const speakers = participants.filter((p) => {
      const role = getParticipantRole(p)
      return isSpeakerRole(role) || isHostParticipant(p.identity, role)
    })
    return (
      speakers.find((p) => p.isSpeaking) ||
      speakers.find((p) => isHostParticipant(p.identity, getParticipantRole(p))) ||
      speakers[0] ||
      null
    )
  }, [participants])

  const otherParticipants = useMemo(
    () =>
      participants.filter(
        (p) => !p.isLocal && p.identity !== hostOrSpeaker?.identity,
      ),
    [participants, hostOrSpeaker],
  )

  const displayName = hostOrSpeaker?.name || hostOrSpeaker?.identity || "Host"
  const hostLevel = useParticipantAudioLevel(hostOrSpeaker ?? localParticipant)
  const hostMicPub = hostOrSpeaker?.getTrackPublication(Track.Source.Microphone)
  const hostHasAudio = hostMicPub && !hostMicPub.isMuted

  return (
    <div className="flex flex-col min-h-[100dvh] text-[#e8eaed]" style={{ background: MEET_BG, color: MEET_TEXT }}>
      <VoiceReactionsLayer />

      <header className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-[#3c4043]">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: MEET_GREEN }}>
            Agent Conference
          </p>
          <h1 className="text-sm font-medium truncate">{roomName}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-[#9aa0a6]">
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-[#0E8F3D] animate-pulse" : "bg-amber-400"}`}
          />
          {connected ? formatVoiceDuration(elapsed) : "Connecting…"}
        </div>
      </header>

      {canSpeak && (
        <div
          className="mx-4 mt-3 px-3 py-2 rounded-lg text-center text-sm font-medium text-white"
          style={{ background: MEET_GREEN }}
        >
          You are speaking
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pb-2">
        <HostVideoPanel />

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4 min-h-0">
          {hostOrSpeaker ? (
            <div className="flex flex-col items-center gap-3">
              <MeetAvatar
                name={displayName}
                identity={hostOrSpeaker.identity}
                size="lg"
                isSpeaking={hostOrSpeaker.isSpeaking || hostLevel > 0.08}
                showWave={!!hostHasAudio || hostOrSpeaker.isSpeaking}
              />
              <p className="text-lg font-medium">{displayName.split(" ")[0]}</p>
              <p className="text-xs text-[#9aa0a6]">
                {isHostParticipant(hostOrSpeaker.identity, getParticipantRole(hostOrSpeaker))
                  ? "Host"
                  : "Speaker"}
              </p>
            </div>
          ) : (
            <div className="text-center text-[#9aa0a6] text-sm">Waiting for host…</div>
          )}

          {otherParticipants.length > 0 && (
            <div className="w-full max-w-md">
              <p className="text-[10px] uppercase tracking-wider text-[#9aa0a6] text-center mb-2">
                In call ({participants.length})
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1 justify-center">
                {otherParticipants.slice(0, 12).map((p) => (
                  <div key={p.identity} className="flex flex-col items-center gap-1 shrink-0">
                    <MeetAvatar
                      name={p.name || p.identity}
                      identity={p.identity}
                      size="sm"
                      isSpeaking={p.isSpeaking}
                      showWave={p.isSpeaking}
                    />
                    <span className="text-[10px] text-[#9aa0a6] max-w-[56px] truncate">
                      {p.isLocal ? "You" : (p.name || "").split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer
        className="shrink-0 h-14 px-3 flex items-center justify-center gap-2 border-t border-[#3c4043] safe-area-inset-bottom"
        style={{ background: "#292a2d" }}
      >
        <button
          type="button"
          disabled={!canSpeak || connectingMic}
          onClick={toggleSelfMute}
          className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
            canSpeak
              ? isMicrophoneEnabled
                ? "text-white"
                : "bg-[#ea4335] text-white"
              : "bg-[#3c4043] text-[#9aa0a6] opacity-60"
          }`}
          style={canSpeak && isMicrophoneEnabled ? { background: MEET_GREEN } : undefined}
          title={canSpeak ? (isMicrophoneEnabled ? "Mute" : "Unmute") : "Listen only"}
        >
          {connectingMic ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isMicrophoneEnabled && canSpeak ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </button>

        {!canSpeak && (
          <button
            type="button"
            disabled={handRaised || !connected}
            onClick={() => void raiseHand()}
            className={`h-11 w-11 rounded-full flex items-center justify-center ${
              handRaised ? "bg-amber-700 text-white" : "bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d51]"
            }`}
            title="Raise hand"
          >
            <Hand className="h-5 w-5" />
          </button>
        )}

        <Sheet open={reactionsOpen} onOpenChange={setReactionsOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              disabled={!connected}
              className="h-11 w-11 rounded-full bg-[#3c4043] flex items-center justify-center hover:bg-[#4a4d51] disabled:opacity-40"
              title="Reactions"
            >
              <Smile className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl border-[#3c4043] bg-[#292a2d] text-[#e8eaed]">
            <SheetHeader>
              <SheetTitle className="text-[#e8eaed]">Reactions</SheetTitle>
            </SheetHeader>
            <div className="flex justify-center gap-4 py-6">
              {VOICE_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="h-14 w-14 rounded-full bg-[#3c4043] text-2xl hover:bg-[#4a4d51]"
                  onClick={() => void sendReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <ChatPanel
          roomName={roomName}
          senderName={localParticipant.name || "Agent"}
          senderAgentId={localParticipant.identity}
          apiMode="agent"
          disabled={!connected}
          triggerClassName="h-11 w-11 rounded-full p-0 border-0 bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]"
        />

        {sharedFiles.length > 0 && (
          <Sheet open={filesOpen} onOpenChange={setFilesOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="h-11 w-11 rounded-full bg-[#3c4043] flex items-center justify-center text-xs"
              >
                {sharedFiles.length}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl bg-[#292a2d] border-[#3c4043] text-[#e8eaed]">
              <SheetHeader>
                <SheetTitle>Shared files</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[50vh]">
                {sharedFiles.map((f) => (
                  <div key={f.id} className="rounded-lg bg-[#3c4043] p-3">
                    <p className="text-xs truncate mb-2">{f.name}</p>
                    {f.mimeType.startsWith("image/") ? (
                      <button type="button" className="w-full" onClick={() => setLightboxUrl(f.url)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.url} alt={f.name} className="max-h-40 rounded w-full object-contain" />
                      </button>
                    ) : (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: MEET_GREEN }}>
                        <FileDown className="h-4 w-4 inline mr-1" />
                        Open
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}

        <button
          type="button"
          onClick={() => void leaveRoom()}
          className="h-11 w-11 rounded-full bg-[#ea4335] flex items-center justify-center text-white hover:bg-[#d93025]"
          title="Leave call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </footer>

      {!canSpeak && wasDemoted && (
        <p className="text-center text-xs text-[#9aa0a6] pb-2 px-4">Request to speak again with raise hand</p>
      )}

      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-[95vw] p-2 bg-black/95 border-[#3c4043]">
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

export function VoiceRoomAgentClient({ token: initialToken, serverUrl, roomName }: Props) {
  const [joined, setJoined] = useState(false)
  const [lkToken, setLkToken] = useState(initialToken)
  const [roomKey, setRoomKey] = useState(0)
  const [pendingSpeak, setPendingSpeak] = useState(false)

  const handleTokenUpgrade = useCallback((newToken: string) => {
    setLkToken(newToken)
    setRoomKey((k) => k + 1)
    setPendingSpeak(true)
  }, [])

  if (!joined) {
    return <PreJoinScreen roomName={roomName} onJoin={() => setJoined(true)} />
  }

  return (
    <LiveKitRoom
      key={roomKey}
      token={lkToken}
      serverUrl={serverUrl}
      connect={joined}
      audio
      video={false}
      options={{ publishDefaults: { simulcast: false } }}
      onError={(e) => toast.error(e.message)}
      className="min-h-[100dvh]"
      style={{ background: MEET_BG }}
    >
      <AgentRoomUI
        roomName={roomName}
        pendingSpeak={pendingSpeak}
        onTokenUpgrade={handleTokenUpgrade}
        onSpeakActivated={() => setPendingSpeak(false)}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}
