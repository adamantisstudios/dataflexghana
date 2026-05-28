"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
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
  Video,
  VideoOff,
} from "lucide-react"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  VOICE_TOPIC_ADMIN_SHARE,
  VOICE_TOPIC_DEMOTE,
  VOICE_TOPIC_GRANT_SPEAK,
  VOICE_TOPIC_HAND_RAISE,
  VOICE_TOPIC_UNMUTE_COMMAND,
  VOICE_TOPIC_VIDEO_PERMISSION,
  VOICE_REACTION_EMOJIS,
} from "@/lib/voice-room-topics"
import { setParticipantCameraEnabled } from "@/lib/enable-participant-camera"
import { useVoiceDeviceLayout } from "@/lib/voice-video-utils"
import {
  pickFilmstripParticipants,
  pickMainStageParticipant,
  participantHasCamera,
} from "@/lib/voice-stage-utils"
import { VoiceStageFilmstrip } from "@/components/voice/VoiceStageFilmstrip"
import { StableLiveKitRoom } from "@/components/voice/StableLiveKitRoom"
import { AgentLocalVideoPip } from "@/components/voice/AgentLocalVideoPip"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"
import {
  formatVoiceDuration,
  voiceAvatarRingColor,
  voiceInitials,
} from "@/lib/voice-ui-utils"
import { getParticipantRole, isHostParticipant } from "@/components/voice/voice-participant-utils"
import { useParticipantAudioLevel } from "@/components/voice/useParticipantAudioLevel"
import { VoiceReactionsLayer, sendVoiceReaction } from "@/components/voice/VoiceReactionsLayer"
import { ChatPanel } from "@/components/voice/ChatPanel"
import { decodeVoiceData } from "@/lib/voice-room-data"
import { isTransientLiveKitError } from "@/lib/livekit-error-utils"
import { useLiveKitRoomErrors } from "@/components/voice/useLiveKitRoomErrors"

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
  /** Channel live: fetch tokens from channel join API */
  channelId?: string
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
  pendingVideo,
  canPublishVideo,
  onTokenUpgrade,
  onSpeakActivated,
  onVideoActivated,
  channelId,
}: {
  roomName: string
  channelId?: string
  pendingSpeak: boolean
  pendingVideo: boolean
  canPublishVideo: boolean
  onTokenUpgrade: (token: string, opts?: { video?: boolean }) => void
  onSpeakActivated: () => void
  onVideoActivated: () => void
}) {
  const router = useRouter()
  const { isMobile } = useVoiceDeviceLayout()
  const room = useRoomContext()
  useLiveKitRoomErrors(room)
  const connectionState = useConnectionState()
  const participants = useParticipants()
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant()
  const [handRaised, setHandRaised] = useState(false)
  const [videoAllowedByHost, setVideoAllowedByHost] = useState(false)
  const [enablingCamera, setEnablingCamera] = useState(false)
  const [canSpeak, setCanSpeak] = useState(false)
  const [wasDemoted, setWasDemoted] = useState(false)
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [connectingMic, setConnectingMic] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [reactionsOpen, setReactionsOpen] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)

  const fetchAgentToken = useCallback(
    async (opts: { speak?: boolean; video?: boolean }) => {
      const params = new URLSearchParams()
      if (channelId) {
        if (opts.speak) params.set("speak", "1")
        if (opts.video) params.set("video", "1")
      } else {
        params.set("roomName", roomName)
        if (opts.speak) params.set("speak", "1")
        if (opts.video) params.set("video", "1")
      }
      const url = channelId
        ? `/api/agent/channels/${channelId}/live/join?${params}`
        : `/api/agent/voice-rooms/token?${params}`
      const res = await fetch(url, {
        headers: getAgentAuthHeaders(),
        credentials: "same-origin",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not refresh token")
      return {
        token: data.token as string,
        canPublishVideo: data.canPublishVideo === true,
      }
    },
    [roomName, channelId],
  )

  const handleUnmuteCommand = useCallback(() => {
    void (async () => {
      setConnectingMic(true)
      try {
        const { token, canPublishVideo: withVideo } = await fetchAgentToken({
          speak: true,
          video: false,
        })
        await room.disconnect()
        onTokenUpgrade(token, { video: withVideo })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not go live")
        setConnectingMic(false)
      }
    })()
  }, [room, fetchAgentToken, onTokenUpgrade])

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
      if (topic === VOICE_TOPIC_VIDEO_PERMISSION) {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload)) as {
            identity?: string
            allowed?: boolean
          }
          if (msg.identity === localParticipant.identity) {
            setVideoAllowedByHost(msg.allowed === true)
            if (!msg.allowed) {
              void localParticipant.setCameraEnabled(false)
              toast.message("Host disabled your camera")
            } else {
              toast.message("Host allowed video — tap the camera button to go live")
            }
          }
        } catch {
          /* ignore */
        }
      }
      if (topic === VOICE_TOPIC_DEMOTE) {
        const msg = decodeVoiceData(payload)
        if (msg?.type === "demote" && msg.identity === localParticipant.identity) {
          setCanSpeak(false)
          setWasDemoted(true)
          setHandRaised(false)
          setVideoAllowedByHost(false)
          void localParticipant.setMicrophoneEnabled(false)
          void localParticipant.setCameraEnabled(false)
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
    if (!pendingVideo || connectionState !== ConnectionState.Connected) return
    void (async () => {
      const result = await setParticipantCameraEnabled(localParticipant, true, isMobile)
      if (result.ok) {
        toast.success("Camera is on")
      } else {
        toast.error(result.message, { duration: result.denied ? 8000 : 5000 })
      }
      setEnablingCamera(false)
      onVideoActivated()
    })()
  }, [pendingVideo, connectionState, localParticipant, onVideoActivated, isMobile])

  const turnOnCamera = () => {
    if (!canSpeak) {
      toast.error("Wait until the host lets you speak")
      return
    }
    if (isCameraEnabled) {
      void localParticipant.setCameraEnabled(false)
      return
    }
    void (async () => {
      setEnablingCamera(true)
      try {
        if (!canPublishVideo && !videoAllowedByHost) {
          toast.error("The host has not allowed video yet")
          setEnablingCamera(false)
          return
        }
          if (!canPublishVideo) {
          const { token, canPublishVideo: withVideo } = await fetchAgentToken({
            speak: true,
            video: true,
          })
          if (!withVideo) throw new Error("Video not permitted")
          await room.disconnect()
          onTokenUpgrade(token, { video: true, activateVideo: true })
          return
        }
        const result = await setParticipantCameraEnabled(localParticipant, true, isMobile)
        if (result.ok) {
          toast.success("Camera is on")
        } else {
          toast.error(result.message, { duration: result.denied ? 8000 : 5000 })
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not enable camera")
      } finally {
        setEnablingCamera(false)
      }
    })()
  }

  useEffect(() => {
    if (connectionState === ConnectionState.Connected && !canSpeak && !pendingSpeak) {
      void localParticipant.setMicrophoneEnabled(false)
    }
  }, [connectionState, canSpeak, pendingSpeak, localParticipant])

  // Join with camera off; agent enables only after host grants video permission.
  useEffect(() => {
    if (connectionState === ConnectionState.Connected && !pendingVideo) {
      void localParticipant.setCameraEnabled(false)
    }
  }, [connectionState, localParticipant, pendingVideo])

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

  const mainStageParticipant = useMemo(
    () =>
      pickMainStageParticipant({
        localParticipant,
        participants,
        allowLocalFallback: false,
      }),
    [localParticipant, participants],
  )

  const filmstripParticipants = useMemo(
    () => pickFilmstripParticipants(mainStageParticipant, participants),
    [mainStageParticipant, participants],
  )

  const displayName = mainStageParticipant?.name || mainStageParticipant?.identity || "Host"
  const hostLevel = useParticipantAudioLevel(mainStageParticipant ?? localParticipant)
  const hostMicPub = mainStageParticipant?.getTrackPublication(Track.Source.Microphone)
  const hostHasAudio = hostMicPub && !hostMicPub.isMuted
  const hostCamPub = mainStageParticipant?.getTrackPublication(Track.Source.Camera)
  const hostShowVideo = Boolean(mainStageParticipant && participantHasCamera(mainStageParticipant))

  const hostVideoBadge = mainStageParticipant
    ? mainStageParticipant.identity === localParticipant.identity
      ? "agent"
      : isHostParticipant(mainStageParticipant.identity, getParticipantRole(mainStageParticipant))
        ? "host"
        : "speaker"
    : undefined

  const mayUseCamera = canSpeak && (canPublishVideo || videoAllowedByHost)

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

      <AgentLocalVideoPip />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pb-2">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4 min-h-0">
          {mainStageParticipant ? (
            <div className="flex flex-col items-center gap-3 w-full flex-1 min-h-0 mx-auto">
              {hostShowVideo && hostCamPub ? (
                <div className="w-full flex flex-1 justify-center items-center min-h-0 px-1">
                  <VoiceVideoFrame
                    participant={mainStageParticipant}
                    publication={hostCamPub}
                    badge={hostVideoBadge}
                    mirror={mainStageParticipant.identity === localParticipant.identity}
                    enableFullscreen
                    enablePinchZoom
                    maxWidthClass="max-w-none"
                    className="w-full max-w-[min(100%,420px)] md:max-w-[min(55vw,480px)]"
                  />
                </div>
              ) : (
                <MeetAvatar
                  name={displayName}
                  identity={mainStageParticipant.identity}
                  size="lg"
                  isSpeaking={mainStageParticipant.isSpeaking || hostLevel > 0.08}
                  showWave={!!hostHasAudio || mainStageParticipant.isSpeaking}
                />
              )}
              <p className="text-lg font-medium shrink-0">{displayName.split(" ")[0]}</p>
              <p className="text-xs text-[#9aa0a6] shrink-0">
                {mainStageParticipant.identity === localParticipant.identity
                  ? "You"
                  : isHostParticipant(mainStageParticipant.identity, getParticipantRole(mainStageParticipant))
                    ? "Host"
                    : "Speaker"}
              </p>
              <VoiceStageFilmstrip
                participants={filmstripParticipants}
                localIdentity={localParticipant.identity}
              />
            </div>
          ) : (
            <div className="text-center text-[#9aa0a6] text-sm px-4">
              <p className="text-base mb-1">Waiting for host video…</p>
              <p className="text-xs">The host will appear here when their camera is on.</p>
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
            className={`h-11 w-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center ${
              handRaised ? "bg-amber-700 text-white" : "bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d51]"
            }`}
            title="Raise hand"
          >
            <Hand className="h-5 w-5" />
          </button>
        )}

        {canSpeak && (
          <button
            type="button"
            disabled={!mayUseCamera || enablingCamera || connectingMic}
            onClick={turnOnCamera}
            className={`h-11 w-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center ${
              isCameraEnabled ? "text-white" : "bg-[#3c4043] text-[#9aa0a6]"
            } ${!mayUseCamera ? "opacity-40" : ""}`}
            style={isCameraEnabled ? { background: MEET_GREEN } : undefined}
            title={
              !mayUseCamera
                ? "Video not allowed by host"
                : isCameraEnabled
                  ? "Turn off camera"
                  : "Turn on camera"
            }
          >
            {enablingCamera ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isCameraEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>
        )}

        <Sheet open={reactionsOpen} onOpenChange={setReactionsOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              disabled={!connected}
              className="h-11 w-11 rounded-full bg-[#3c4043] text-[#e8eaed] flex items-center justify-center hover:bg-[#4a4d51] disabled:opacity-40"
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
                className="h-11 w-11 rounded-full bg-[#3c4043] text-[#e8eaed] flex items-center justify-center text-xs font-medium"
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

export function VoiceRoomAgentClient({
  token: initialToken,
  serverUrl,
  roomName,
  channelId,
}: Props) {
  const [joined, setJoined] = useState(false)
  const [lkToken, setLkToken] = useState(initialToken)
  const [roomKey, setRoomKey] = useState(0)
  const [pendingSpeak, setPendingSpeak] = useState(false)
  const [pendingVideo, setPendingVideo] = useState(false)
  const [canPublishVideo, setCanPublishVideo] = useState(false)
  const { roomOptions } = useVoiceDeviceLayout()

  const handleTokenUpgrade = useCallback(
    (newToken: string, opts?: { video?: boolean; activateVideo?: boolean }) => {
      setLkToken(newToken)
      setRoomKey((k) => k + 1)
      setPendingSpeak(true)
      if (opts?.video) setCanPublishVideo(true)
      if (opts?.activateVideo) setPendingVideo(true)
    },
    [],
  )

  if (!joined) {
    return <PreJoinScreen roomName={roomName} onJoin={() => setJoined(true)} />
  }

  return (
    <StableLiveKitRoom
      key={roomKey}
      token={lkToken}
      serverUrl={serverUrl}
      connect={joined}
      audio
      video={false}
      options={{ ...roomOptions, disconnectOnPageLeave: false }}
      onError={(e) => {
        if (!isTransientLiveKitError(e.message)) toast.error(e.message)
      }}
      className="min-h-[100dvh]"
      style={{ background: MEET_BG }}
    >
      <AgentRoomUI
        roomName={roomName}
        channelId={channelId}
        pendingSpeak={pendingSpeak}
        pendingVideo={pendingVideo}
        canPublishVideo={canPublishVideo}
        onTokenUpgrade={handleTokenUpgrade}
        onSpeakActivated={() => setPendingSpeak(false)}
        onVideoActivated={() => setPendingVideo(false)}
      />
      <RoomAudioRenderer />
    </StableLiveKitRoom>
  )
}
