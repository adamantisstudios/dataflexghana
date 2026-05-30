"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import {
  RoomAudioRenderer,
  useConnectionQualityIndicator,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionQuality, ConnectionState, RoomEvent, Track, type Participant } from "livekit-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  Loader2,
  Upload,
  Mic,
  MicOff,
  Hand,
  X,
  Users,
  Circle,
  UserPlus,
  Bell,
  Video,
  VideoOff,
  Smile,
  MoreVertical,
  PhoneOff,
  MessageCircle,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import {
  VOICE_ALLOWED_FILE_TYPES,
  VOICE_TOPIC_HAND_RAISE,
  VOICE_TOPIC_ADMIN_SHARE,
  VOICE_REACTION_EMOJIS,
} from "@/lib/voice-room-topics"
import { VoiceStreamStats } from "@/components/voice/VoiceStreamStats"
import { VoicePollPanel } from "@/components/voice/VoicePollPanel"
import { VoiceParticipantsSheet } from "@/components/voice/VoiceParticipantsSheet"
import { voiceAvatarRingColor, voiceInitials } from "@/lib/voice-ui-utils"
import { getParticipantRole, isHostParticipant, isSpeakerRole } from "@/components/voice/voice-participant-utils"
import { isTransientLiveKitError } from "@/lib/livekit-error-utils"
import { useLiveKitRoomErrors } from "@/components/voice/useLiveKitRoomErrors"
import { useParticipantAudioLevel } from "@/components/voice/useParticipantAudioLevel"
import { VoiceAudioMeter } from "@/components/voice/VoiceAudioMeter"
import { VoiceReactionsLayer } from "@/components/voice/VoiceReactionsLayer"
import { ChatPanel } from "@/components/voice/ChatPanel"
import { AdminLocalVideoPreview } from "@/components/voice/AdminLocalVideoPreview"
import { VoiceVideoFrame } from "@/components/voice/VoiceVideoFrame"
import { setParticipantCameraEnabled } from "@/lib/enable-participant-camera"
import { useVoiceDeviceLayout } from "@/lib/voice-video-utils"
import {
  pickFilmstripParticipants,
  pickMainStageParticipant,
  participantHasCamera,
} from "@/lib/voice-stage-utils"
import { VoiceStageFilmstrip } from "@/components/voice/VoiceStageFilmstrip"
import { StableLiveKitRoom } from "@/components/voice/StableLiveKitRoom"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const MEET_BG = "#202124"
const MEET_TEXT = "#e8eaed"
const MEET_GREEN = "#0E8F3D"

type RaisedHand = {
  identity: string
  name: string
}

type Props = {
  roomId: string
  roomName: string
  token: string
  serverUrl: string
  recordingEnabled?: boolean
  /** Override moderation API base, e.g. `/api/channel-live/{sessionId}` */
  moderationApiBase?: string
  hideRecording?: boolean
  hideNotify?: boolean
  /** When false, audio-only room (channel audio live). Default true. */
  enableVideo?: boolean
  onClose: () => void
  onEnded: () => void
}

function connectionHealthColor(quality: ConnectionQuality | undefined): string {
  if (quality === ConnectionQuality.Excellent || quality === ConnectionQuality.Good) return "bg-emerald-400"
  if (quality === ConnectionQuality.Poor) return "bg-amber-400"
  return "bg-red-500"
}

const ICON_BTN =
  "h-11 w-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed] shrink-0"

function MeetChipAvatar({ participant, compact }: { participant: Participant; compact?: boolean }) {
  const level = useParticipantAudioLevel(participant)
  const ring = voiceAvatarRingColor(participant.identity)
  const micPub = participant.getTrackPublication(Track.Source.Microphone)
  const hasAudio = !!micPub?.track && !micPub.isMuted
  const dim = compact ? "h-9 w-9 text-[10px]" : "h-10 w-10 text-xs"

  return (
    <div className="flex items-center gap-2 shrink-0 rounded-full bg-[#3c4043] pl-1 pr-2 py-1">
      <div className="relative">
        <div
          className={`rounded-full flex items-center justify-center font-semibold text-white ${dim} ${
            participant.isSpeaking || level > 0.08 ? "animate-voice-soundwave" : ""
          }`}
          style={{
            boxShadow: `0 0 0 2px ${ring}`,
            background: `linear-gradient(135deg, ${ring}99, ${ring})`,
          }}
        >
          {voiceInitials(participant.name || participant.identity)}
        </div>
        {hasAudio && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#0E8F3D] border border-[#292a2d]" />
        )}
      </div>
      <span className="text-xs text-[#e8eaed] max-w-[72px] truncate">
        {(participant.name || participant.identity).split(" ")[0]}
      </span>
    </div>
  )
}

function SpeakerChipBar({
  speakers,
  busy,
  onMute,
  stageHasVideo,
}: {
  speakers: Participant[]
  busy: string | null
  onMute: (identity: string) => void
  stageHasVideo?: boolean
}) {
  if (speakers.length === 0 && !stageHasVideo) {
    return <span className="text-xs text-[#9aa0a6] px-2">No speakers on stage</span>
  }
  if (speakers.length === 0) {
    return null
  }
  return (
    <>
      {speakers.map((p) => {
        const micPub = p.getTrackPublication(Track.Source.Microphone)
        const muted = micPub?.isMuted ?? !p.isMicrophoneEnabled
        return (
          <div key={p.identity} className="flex items-center gap-1 shrink-0">
            <MeetChipAvatar participant={p} compact />
            <button
              type="button"
              disabled={busy === p.identity}
              onClick={() => onMute(p.identity)}
              className="h-8 w-8 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center text-[#e8eaed]"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" style={{ color: MEET_GREEN }} />}
            </button>
          </div>
        )
      })}
    </>
  )
}

function StreamHealthDot() {
  const { localParticipant } = useLocalParticipant()
  const { quality } = useConnectionQualityIndicator({ participant: localParticipant })
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full shrink-0 ${connectionHealthColor(quality)}`}
      title={`Connection: ${quality ?? "unknown"}`}
    />
  )
}

function MainStage({
  stageParticipant,
  localParticipant,
  filmstrip,
}: {
  stageParticipant: Participant | null
  localParticipant: Participant
  filmstrip: Participant[]
}) {
  const { isMobile } = useVoiceDeviceLayout()
  const focus = stageParticipant
  const level = useParticipantAudioLevel(focus ?? localParticipant)
  const ring = voiceAvatarRingColor(focus?.identity ?? "stage")

  if (focus && participantHasCamera(focus)) {
    const camPub = focus.getTrackPublication(Track.Source.Camera)!
    const isLocal = focus.identity === localParticipant.identity
    const badge =
      isLocal || focus.identity.startsWith("admin-") || isHostParticipant(focus.identity, getParticipantRole(focus))
        ? "admin"
        : "agent"

    return (
      <div className="flex flex-col items-center w-full min-h-0 flex-1 gap-3">
        <div
          className={`w-full flex flex-1 justify-center items-center min-h-0 ${
            isMobile ? "px-1" : "px-2"
          }`}
        >
          <VoiceVideoFrame
            participant={focus}
            publication={camPub}
            badge={badge}
            mirror={isLocal}
            enableFullscreen={isMobile}
            maxWidthClass="max-w-none"
            className="w-full max-w-[min(100%,420px)] md:max-w-[min(55vw,480px)] h-auto"
          />
        </div>
        <p className="text-sm font-medium text-[#e8eaed] truncate max-w-full px-4 shrink-0">
          {isLocal ? "You (host)" : focus.name || focus.identity}
        </p>
        <VoiceStageFilmstrip participants={filmstrip} localIdentity={localParticipant.identity} />
      </div>
    )
  }

  if (focus) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          {(focus.isSpeaking || level > 0.08) && (
            <span
              className="absolute inset-0 rounded-full border-2 animate-voice-soundwave"
              style={{ borderColor: `${MEET_GREEN}99` }}
            />
          )}
          <div
            className="h-40 w-40 rounded-full flex items-center justify-center text-4xl font-bold text-white"
            style={{
              boxShadow: `0 0 0 4px ${ring}`,
              background: `linear-gradient(135deg, ${ring}99, ${ring})`,
            }}
          >
            {voiceInitials(focus.name || focus.identity)}
          </div>
        </div>
        <p className="text-xl font-medium text-[#e8eaed] truncate max-w-full px-4">
          {focus.name || focus.identity}
        </p>
        <VoiceAudioMeter level={level} className="w-32" />
        <VoiceStageFilmstrip participants={filmstrip} localIdentity={localParticipant.identity} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-[#9aa0a6] px-4 text-center">
      <p className="text-lg">Ready to go live</p>
      <p className="text-xs">Turn on your camera to appear on stage, or wait for a guest to join with video.</p>
    </div>
  )
}

function HostControlButtons({
  isMicrophoneEnabled,
  isCameraEnabled,
  localParticipant,
  onEndRoom,
  onToggleCamera,
  speakers,
  busy,
  onMute,
  enableVideo = true,
  stageHasVideo = false,
}: {
  isMicrophoneEnabled: boolean
  isCameraEnabled: boolean
  localParticipant: Participant
  onEndRoom: () => void
  onToggleCamera: () => void | Promise<void>
  speakers: Participant[]
  busy: string | null
  onMute: (id: string) => void
  enableVideo?: boolean
  stageHasVideo?: boolean
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        className={`${ICON_BTN} ${isMicrophoneEnabled ? "text-white" : ""}`}
        style={isMicrophoneEnabled ? { background: MEET_GREEN } : undefined}
        title="Microphone"
      >
        {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button" className={`${ICON_BTN} bg-[#ea4335] hover:bg-[#d93025]`} title="End call">
            <PhoneOff className="h-5 w-5" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#292a2d] border-[#3c4043] text-[#e8eaed]">
          <AlertDialogHeader>
            <AlertDialogTitle>End Agent Conference?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9aa0a6]">
              Everyone will be disconnected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#3c4043] text-[#e8eaed] border border-[#5f6368] hover:bg-[#4a4d51] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="bg-[#ea4335]" onClick={() => void onEndRoom()}>
              End call
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {enableVideo && (
        <button
          type="button"
          onClick={() => void onToggleCamera()}
          className={ICON_BTN}
          style={isCameraEnabled ? { background: MEET_GREEN } : undefined}
          title={isCameraEnabled ? "Stop camera" : "Start camera"}
        >
          {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
      )}
      <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto px-1">
        <SpeakerChipBar
          speakers={speakers}
          busy={busy}
          onMute={onMute}
          stageHasVideo={stageHasVideo}
        />
      </div>
    </>
  )
}

function AdminDesktopSidebar({
  raisedHands,
  busy,
  allowHand,
  declineHand,
  sessionStart,
  recordingActive,
  participants,
  videoBusy,
  onToggleVideo,
  onInviteOpen,
  roomName,
  localParticipant,
  enableVideo = true,
}: {
  raisedHands: RaisedHand[]
  busy: string | null
  allowHand: (h: RaisedHand) => void
  declineHand: (id: string) => void
  sessionStart: number
  recordingActive: boolean
  participants: Participant[]
  videoBusy: string | null
  onToggleVideo: (identity: string, allowed: boolean) => void
  onInviteOpen: () => void
  roomName: string
  localParticipant: Participant
  enableVideo?: boolean
}) {
  return (
    <div className="flex flex-col h-full min-h-0 gap-2 p-2 overflow-y-auto">
      <div className="shrink-0 flex flex-wrap gap-2 items-center justify-between text-[10px] text-[#9aa0a6]">
        <VoiceStreamStats sessionStart={sessionStart} />
        {recordingActive && (
          <span className="text-red-300 flex items-center gap-1">
            <Circle className="h-1.5 w-1.5 fill-red-500 animate-pulse" /> REC
          </span>
        )}
        <StreamHealthDot />
      </div>
      <section className="shrink-0 rounded-lg border border-[#3c4043] p-2">
        <h3 className="text-[10px] uppercase text-amber-300 flex items-center gap-1 mb-2">
          <Hand className="h-3 w-3" /> Hands <Badge className="h-4 px-1 text-[9px]">{raisedHands.length}</Badge>
        </h3>
        <ul className="max-h-28 overflow-y-auto space-y-1">
          {raisedHands.length === 0 ? (
            <li className="text-[10px] text-[#9aa0a6] text-center py-2">Empty</li>
          ) : (
            raisedHands.map((h) => (
              <li key={h.identity} className="flex gap-1 items-center">
                <span className="text-[11px] truncate flex-1">{h.name}</span>
                <button
                  type="button"
                  className="h-8 w-8 rounded bg-[#0E8F3D] text-[10px] shrink-0"
                  disabled={busy === h.identity}
                  onClick={() => void allowHand(h)}
                >
                  OK
                </button>
                <button
                  type="button"
                  className="h-8 w-8 rounded border border-[#5f6368] text-[10px] shrink-0"
                  onClick={() => declineHand(h.identity)}
                >
                  No
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
      <div className="shrink-0 flex gap-2 flex-wrap items-center">
        <button type="button" className={`${ICON_BTN} !h-8 !w-8 !min-h-8 !min-w-8`} onClick={onInviteOpen} title="Invite">
          <UserPlus className="h-4 w-4" />
        </button>
        <VoicePollPanel isAdmin compact />
        <ChatPanel
          roomName={roomName}
          senderName={localParticipant.name || "Host"}
          senderAgentId={null}
          apiMode="admin"
          isAdmin
          sheetSide="right"
          triggerClassName={`${ICON_BTN} !h-8 !w-8 !min-h-8 !min-w-8`}
        />
      </div>
      <section className="flex-1 min-h-[120px] flex flex-col rounded-lg border border-[#3c4043] overflow-hidden">
        <h3 className="text-[10px] uppercase text-[#9aa0a6] px-2 py-1.5 border-b border-[#3c4043] shrink-0">
          Participants ({participants.length})
        </h3>
        <ul className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          {participants.map((p) => {
            const role = getParticipantRole(p)
            const ring = voiceAvatarRingColor(p.identity)
            let videoAllowed = false
            try {
              const meta = p.metadata ? JSON.parse(p.metadata) : {}
              videoAllowed = meta.videoAllowed === true || meta.videoAllowed === "true"
            } catch {
              /* ignore */
            }
            videoAllowed = videoAllowed || p.attributes?.videoAllowed === "true"
            const showVideoToggle = enableVideo && !p.isLocal && isSpeakerRole(role)
            return (
              <li
                key={p.identity}
                className="flex items-center gap-1 rounded-md bg-[#3c4043]/50 px-1.5 py-1"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{
                    boxShadow: `0 0 0 2px ${ring}`,
                    background: `linear-gradient(135deg, ${ring}99, ${ring})`,
                  }}
                >
                  {voiceInitials(p.name || p.identity)}
                </div>
                <span className="text-[10px] truncate flex-1">{p.name || p.identity}</span>
                {showVideoToggle && (
                  <button
                    type="button"
                    disabled={videoBusy === p.identity}
                    onClick={() => void onToggleVideo(p.identity, !videoAllowed)}
                    className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center hover:bg-[#4a4d51]"
                    title={videoAllowed ? "Revoke video" : "Allow video"}
                  >
                    {videoAllowed ? (
                      <Video className="h-3.5 w-3.5 text-[#0E8F3D]" />
                    ) : (
                      <VideoOff className="h-3.5 w-3.5 text-[#9aa0a6]" />
                    )}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function ControlPanelInner({
  roomId,
  roomName,
  recordingEnabled,
  moderationApiBase,
  hideRecording,
  hideNotify,
  enableVideo = true,
  onEnded,
}: {
  roomId: string
  roomName: string
  recordingEnabled: boolean
  moderationApiBase?: string
  hideRecording?: boolean
  hideNotify?: boolean
  enableVideo?: boolean
  onEnded: () => void
}) {
  const modBase = moderationApiBase ?? `/api/admin/voice-rooms/${roomId}`
  const room = useRoomContext()
  const { isMobile } = useVoiceDeviceLayout()
  useLiveKitRoomErrors(room)
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant()
  const participants = useParticipants()
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [recordingActive, setRecordingActive] = useState(false)
  const [egressId, setEgressId] = useState<string | null>(null)
  const [participantTick, setParticipantTick] = useState(0)
  const [videoBusy, setVideoBusy] = useState<string | null>(null)
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [handsSheetOpen, setHandsSheetOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const sessionStart = useRef(Date.now())

  const toggleHostCamera = useCallback(async () => {
    if (!enableVideo) return
    const result = await setParticipantCameraEnabled(
      localParticipant,
      !isCameraEnabled,
      isMobile,
    )
    if (!result.ok) {
      toast.error(result.message, { duration: result.denied ? 8000 : 5000 })
    }
  }, [enableVideo, localParticipant, isCameraEnabled, isMobile])

  useEffect(() => {
    if (!enableVideo || room.state === ConnectionState.Disconnected) return

    const enableHostCamera = async () => {
      const result = await setParticipantCameraEnabled(localParticipant, true, isMobile)
      if (!result.ok) {
        console.warn("[voice-host] camera enable failed:", result.message)
        toast.error(result.message, { duration: result.denied ? 8000 : 5000 })
      }
    }

    if (room.state === ConnectionState.Connected) {
      void enableHostCamera()
      return
    }

    const onConnected = () => void enableHostCamera()
    room.on(RoomEvent.Connected, onConnected)
    return () => {
      room.off(RoomEvent.Connected, onConnected)
    }
  }, [enableVideo, room, localParticipant, isMobile])

  useEffect(() => {
    const bump = () => setParticipantTick((n) => n + 1)
    room.on(RoomEvent.TrackPublished, bump)
    room.on(RoomEvent.TrackUnpublished, bump)
    room.on(RoomEvent.TrackMuted, bump)
    room.on(RoomEvent.TrackUnmuted, bump)
    room.on(RoomEvent.ParticipantConnected, bump)
    room.on(RoomEvent.ParticipantDisconnected, bump)
    return () => {
      room.off(RoomEvent.TrackPublished, bump)
      room.off(RoomEvent.TrackUnpublished, bump)
      room.off(RoomEvent.TrackMuted, bump)
      room.off(RoomEvent.TrackUnmuted, bump)
      room.off(RoomEvent.ParticipantConnected, bump)
      room.off(RoomEvent.ParticipantDisconnected, bump)
    }
  }, [room])

  useEffect(() => {
    room.registerTextStreamHandler(VOICE_TOPIC_HAND_RAISE, async (reader, participantInfo) => {
      try {
        const text = await reader.readAll()
        let payload: { identity?: string; name?: string } = {}
        try {
          payload = JSON.parse(text)
        } catch {
          payload = { identity: participantInfo?.identity, name: participantInfo?.name }
        }
        const identity = payload.identity || participantInfo?.identity
        const name = payload.name || participantInfo?.name || identity
        if (!identity) return
        setRaisedHands((prev) => {
          if (prev.some((h) => h.identity === identity)) return prev
          return [...prev, { identity, name: name || identity }]
        })
      } catch (e) {
        console.error("[admin voice] hand-raise", e)
      }
    })
    return () => room.unregisterTextStreamHandler(VOICE_TOPIC_HAND_RAISE)
  }, [room])

  const modHeaders =
    moderationApiBase != null
      ? { "Content-Type": "application/json", ...getAgentAuthHeaders() }
      : { "Content-Type": "application/json", ...getAdminAuthHeaders() }

  const adminAction = useCallback(
    async (path: string, body: Record<string, string>) => {
      const res = await fetch(`${modBase}/${path}`, {
        method: "POST",
        headers: modHeaders,
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      return data
    },
    [modBase, modHeaders],
  )

  const inviteToSpeak = async (identity: string, name: string) => {
    setBusy(identity)
    setInviteOpen(false)
    try {
      await adminAction("unmute", { identity })
      setParticipantTick((n) => n + 1)
      toast.success(`${name} can speak now`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  const allowHand = async (hand: RaisedHand) => {
    setBusy(hand.identity)
    try {
      await adminAction("unmute", { identity: hand.identity })
      setRaisedHands((prev) => prev.filter((h) => h.identity !== hand.identity))
      setParticipantTick((n) => n + 1)
      toast.success("Speaker approved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  const declineHand = (identity: string) => {
    setRaisedHands((prev) => prev.filter((h) => h.identity !== identity))
    toast.message("Request declined")
  }

  const toggleParticipantVideo = async (identity: string, allowed: boolean) => {
    setVideoBusy(identity)
    try {
      const res = await fetch(`${modBase}/video-permission`, {
        method: "POST",
        headers: modHeaders,
        body: JSON.stringify({ identity, allowed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setParticipantTick((n) => n + 1)
      toast.success(allowed ? "Video enabled for speaker" : "Video disabled")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setVideoBusy(null)
    }
  }

  const muteParticipant = async (identity: string) => {
    setBusy(identity)
    try {
      await adminAction("mute", { identity })
      setParticipantTick((n) => n + 1)
      toast.success("Muted")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  const endRoom = async () => {
    setBusy("end")
    try {
      await fetch(`${modBase}/end`, {
        method: "POST",
        headers: modHeaders,
      })
      await room.disconnect()
      toast.success("Conference ended")
      onEnded()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to end room")
    } finally {
      setBusy(null)
    }
  }

  const notifyHostLive = async () => {
    if (hideNotify) return
    setBusy("notify")
    try {
      const res = await fetch(`/api/admin/voice-rooms/${roomId}/notify-live`, {
        method: "POST",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Notify failed")
      toast.success(`Notified ${data.agentsNotified ?? 0} agents`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Notify failed")
    } finally {
      setBusy(null)
    }
  }

  const muteAllSpeakers = async () => {
    setBusy("mute-all")
    try {
      const data = await adminAction("mute-all", {})
      setParticipantTick((n) => n + 1)
      toast.success(`Muted ${data.mutedCount ?? 0} speaker(s)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  const toggleRecording = async () => {
    if (hideRecording) return
    setBusy("recording")
    try {
      if (recordingActive && egressId) {
        const res = await fetch(`/api/admin/voice-rooms/${roomId}/recording`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
          body: JSON.stringify({ action: "stop", egressId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Stop failed")
        setRecordingActive(false)
        setEgressId(null)
        toast.success("Recording stopped")
      } else {
        const res = await fetch(`/api/admin/voice-rooms/${roomId}/recording`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
          body: JSON.stringify({ action: "start" }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Start failed")
        setRecordingActive(true)
        setEgressId(data.egressId ?? null)
        toast.success("Recording started")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Recording failed")
    } finally {
      setBusy(null)
    }
  }

  const shareFile = async (file: File) => {
    if (!VOICE_ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and PDF are supported")
      return
    }
    try {
      await localParticipant.sendFile(file, { topic: VOICE_TOPIC_ADMIN_SHARE })
      toast.success("File shared with room")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Share failed")
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void shareFile(f)
  }

  const remoteParticipants = participants.filter((p) => !p.isLocal)
  void participantTick

  const listeners = useMemo(
    () => remoteParticipants.filter((p) => !isSpeakerRole(getParticipantRole(p))),
    [remoteParticipants],
  )

  const speakers = useMemo(
    () => remoteParticipants.filter((p) => isSpeakerRole(getParticipantRole(p))),
    [remoteParticipants],
  )

  const mainStageParticipant = useMemo(
    () =>
      pickMainStageParticipant({
        localParticipant,
        participants,
        allowLocalFallback: true,
      }),
    [localParticipant, participants],
  )

  const filmstripParticipants = useMemo(
    () => pickFilmstripParticipants(mainStageParticipant, participants),
    [mainStageParticipant, participants],
  )

  const showLocalPip =
    enableVideo &&
    mainStageParticipant?.identity !== localParticipant.identity &&
    participantHasCamera(localParticipant)

  const stageHasVideo = Boolean(
    mainStageParticipant && participantHasCamera(mainStageParticipant),
  )

  const listenerAvatars = useMemo(() => listeners.slice(0, 16), [listeners])

  return (
    <div className="flex flex-col h-full min-h-0 relative" style={{ color: MEET_TEXT }}>
      <VoiceReactionsLayer />
      {showLocalPip && <AdminLocalVideoPreview />}

      {raisedHands.length > 0 && (
        <div className="shrink-0 mx-3 mt-2 px-3 py-2 rounded-lg bg-amber-900/40 border border-amber-600/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Hand className="h-4 w-4 text-amber-300 shrink-0" />
            <span className="text-sm truncate">
              {raisedHands[0].name} raised a hand
              {raisedHands.length > 1 ? ` (+${raisedHands.length - 1} more)` : ""}
            </span>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              size="sm"
              className="h-8 text-xs"
              style={{ background: MEET_GREEN }}
              disabled={busy === raisedHands[0].identity}
              onClick={() => void allowHand(raisedHands[0])}
            >
              Allow
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-[#5f6368]"
              onClick={() => declineHand(raisedHands[0].identity)}
            >
              Decline
            </Button>
          </div>
        </div>
      )}

      <div className="shrink-0 px-2 sm:px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-[#9aa0a6] min-w-0 overflow-hidden">
        <span className="flex items-center gap-2 shrink-0">
          <Users className="h-4 w-4" style={{ color: MEET_GREEN }} />
          <span className="truncate">
            {remoteParticipants.length} in room · {participants.length} connected
            {stageHasVideo ? " · live video" : ""}
          </span>
        </span>
        <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden">
          <VoiceStreamStats sessionStart={sessionStart.current} />
          {recordingActive && (
            <span className="inline-flex items-center gap-1 text-red-300">
              <Circle className="h-1.5 w-1.5 fill-red-500 animate-recording-pulse" />
              REC
            </span>
          )}
          <StreamHealthDot />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <div
          className={`flex-1 lg:w-[70%] flex flex-col min-h-0 min-w-0 px-3 lg:px-4 pb-2 lg:pb-0 ${
            dragOver ? "ring-2 ring-[#0E8F3D]" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="flex-1 flex items-center justify-center min-h-0 py-3 lg:py-4">
            <MainStage
              stageParticipant={mainStageParticipant}
              localParticipant={localParticipant}
              filmstrip={filmstripParticipants}
            />
          </div>
          {listenerAvatars.length > 0 && (
            <div className="shrink-0 pb-2 lg:pb-4">
              <p className="text-[10px] uppercase tracking-wider text-[#9aa0a6] text-center mb-2">
                Listeners
              </p>
              <div className="flex gap-2 overflow-x-auto justify-center pb-1">
                {listenerAvatars.map((p) => {
                  const ring = voiceAvatarRingColor(p.identity)
                  return (
                    <div key={p.identity} className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          boxShadow: `0 0 0 2px ${ring}`,
                          background: `linear-gradient(135deg, ${ring}99, ${ring})`,
                        }}
                      >
                        {voiceInitials(p.name || p.identity)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <footer
            className="hidden lg:flex shrink-0 h-14 border-t border-[#3c4043] px-2 items-center gap-2 mt-2"
            style={{ background: "#292a2d" }}
          >
            <HostControlButtons
              isMicrophoneEnabled={isMicrophoneEnabled}
              isCameraEnabled={isCameraEnabled}
              localParticipant={localParticipant}
              onEndRoom={endRoom}
              onToggleCamera={toggleHostCamera}
              speakers={speakers}
              busy={busy}
              onMute={(id) => void muteParticipant(id)}
              enableVideo={enableVideo}
              stageHasVideo={stageHasVideo}
            />
          </footer>
        </div>

        <aside className="hidden lg:flex lg:w-[30%] flex-col min-h-0 border-l border-[#3c4043] bg-[#292a2d]/80">
          <AdminDesktopSidebar
            raisedHands={raisedHands}
            busy={busy}
            allowHand={allowHand}
            declineHand={declineHand}
            participants={participants}
            videoBusy={videoBusy}
            onToggleVideo={toggleParticipantVideo}
            sessionStart={sessionStart.current}
            recordingActive={recordingActive}
            onInviteOpen={() => setInviteOpen(true)}
            roomName={roomName}
            localParticipant={localParticipant}
            enableVideo={enableVideo}
          />
        </aside>
      </div>

      <footer
        className="lg:hidden shrink-0 border-t border-[#3c4043] px-2 py-2 safe-area-inset-bottom flex flex-col gap-2"
        style={{ background: "#292a2d" }}
      >
        <div className="flex items-center gap-2 overflow-x-auto">
          <HostControlButtons
            isMicrophoneEnabled={isMicrophoneEnabled}
            isCameraEnabled={isCameraEnabled}
            localParticipant={localParticipant}
            onEndRoom={endRoom}
            onToggleCamera={toggleHostCamera}
            speakers={speakers}
            busy={busy}
            onMute={(id) => void muteParticipant(id)}
            enableVideo={enableVideo}
            stageHasVideo={stageHasVideo}
          />
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button type="button" className={ICON_BTN} onClick={() => setParticipantsOpen(true)} title="Participants">
            <Users className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={`${ICON_BTN} relative`}
            onClick={() => setHandsSheetOpen(true)}
            title="Raised hands"
          >
            <Hand className="h-5 w-5" />
            {raisedHands.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 text-[9px] flex items-center justify-center">
                {raisedHands.length}
              </span>
            )}
          </button>
          <button type="button" className={ICON_BTN} onClick={() => setChatOpen(true)} title="Chat">
            <MessageCircle className="h-5 w-5" />
          </button>
          <VoicePollPanel isAdmin compact />
          <button type="button" className={ICON_BTN} onClick={() => setInviteOpen(true)} title="Invite">
            <UserPlus className="h-5 w-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={ICON_BTN} title="More">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#292a2d] border-[#3c4043] text-[#e8eaed]">
              <DropdownMenuItem disabled={busy === "mute-all"} onClick={() => void muteAllSpeakers()}>
                <MicOff className="h-4 w-4 mr-2" /> Mute all
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy === "notify"} onClick={() => void notifyHostLive()}>
                <Bell className="h-4 w-4 mr-2" /> Notify
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Share file
              </DropdownMenuItem>
              {recordingEnabled && (
                <DropdownMenuItem disabled={busy === "recording"} onClick={() => void toggleRecording()}>
                  <Circle className="h-4 w-4 mr-2" />
                  {recordingActive ? "Stop REC" : "Record"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </footer>

      <VoiceParticipantsSheet
        isAdminHost
        roomId={roomId}
        onToggleVideo={toggleParticipantVideo}
        videoBusy={videoBusy}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        hideTrigger
        side="bottom"
      />
      <ChatPanel
        roomName={roomName}
        senderName={localParticipant.name || "Host"}
        senderAgentId={null}
        apiMode="admin"
        isAdmin
        open={chatOpen}
        onOpenChange={setChatOpen}
        hideTrigger
        sheetSide="bottom"
      />
      <Sheet open={handsSheetOpen} onOpenChange={setHandsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[50dvh] bg-[#292a2d] border-[#3c4043] text-[#e8eaed]">
          <SheetHeader>
            <SheetTitle>Raised hands</SheetTitle>
          </SheetHeader>
          <ul className="mt-4 space-y-2 overflow-y-auto max-h-[38dvh]">
            {raisedHands.map((h) => (
              <li key={h.identity} className="flex gap-2 items-center rounded-lg border border-[#3c4043] p-2">
                <span className="text-sm flex-1 truncate">{h.name}</span>
                <button
                  type="button"
                  className="h-11 min-h-[44px] px-3 rounded-lg text-sm"
                  style={{ background: MEET_GREEN }}
                  disabled={busy === h.identity}
                  onClick={() => void allowHand(h)}
                >
                  Allow
                </button>
                <button
                  type="button"
                  className="h-11 min-h-[44px] px-3 rounded-lg border border-[#5f6368] text-sm"
                  onClick={() => declineHand(h.identity)}
                >
                  No
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-[#292a2d] border-[#3c4043] text-[#e8eaed] max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite speaker</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Select listener…" className="h-9 text-sm" />
            <CommandList>
              <CommandEmpty className="text-xs py-4 text-center text-[#9aa0a6]">No listeners</CommandEmpty>
              <CommandGroup>
                {listeners.map((p) => (
                  <CommandItem
                    key={p.identity}
                    value={p.name || p.identity}
                    className="text-sm"
                    onSelect={() => void inviteToSpeak(p.identity, p.name || p.identity)}
                  >
                    {p.name || p.identity}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <input
        ref={fileRef}
        type="file"
        accept={VOICE_ALLOWED_FILE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void shareFile(f)
          e.target.value = ""
        }}
      />

    </div>
  )
}

export function VoiceRoomAdminControl({
  roomId,
  roomName,
  token,
  serverUrl,
  recordingEnabled = false,
  moderationApiBase,
  hideRecording = false,
  hideNotify = false,
  enableVideo = true,
  onClose,
  onEnded,
}: Props) {
  const { roomOptions } = useVoiceDeviceLayout()
  const publishVideoOnConnect = enableVideo
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: MEET_BG, color: MEET_TEXT }}>
      <div className="shrink-0 px-4 py-3 border-b border-[#3c4043] flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="font-medium text-sm">Agent Conference — Host</h2>
          <p className="text-xs text-[#9aa0a6] truncate">{roomName}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#e8eaed] hover:bg-[#3c4043] shrink-0 h-11 w-11"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden pb-0 lg:pb-0">
        <StableLiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect
          audio
          video={publishVideoOnConnect}
          options={roomOptions}
          className="h-full"
          onDisconnected={(reason) => {
          }}
          onError={(e) => {
            if (!isTransientLiveKitError(e.message)) toast.error(e.message)
          }}
        >
          <ControlPanelInner
            roomId={roomId}
            roomName={roomName}
            recordingEnabled={recordingEnabled}
            moderationApiBase={moderationApiBase}
            hideRecording={hideRecording}
            hideNotify={hideNotify}
            enableVideo={enableVideo}
            onEnded={onEnded}
          />
          <RoomAudioRenderer />
        </StableLiveKitRoom>
      </div>
    </div>
  )
}
