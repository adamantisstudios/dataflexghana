"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionQualityIndicator,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionQuality, Track, type Participant } from "livekit-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { getAdminAuthHeaders } from "@/lib/api-client"
import {
  Loader2,
  Upload,
  UserX,
  Mic,
  MicOff,
  Hand,
  X,
  Users,
  Circle,
  UserPlus,
  UserMinus,
  Volume2,
  Focus,
  Bell,
  UserCog,
  Video,
  VideoOff,
} from "lucide-react"
import { toast } from "sonner"
import {
  VOICE_ALLOWED_FILE_TYPES,
  VOICE_TOPIC_GRANT_SPEAK,
  VOICE_TOPIC_HAND_RAISE,
  VOICE_TOPIC_ADMIN_SHARE,
  VOICE_TOPIC_DEMOTE,
  VOICE_TOPIC_SPOTLIGHT,
} from "@/lib/voice-room-topics"
import { encodeVoiceData } from "@/lib/voice-room-data"
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

function SpeakerCard({
  participant,
  onDemote,
  busy,
}: {
  participant: Participant
  onDemote: () => void
  busy: boolean
}) {
  const level = useParticipantAudioLevel(participant)
  const [volume, setVolume] = useState(100)
  const ring = voiceAvatarRingColor(participant.identity)

  useEffect(() => {
    setParticipantOutputVolume(participant, volume / 100)
  }, [participant, volume])

  return (
    <div className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-md p-2 flex flex-col items-center gap-1 min-w-[88px]">
      <div className="relative">
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            participant.isSpeaking ? "animate-voice-soundwave" : ""
          }`}
          style={{
            boxShadow: `0 0 0 3px ${ring}`,
            background: `linear-gradient(135deg, ${ring}99, ${ring})`,
          }}
        >
          {voiceInitials(participant.name || participant.identity)}
        </div>
        <div className="absolute -bottom-1 -right-1">
          <VoiceAudioMeter level={level} />
        </div>
      </div>
      <p className="text-xs font-medium text-slate-100 truncate max-w-[100px] text-center">
        {participant.name || participant.identity}
      </p>
      <div className="flex items-center gap-2 w-full px-1">
        <Volume2 className="h-3 w-3 text-slate-400 shrink-0" />
        <Slider
          value={[volume]}
          max={100}
          step={1}
          className="flex-1"
          onValueChange={(v) => setVolume(v[0] ?? 100)}
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs border-white/20 bg-slate-800/80 text-slate-100 hover:bg-slate-700"
        disabled={busy}
        onClick={onDemote}
      >
        <UserMinus className="h-3 w-3 mr-1" />
        Remove speaker
      </Button>
    </div>
  )
}

function ListenerRow({
  participant,
  busy,
  onKick,
  onBan,
  onCoHost,
}: {
  participant: Participant
  busy: boolean
  onKick: () => void
  onBan: () => void
  onCoHost?: () => void
}) {
  const level = useParticipantAudioLevel(participant)
  const ring = voiceAvatarRingColor(participant.identity)
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 p-3 bg-slate-800/50 backdrop-blur-sm">
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{
          boxShadow: `0 0 0 2px ${ring}`,
          background: `linear-gradient(135deg, ${ring}99, ${ring})`,
        }}
      >
        {voiceInitials(participant.name || participant.identity)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-white truncate">{participant.name || participant.identity}</p>
        <VoiceAudioMeter level={level} className="mt-1" />
      </div>
      <div className="flex gap-0.5 shrink-0">
        {onCoHost && (
          <Button size="icon" variant="ghost" className="h-6 w-6 text-amber-300" disabled={busy} onClick={onCoHost} title="Co-host">
            <UserCog className="h-3 w-3" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400" disabled={busy} onClick={onKick} title="Kick">
          <UserX className="h-3 w-3" />
        </Button>
      </div>
    </li>
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
  const fileRef = useRef<HTMLInputElement>(null)
  const sessionStart = useRef(Date.now())
  const [spotlightId, setSpotlightId] = useState<string | null>(null)
  const [preSpotlightMuted, setPreSpotlightMuted] = useState<string[]>([])

  const publishGrantSpeak = async (identity: string) => {
    await localParticipant.sendText(identity, { topic: VOICE_TOPIC_GRANT_SPEAK })
    await localParticipant.publishData(new TextEncoder().encode(identity), {
      reliable: true,
      topic: VOICE_TOPIC_GRANT_SPEAK,
    })
  }

  const toggleCamera = async () => {
    try {
      const enabling = !isCameraEnabled
      await localParticipant.setCameraEnabled(enabling)
      if (enabling) {
        toast.success("Camera on — listeners can see your video")
      } else {
        toast.message("Camera stopped")
      }
    } catch {
      toast.error("Camera access is required to stream video.")
    }
  }

  const publishDemote = async (identity: string) => {
    await localParticipant.publishData(
      encodeVoiceData({ type: "demote", identity }),
      { reliable: true, topic: VOICE_TOPIC_DEMOTE },
    )
  }

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

  const demoteToListener = async (identity: string) => {
    setBusy(identity)
    try {
      await adminAction("assign-role", { identity, role: "listener" })
      await adminAction("mute", { identity })
      await publishDemote(identity)
      toast.success("Moved to listeners")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  const inviteToSpeak = async (identity: string, name: string) => {
    setBusy(identity)
    setInviteOpen(false)
    try {
      await adminAction("unmute", { identity })
      await publishGrantSpeak(identity)
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
      await publishGrantSpeak(hand.identity)
      setRaisedHands((prev) => prev.filter((h) => h.identity !== hand.identity))
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
      toast.success("Muted")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  const kickParticipant = async (identity: string, ban = false) => {
    const msg = ban
      ? "Ban this listener? They will be removed from the room."
      : "Remove this participant from the room?"
    if (!confirm(msg)) return
    setBusy(identity)
    try {
      await adminAction("kick", { identity })
      toast.success(ban ? "Listener banned from room" : "Participant removed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  const promoteCoHost = async (identity: string, name: string) => {
    setBusy(identity)
    try {
      await adminAction("assign-role", { identity, role: "co-host" })
      toast.success(`${name} is now co-host`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
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

  const endRoom = async () => {
    setBusy("end")
    try {
      await fetch(`/api/admin/voice-rooms/${roomId}/end`, {
        method: "POST",
        headers: getAdminAuthHeaders(),
      })
      await room.disconnect()
      toast.success("Stream ended")
      onEnded()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to end room")
    } finally {
      setBusy(null)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void shareFile(f)
  }

  const remoteParticipants = participants.filter((p) => !p.isLocal)

  const listeners = useMemo(
    () => remoteParticipants.filter((p) => !isSpeakerRole(getParticipantRole(p))),
    [remoteParticipants],
  )

  const speakers = useMemo(
    () => remoteParticipants.filter((p) => isSpeakerRole(getParticipantRole(p))),
    [remoteParticipants],
  )

  const listenerCount = listeners.length

  const toggleSpotlight = async (identity: string) => {
    setBusy("spotlight")
    try {
      if (spotlightId === identity) {
        for (const id of preSpotlightMuted) {
          try {
            await adminAction("unmute", { identity: id })
          } catch {
            /* skip */
          }
        }
        setSpotlightId(null)
        setPreSpotlightMuted([])
        await localParticipant.publishData(
          encodeVoiceData({ type: "spotlight", identity: null, active: false }),
          { reliable: true, topic: VOICE_TOPIC_SPOTLIGHT },
        )
        toast.message("Spotlight off")
      } else {
        const muted: string[] = []
        for (const s of speakers) {
          if (s.identity !== identity) {
            await adminAction("mute", { identity: s.identity })
            muted.push(s.identity)
          }
        }
        setPreSpotlightMuted(muted)
        setSpotlightId(identity)
        await localParticipant.publishData(
          encodeVoiceData({ type: "spotlight", identity, active: true }),
          { reliable: true, topic: VOICE_TOPIC_SPOTLIGHT },
        )
        toast.success("Spotlight on")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Spotlight failed")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 text-slate-100 text-xs relative">
      <VoiceReactionsLayer />
      <AdminLocalVideoPreview />

      <div className="shrink-0 px-2 py-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-black/20">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm font-bold text-white tabular-nums">{listenerCount} listening</p>
          <span className="text-[10px] text-slate-500">({participants.length} total)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <VoiceStreamStats sessionStart={sessionStart.current} />
          {recordingActive && (
            <span className="inline-flex items-center gap-1 text-[10px] text-red-300">
              <Circle className="h-1.5 w-1.5 fill-red-500 animate-recording-pulse" />
              REC
            </span>
          )}
          <StreamHealthDot />
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 py-2 px-2 gap-2 overflow-hidden">
          <section className="shrink-0">
            <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">On stage</h3>
            {speakers.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-4 text-center rounded-lg bg-slate-800/40 border border-white/10">
                No speakers yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-1 justify-center">
                {speakers.map((p) => (
                  <div key={p.identity} className="relative">
                    <SpeakerCard
                      participant={p}
                      busy={busy === p.identity}
                      onDemote={() => void demoteToListener(p.identity)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-600/90 hover:bg-amber-500"
                      title="Spotlight"
                      onClick={() => void toggleSpotlight(p.identity)}
                    >
                      <Focus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`shrink-0 rounded-lg border border-dashed p-2 ${
              dragOver ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-slate-800/30"
            }`}
          >
            <input ref={fileRef} type="file" accept={VOICE_ALLOWED_FILE_TYPES.join(",")} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void shareFile(f); e.target.value = "" }} />
            <Button type="button" variant="ghost" size="sm" className="h-7 w-full text-[10px] text-slate-300" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3 w-3 mr-1" /> File
            </Button>
          </div>
        </div>

        <aside className="w-[200px] sm:w-[220px] shrink-0 border-l border-white/10 flex flex-col min-h-0 bg-slate-950/50">
          <div className="p-2 border-b border-white/10">
            <h3 className="text-[10px] uppercase text-amber-300 flex items-center gap-1">
              <Hand className="h-3 w-3" /> Queue <Badge className="h-4 px-1 text-[9px]">{raisedHands.length}</Badge>
            </h3>
          </div>
          <ul className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {raisedHands.length === 0 ? (
              <li className="text-[10px] text-slate-500 text-center py-2">Empty</li>
            ) : (
              raisedHands.map((h) => (
                <li key={h.identity} className="rounded-lg border border-amber-500/20 p-1.5 bg-slate-900/60">
                  <p className="text-[11px] font-medium truncate text-white">{h.name}</p>
                  <div className="flex gap-1 mt-1">
                    <Button size="sm" className="h-6 flex-1 text-[10px] bg-[#0E8F3D] px-1" disabled={busy === h.identity} onClick={() => allowHand(h)}>OK</Button>
                    <Button size="sm" variant="outline" className="h-6 flex-1 text-[10px] px-1 border-white/20" disabled={busy === h.identity} onClick={() => declineHand(h.identity)}>No</Button>
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="p-2 border-t border-white/10 flex-1 min-h-0 flex flex-col overflow-hidden">
            <h3 className="text-[10px] uppercase text-slate-500 mb-1 shrink-0">Listeners</h3>
            <ul className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {listeners.map((p) => (
                <ListenerRow
                  key={p.identity}
                  participant={p}
                  busy={busy === p.identity}
                  onKick={() => void kickParticipant(p.identity)}
                  onBan={() => void kickParticipant(p.identity, true)}
                  onCoHost={() => void promoteCoHost(p.identity, p.name || p.identity)}
                />
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-slate-950/95 px-2 py-2 safe-area-inset-bottom">
        <div className="grid grid-cols-8 sm:grid-cols-12 gap-1 max-w-4xl mx-auto place-items-center">
          <Button type="button" size="icon" className={`h-9 w-9 rounded-lg ${isMicrophoneEnabled ? "bg-[#0E8F3D]" : "bg-slate-700"}`} onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)} title="Mic">
            {isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="icon"
            className={`h-9 w-9 rounded-lg border-white/20 ${isCameraEnabled ? "bg-indigo-600 hover:bg-indigo-500" : "bg-slate-800"}`}
            onClick={() => void toggleCamera()}
            title={isCameraEnabled ? "Stop camera" : "Start camera"}
          >
            {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <ChatPanel roomName={roomName} senderName={localParticipant.name || "Host"} senderAgentId={null} apiMode="admin" isAdmin triggerClassName="h-9 w-9 p-0 rounded-lg border-white/20 bg-slate-800" />
          <Popover open={inviteOpen} onOpenChange={setInviteOpen}>
            <PopoverTrigger asChild>
              <Button type="button" size="icon" variant="outline" className="h-9 w-9 border-white/20 bg-slate-800" title="Invite"><UserPlus className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-slate-900 border-white/20 text-slate-100">
              <Command>
                <CommandInput placeholder="Listeners…" className="h-8 text-xs" />
                <CommandList>
                  <CommandEmpty className="text-xs py-2 text-center">None</CommandEmpty>
                  <CommandGroup>
                    {listeners.map((p) => (
                      <CommandItem key={p.identity} value={p.name || p.identity} className="text-xs" onSelect={() => void inviteToSpeak(p.identity, p.name || p.identity)}>{p.name || p.identity}</CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button type="button" size="icon" variant="outline" className="h-9 w-9 border-white/20 bg-slate-800" disabled={busy === "mute-all"} onClick={() => void muteAllSpeakers()} title="Mute all"><MicOff className="h-4 w-4" /></Button>
          <VoicePollPanel isAdmin compact />
          <Button type="button" size="icon" variant="outline" className="h-9 w-9 border-white/20 bg-slate-800" disabled={busy === "notify"} onClick={() => void notifyHostLive()} title="Notify region"><Bell className="h-4 w-4" /></Button>
          <VoiceParticipantsSheet compact />
          {recordingEnabled && (
            <Button type="button" size="icon" variant="outline" className={`h-9 w-9 border-white/20 ${recordingActive ? "bg-red-900/50" : "bg-slate-800"}`} disabled={busy === "recording"} onClick={() => void toggleRecording()} title="Record">
              {busy === "recording" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Circle className={`h-4 w-4 ${recordingActive ? "fill-red-500" : ""}`} />}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" size="icon" variant="destructive" className="h-9 w-9 bg-red-600" disabled={busy === "end"} title="End"><X className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-white/10 text-slate-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm text-white">End stream?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-400">Disconnect everyone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
                <AlertDialogAction className="h-8 text-xs bg-red-600" onClick={() => void endRoom()}>End</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
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
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#0a1628] via-[#1a0f2e] to-black">
      <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black/30 backdrop-blur-md">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm text-white">Host control</h2>
          <p className="text-xs text-slate-400 truncate">{roomName}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:bg-white/10 shrink-0"
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
