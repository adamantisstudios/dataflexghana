"use client"

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Loader2, Upload, UserX, Mic, MicOff, Hand, X } from "lucide-react"
import { toast } from "sonner"
import {
  VOICE_ALLOWED_FILE_TYPES,
  VOICE_TOPIC_GRANT_SPEAK,
  VOICE_TOPIC_HAND_RAISE,
  VOICE_TOPIC_ADMIN_SHARE,
} from "@/lib/voice-room-topics"
import type { VoiceParticipantRole } from "@/lib/livekit-server"
import { voiceAvatarRingColor, voiceInitials } from "@/lib/voice-ui-utils"

type RaisedHand = {
  identity: string
  name: string
}

type Props = {
  roomId: string
  roomName: string
  token: string
  serverUrl: string
  onClose: () => void
  onEnded: () => void
}

function roleLabel(role: string): string {
  if (role === "moderator") return "Moderator"
  if (role === "speaker") return "Speaker"
  return "Listener"
}

function ControlPanelInner({ roomId, onEnded }: { roomId: string; onEnded: () => void }) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
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

  const assignRole = async (identity: string, role: VoiceParticipantRole) => {
    setBusy(identity)
    try {
      await adminAction("assign-role", { identity, role })
      toast.success(`Role set to ${roleLabel(role)}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  const kick = async (identity: string) => {
    if (!confirm("Remove this participant from the room?")) return
    setBusy(identity)
    try {
      await adminAction("kick", { identity })
      toast.success("Participant removed")
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
      toast.success("Room ended")
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

  return (
    <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 text-white">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          dragOver ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-white/5"
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
        <p className="text-xs text-white/50 text-center mb-3">Drop a file here or use the picker</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Share file
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" size="sm" disabled={busy === "end"}>
                {busy === "end" ? <Loader2 className="h-4 w-4 animate-spin" /> : "End room"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>End voice conference?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  All participants will be disconnected. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => void endRoom()}
                >
                  End room
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-amber-300">
          <Hand className="h-4 w-4" />
          Raised hands
          <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">{raisedHands.length}</Badge>
        </h3>
        {raisedHands.length === 0 ? (
          <p className="text-xs text-white/40 py-4 text-center rounded-lg bg-white/5">No pending requests</p>
        ) : (
          <ul className="space-y-2">
            {raisedHands.map((h, i) => (
              <li
                key={h.identity}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 p-3 bg-amber-500/10 animate-in fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Hand className="h-4 w-4 text-amber-400 shrink-0 animate-hand-rise" />
                  <span className="text-sm font-medium truncate">{h.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="bg-[#0E8F3D] hover:bg-[#0a7a34] h-9"
                    disabled={busy === h.identity}
                    onClick={() => allowHand(h)}
                  >
                    Allow speak
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 border-white/20 text-white hover:bg-white/10"
                    disabled={busy === h.identity}
                    onClick={() => muteParticipant(h.identity)}
                  >
                    Mute
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-white/90">
          Participants ({remoteParticipants.length})
        </h3>
        <ul className="space-y-3">
          {remoteParticipants.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-6">Waiting for agents to join…</p>
          ) : (
            remoteParticipants.map((p) => {
              let role = "listener"
              try {
                const meta = p.metadata ? JSON.parse(p.metadata) : {}
                role = meta.role || p.attributes?.role || "listener"
              } catch {
                role = p.attributes?.role || "listener"
              }
              const ring = voiceAvatarRingColor(p.identity)
              return (
                <li key={p.identity} className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        boxShadow: `0 0 0 2px ${ring}`,
                        background: `linear-gradient(135deg, ${ring}99, ${ring})`,
                      }}
                    >
                      {voiceInitials(p.name || p.identity)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{p.name || p.identity}</p>
                      {p.isSpeaking && (
                        <span className="text-[10px] text-emerald-400 font-medium">Speaking now</span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 capitalize border-white/20 text-white/80 bg-white/5"
                    >
                      {roleLabel(role)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select
                      defaultValue={role}
                      onValueChange={(v) => assignRole(p.identity, v as VoiceParticipantRole)}
                    >
                      <SelectTrigger className="h-9 w-[130px] text-xs bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="listener">Listener</SelectItem>
                        <SelectItem value="speaker">Speaker</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 border-white/20 text-white hover:bg-white/10"
                      disabled={busy === p.identity}
                      onClick={() => muteParticipant(p.identity)}
                      title="Mute"
                    >
                      <MicOff className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 border-white/20 text-white hover:bg-white/10"
                      disabled={busy === p.identity}
                      onClick={() =>
                        adminAction("unmute", { identity: p.identity }).then(() => toast.success("Unmuted"))
                      }
                      title="Allow speak"
                    >
                      <Mic className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-9"
                      disabled={busy === p.identity}
                      onClick={() => kick(p.identity)}
                      title="Kick"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}

export function VoiceRoomAdminControl({ roomId, roomName, token, serverUrl, onClose, onEnded }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] w-full sm:max-w-lg sm:rounded-2xl shadow-2xl border border-white/10 max-h-[92vh] flex flex-col text-white">
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="font-semibold text-lg">Room control</h2>
            <p className="text-xs text-white/50 truncate">{roomName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:bg-white/10 shrink-0"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 flex-1 overflow-hidden">
          <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video={false}>
            <ControlPanelInner roomId={roomId} onEnded={onEnded} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </div>
    </div>
  )
}
