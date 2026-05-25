"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useConnectionQualityIndicator,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionQuality, RoomEvent, Track, type Participant } from "livekit-client"
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
  VideoOff,
  Smile,
  MoreVertical,
  PhoneOff,
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
import { getParticipantRole, isSpeakerRole } from "@/components/voice/voice-participant-utils"
import { useParticipantAudioLevel } from "@/components/voice/useParticipantAudioLevel"
import { VoiceAudioMeter } from "@/components/voice/VoiceAudioMeter"
import { VoiceReactionsLayer } from "@/components/voice/VoiceReactionsLayer"
import { ChatPanel } from "@/components/voice/ChatPanel"
import { AdminLocalVideoPreview } from "@/components/voice/AdminLocalVideoPreview"

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
  onClose: () => void
  onEnded: () => void
}

function connectionHealthColor(quality: ConnectionQuality | undefined): string {
  if (quality === ConnectionQuality.Excellent || quality === ConnectionQuality.Good) return "bg-emerald-400"
  if (quality === ConnectionQuality.Poor) return "bg-amber-400"
  return "bg-red-500"
}

function setParticipantOutputVolume(participant: Participant, volume: number) {
  const pub = participant.getTrackPublication(Track.Source.Microphone)
  const track = pub?.audioTrack
  if (track && "setVolume" in track) {
    ;(track as { setVolume: (v: number) => void }).setVolume(volume)
  }
}

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
}: {
  speakers: Participant[]
  busy: string | null
  onMute: (identity: string) => void
}) {
  if (speakers.length === 0) {
    return <span className="text-xs text-[#9aa0a6] px-2">No speakers on stage</span>
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
  activeSpeaker,
  isCameraEnabled,
  localParticipant,
}: {
  activeSpeaker: Participant | null
  isCameraEnabled: boolean
  localParticipant: Participant
}) {
  const focus = activeSpeaker ?? localParticipant
  const camPub = focus.getTrackPublication(Track.Source.Camera)
  const showVideo = focus.isLocal
    ? isCameraEnabled && camPub?.track && !camPub.isMuted
    : camPub?.track && !camPub.isMuted

  const level = useParticipantAudioLevel(focus)
  const ring = voiceAvatarRingColor(focus.identity)

  if (showVideo && camPub?.track) {
    return (
      <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden bg-black">
        <VideoTrack
          trackRef={{ participant: focus, publication: camPub, source: Track.Source.Camera }}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 text-sm text-white">
          {focus.name || focus.identity}
        </div>
      </div>
    )
  }

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
      <p className="text-xl font-medium text-[#e8eaed]">{focus.name || focus.identity}</p>
      <VoiceAudioMeter level={level} className="w-32" />
    </div>
  )
}

function ControlPanelInner({
  roomId,
  roomName,
  recordingEnabled,
  onEnded,
}: {
  roomId: string
  roomName: string
  recordingEnabled: boolean
  onEnded: () => void
}) {
  const room = useRoomContext()
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant()
  const participants = useParticipants()
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [recordingActive, setRecordingActive] = useState(false)
  const [egressId, setEgressId] = useState<string | null>(null)
  const [participantTick, setParticipantTick] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const sessionStart = useRef(Date.now())
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

  const adminAction = useCallback(
    async (path: string, body: Record<string, string>) => {
      const res = await fetch(`/api/admin/voice-rooms/${roomId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      return data
    },
    [roomId],
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
      await fetch(`/api/admin/voice-rooms/${roomId}/end`, {
        method: "POST",
        headers: getAdminAuthHeaders(),
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

  const activeSpeaker = useMemo(
    () =>
      speakers.find((p) => p.isSpeaking) ||
      speakers[0] ||
      null,
    [speakers],
  )

  const listenerAvatars = useMemo(() => listeners.slice(0, 16), [listeners])

  return (
    <div className="flex flex-col h-full min-h-0 relative" style={{ color: MEET_TEXT }}>
      <VoiceReactionsLayer />
      <AdminLocalVideoPreview />

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

      <div className="shrink-0 px-4 py-2 flex items-center justify-between text-xs text-[#9aa0a6]">
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: MEET_GREEN }} />
          {listeners.length} listening · {participants.length} total
        </span>
        <div className="flex items-center gap-2">
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

      <div
        className={`flex-1 flex flex-col min-h-0 overflow-hidden px-4 ${dragOver ? "ring-2 ring-[#0E8F3D]" : ""}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="flex-1 flex items-center justify-center min-h-0 py-4">
          <MainStage
            activeSpeaker={activeSpeaker}
            isCameraEnabled={isCameraEnabled}
            localParticipant={localParticipant}
          />
        </div>

        {listenerAvatars.length > 0 && (
          <div className="shrink-0 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-[#9aa0a6] text-center mb-2">Listeners</p>
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
      </div>

      <footer
        className="shrink-0 h-16 border-t border-[#3c4043] px-3 flex items-center gap-2 safe-area-inset-bottom"
        style={{ background: "#292a2d" }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            className={`h-12 w-12 rounded-full flex items-center justify-center text-white ${
              isMicrophoneEnabled ? "" : "bg-[#3c4043]"
            }`}
            style={isMicrophoneEnabled ? { background: MEET_GREEN } : undefined}
            title="Microphone"
          >
            {isMicrophoneEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="h-12 w-12 rounded-full bg-[#ea4335] flex items-center justify-center text-white hover:bg-[#d93025]"
                title="End call"
              >
                <PhoneOff className="h-6 w-6" />
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[#ea4335] hover:bg-[#d93025]"
                  onClick={() => void endRoom()}
                >
                  End call
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button
            type="button"
            disabled
            className="h-12 w-12 rounded-full bg-[#3c4043] flex items-center justify-center text-[#9aa0a6] opacity-50 cursor-not-allowed"
            title="Camera (coming soon)"
          >
            <VideoOff className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto px-1">
          <SpeakerChipBar speakers={speakers} busy={busy} onMute={(id) => void muteParticipant(id)} />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ChatPanel
            roomName={roomName}
            senderName={localParticipant.name || "Host"}
            senderAgentId={null}
            apiMode="admin"
            isAdmin
            triggerClassName="h-11 w-11 rounded-full p-0 border-0 bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]"
          />
          <VoiceParticipantsSheet
            compact
            side="right"
            triggerClassName="h-11 w-11 rounded-full p-0 border-0 bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]"
          />
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-11 w-11 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center"
                title="Reactions"
              >
                <Smile className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 bg-[#292a2d] border-[#3c4043]">
              <div className="flex gap-2">
                {VOICE_REACTION_EMOJIS.map((e) => (
                  <span key={e} className="text-2xl">
                    {e}
                  </span>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-11 w-11 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center"
                title="More"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#292a2d] border-[#3c4043] text-[#e8eaed]">
              <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite speaker
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div className="px-2 py-1.5">
                  <VoicePollPanel isAdmin compact />
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy === "mute-all"} onClick={() => void muteAllSpeakers()}>
                <MicOff className="h-4 w-4 mr-2" />
                Mute all speakers
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy === "notify"} onClick={() => void notifyHostLive()}>
                <Bell className="h-4 w-4 mr-2" />
                Push notification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Share file
              </DropdownMenuItem>
              {recordingEnabled && (
                <DropdownMenuItem disabled={busy === "recording"} onClick={() => void toggleRecording()}>
                  <Circle className="h-4 w-4 mr-2" />
                  {recordingActive ? "Stop recording" : "Start recording"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="hidden sm:block">
            <VoicePollPanel isAdmin compact />
          </div>
        </div>
      </footer>

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
  onClose,
  onEnded,
}: Props) {
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
          className="text-[#e8eaed] hover:bg-[#3c4043] shrink-0"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video className="h-full">
          <ControlPanelInner
            roomId={roomId}
            roomName={roomName}
            recordingEnabled={recordingEnabled}
            onEnded={onEnded}
          />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  )
}
