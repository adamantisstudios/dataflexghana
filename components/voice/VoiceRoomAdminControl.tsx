"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Loader2, Upload, UserX, Mic, MicOff, Hand } from "lucide-react"
import { toast } from "sonner"
import {
  VOICE_ALLOWED_FILE_TYPES,
  VOICE_TOPIC_GRANT_SPEAK,
  VOICE_TOPIC_HAND_RAISE,
  VOICE_TOPIC_ADMIN_SHARE,
} from "@/lib/voice-room-topics"
import type { VoiceParticipantRole } from "@/lib/livekit-server"

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

function ControlPanelInner({ roomId, roomName, onEnded }: { roomId: string; roomName: string; onEnded: () => void }) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([])
  const [busy, setBusy] = useState<string | null>(null)
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
      toast.success(`Role set to ${role}`)
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
    if (!confirm("End this voice conference for everyone?")) return
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

  const remoteParticipants = participants.filter((p) => !p.isLocal)

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="flex flex-wrap gap-2">
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
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" />
          Share file
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={endRoom}
          disabled={busy === "end"}
        >
          {busy === "end" ? <Loader2 className="h-4 w-4 animate-spin" /> : "End room"}
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Hand className="h-4 w-4 text-amber-600" />
          Raised hands ({raisedHands.length})
        </h3>
        {raisedHands.length === 0 ? (
          <p className="text-xs text-muted-foreground">No pending requests</p>
        ) : (
          <ul className="space-y-2">
            {raisedHands.map((h) => (
              <li
                key={h.identity}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 bg-amber-50"
              >
                <span className="text-sm font-medium truncate">{h.name}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="bg-[#0E8F3D] hover:bg-[#0a7a34] h-8"
                    disabled={busy === h.identity}
                    onClick={() => allowHand(h)}
                  >
                    Allow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
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
        <h3 className="text-sm font-semibold mb-2">Participants ({remoteParticipants.length})</h3>
        <ul className="space-y-2">
          {remoteParticipants.map((p) => {
            let role = "listener"
            try {
              const meta = p.metadata ? JSON.parse(p.metadata) : {}
              role = meta.role || p.attributes?.role || "listener"
            } catch {
              role = p.attributes?.role || "listener"
            }
            const isSpeaking = p.isSpeaking
            return (
              <li key={p.identity} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.name || p.identity}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.identity}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {role}
                  </Badge>
                </div>
                {isSpeaking && (
                  <span className="text-xs text-[#0E8F3D] font-medium">Speaking</span>
                )}
                <div className="flex flex-wrap gap-2 items-center">
                  <Select
                    defaultValue={role}
                    onValueChange={(v) => assignRole(p.identity, v as VoiceParticipantRole)}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
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
                    className="h-8"
                    disabled={busy === p.identity}
                    onClick={() => muteParticipant(p.identity)}
                  >
                    <MicOff className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={busy === p.identity}
                    onClick={() => adminAction("unmute", { identity: p.identity }).then(() => toast.success("Unmuted"))}
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8"
                    disabled={busy === p.identity}
                    onClick={() => kick(p.identity)}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function VoiceRoomAdminControl({ roomId, roomName, token, serverUrl, onClose, onEnded }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Room control</h2>
            <p className="text-xs text-muted-foreground truncate">{roomName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="p-4 flex-1 overflow-hidden">
          <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video={false}>
            <ControlPanelInner roomId={roomId} roomName={roomName} onEnded={onEnded} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </div>
    </div>
  )
}
