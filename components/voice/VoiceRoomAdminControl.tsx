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
} from "lucide-react"
import { toast } from "sonner"
import {
  VOICE_ALLOWED_FILE_TYPES,
  VOICE_TOPIC_GRANT_SPEAK,
  VOICE_TOPIC_HAND_RAISE,
  VOICE_TOPIC_ADMIN_SHARE,
} from "@/lib/voice-room-topics"
import { voiceAvatarRingColor, voiceInitials } from "@/lib/voice-ui-utils"
import { getParticipantRole, isSpeakerRole } from "@/components/voice/voice-participant-utils"
import { useParticipantAudioLevel } from "@/components/voice/useParticipantAudioLevel"
import { VoiceAudioMeter } from "@/components/voice/VoiceAudioMeter"
import { VoiceReactionsLayer } from "@/components/voice/VoiceReactionsLayer"
import { ChatPanel } from "@/components/voice/ChatPanel"

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
    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 flex flex-col items-center gap-2 min-w-[120px]">
      <div className="relative">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center text-sm font-bold text-white ${
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
}: {
  participant: Participant
  busy: boolean
  onKick: () => void
  onBan: () => void
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
      <div className="flex gap-1 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-white/20 bg-slate-800 text-slate-100"
          disabled={busy}
          onClick={onKick}
          title="Kick"
        >
          <UserX className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-8"
          disabled={busy}
          onClick={onBan}
          title="Ban"
        >
          Ban
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
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const participants = useParticipants()
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [recordingActive, setRecordingActive] = useState(false)
  const [egressId, setEgressId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
      await localParticipant.sendText(identity, { topic: VOICE_TOPIC_GRANT_SPEAK })
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
      await localParticipant.sendText(hand.identity, { topic: VOICE_TOPIC_GRANT_SPEAK })
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

  return (
    <div className="flex flex-col h-full min-h-0 text-slate-100">
      <VoiceReactionsLayer />

      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Users className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-lg font-bold text-white tabular-nums">
              {listenerCount} listening
            </p>
            <p className="text-xs text-slate-400">{participants.length} total in room</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {recordingActive && (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-300 font-medium">
              <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-recording-pulse" />
              REC
            </span>
          )}
          <StreamHealthDot />
          <span className="text-[10px] text-slate-400 hidden sm:inline">Stream</span>
        </div>
      </div>

      {/* Speakers stage */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        <section>
          <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">On stage</h3>
          {speakers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8 rounded-xl bg-slate-800/40 border border-white/10">
              No speakers yet — invite a listener or accept a raised hand
            </p>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {speakers.map((p) => (
                <SpeakerCard
                  key={p.identity}
                  participant={p}
                  busy={busy === p.identity}
                  onDemote={() => void demoteToListener(p.identity)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Raised hands */}
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/10 backdrop-blur-md p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-amber-200">
            <Hand className="h-4 w-4" />
            Speaker queue
            <Badge className="bg-amber-500/30 text-amber-100 border-amber-500/40">{raisedHands.length}</Badge>
          </h3>
          {raisedHands.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">No raised hands</p>
          ) : (
            <ul className="space-y-2">
              {raisedHands.map((h) => (
                <li
                  key={h.identity}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 p-3 bg-slate-900/50"
                >
                  <span className="text-sm font-medium text-white truncate">{h.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="bg-[#0E8F3D] hover:bg-[#0a7a34] h-9 text-white"
                      disabled={busy === h.identity}
                      onClick={() => allowHand(h)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 border-white/20 bg-slate-800 text-slate-100"
                      disabled={busy === h.identity}
                      onClick={() => declineHand(h.identity)}
                    >
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Listeners */}
        <section>
          <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">Listeners</h3>
          {listeners.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No listeners connected</p>
          ) : (
            <ul className="space-y-2">
              {listeners.map((p) => (
                <ListenerRow
                  key={p.identity}
                  participant={p}
                  busy={busy === p.identity}
                  onKick={() => void kickParticipant(p.identity)}
                  onBan={() => void kickParticipant(p.identity, true)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* File share drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed p-3 transition-colors ${
            dragOver ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-slate-800/30"
          }`}
        >
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-white/20 bg-slate-800/80 text-slate-100"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Share file with room
          </Button>
        </div>
      </div>

      {/* Bottom host control bar */}
      <div className="shrink-0 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl px-3 py-3 safe-area-inset-bottom">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          <Button
            type="button"
            size="lg"
            className={`h-14 w-14 rounded-full shrink-0 ${
              isMicrophoneEnabled
                ? "bg-[#0E8F3D] hover:bg-[#0a7a34] text-white"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
            onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            title={isMicrophoneEnabled ? "Mute yourself" : "Unmute yourself"}
          >
            {isMicrophoneEnabled ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
          </Button>

          <ChatPanel
            roomName={roomName}
            senderName={localParticipant.name || "Host"}
            senderAgentId={null}
            apiMode="admin"
            isAdmin
            triggerClassName="h-12 px-4 rounded-xl border-white/20 bg-slate-800/80 text-slate-100 hover:bg-slate-700"
          />

          <Popover open={inviteOpen} onOpenChange={setInviteOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-12 border-white/20 bg-slate-800/80 text-slate-100 hover:bg-slate-700"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Invite speaker
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 bg-slate-900 border-white/20 text-slate-100" align="center">
              <Command className="bg-transparent">
                <CommandInput placeholder="Search listeners…" className="text-slate-100" />
                <CommandList>
                  <CommandEmpty className="text-slate-400 py-4 text-center text-sm">No listeners found</CommandEmpty>
                  <CommandGroup>
                    {listeners.map((p) => (
                      <CommandItem
                        key={p.identity}
                        value={p.name || p.identity}
                        className="text-slate-100"
                        onSelect={() => void inviteToSpeak(p.identity, p.name || p.identity)}
                      >
                        {p.name || p.identity}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            className="h-12 border-white/20 bg-slate-800/80 text-slate-100"
            disabled={busy === "mute-all"}
            onClick={() => void muteAllSpeakers()}
          >
            <MicOff className="h-4 w-4 mr-1" />
            Mute all
          </Button>

          {recordingEnabled && (
            <Button
              variant="outline"
              className={`h-12 border-white/20 ${
                recordingActive ? "bg-red-900/40 text-red-200" : "bg-slate-800/80 text-slate-100"
              }`}
              disabled={busy === "recording"}
              onClick={() => void toggleRecording()}
            >
              {busy === "recording" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Circle className={`h-4 w-4 mr-1 ${recordingActive ? "fill-red-500 text-red-500" : ""}`} />
              )}
              {recordingActive ? "Stop rec" : "Record"}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-12 bg-red-600 hover:bg-red-700 text-white"
                disabled={busy === "end"}
              >
                {busy === "end" ? <Loader2 className="h-4 w-4 animate-spin" /> : "End stream"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-white/10 text-slate-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">End voice stream?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  All participants will be disconnected immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 text-slate-100 border-white/20">Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => void endRoom()}>
                  End stream
                </AlertDialogAction>
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
          <h2 className="font-semibold text-lg text-white">Host control</h2>
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
        <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video={false} className="h-full">
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
