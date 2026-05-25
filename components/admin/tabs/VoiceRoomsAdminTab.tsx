"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { VOICE_ROOM_REGIONS } from "@/lib/voice-room-regions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Loader2, Phone, RefreshCw, Settings2, Download } from "lucide-react"
import { toast } from "sonner"
import { VoiceRoomAdminControl } from "@/components/voice/VoiceRoomAdminControl"

type VoiceRoom = {
  id: string
  room_name: string
  region: string
  is_active: boolean
  recording_url: string | null
  created_at: string
  ended_at: string | null
  participant_count?: number
}

export default function VoiceRoomsAdminTab() {
  const [rooms, setRooms] = useState<VoiceRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState<string>(VOICE_ROOM_REGIONS[0])
  const [creating, setCreating] = useState(false)
  const [lastInvite, setLastInvite] = useState("")
  const [controlRoom, setControlRoom] = useState<VoiceRoom | null>(null)
  const [controlToken, setControlToken] = useState<{ token: string; serverUrl: string } | null>(null)
  const [recordingEnabled, setRecordingEnabled] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/voice-rooms", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setRooms(data.rooms || [])
      setRecordingEnabled(data.recordingEnabled === true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createRoom = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/admin/voice-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ region }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Create failed")
      setLastInvite(data.inviteUrl || "")
      if (data.recordingEnabled === true) setRecordingEnabled(true)
      if (data.recordingWarning) {
        toast.warning(data.recordingWarning)
      }
      toast.success(`Room created — ${data.agentsNotified ?? 0} agents notified`)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed")
    } finally {
      setCreating(false)
    }
  }

  const openControl = async (room: VoiceRoom) => {
    try {
      const res = await fetch(`/api/admin/voice-rooms/${room.id}/token`, {
        method: "POST",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Token failed")
      setControlRoom(room)
      setControlToken({ token: data.token, serverUrl: data.serverUrl })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open control panel")
    }
  }

  const downloadRecording = async (room: VoiceRoom) => {
    try {
      const res = await fetch(`/api/admin/voice-rooms/${room.id}/recording`, {
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No recording")
      const url = data.downloadUrl || data.recordings?.[0]?.downloadUrl
      if (!url) {
        toast.error("Recording not ready yet")
        return
      }
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed")
    }
  }

  const active = rooms.filter((r) => r.is_active)
  const past = rooms.filter((r) => !r.is_active)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Invitation-only voice conferences by region. Agents in the matching region can join from their dashboard.
        </p>
        <div className="flex gap-2">
          <Link href="/admin/voice-rooms">
            <Button variant="outline" size="sm">
              Full page
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#0E8F3D]" />
            Create room
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!recordingEnabled && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
              Recording is currently disabled. Enable it in your environment settings (set{" "}
              <code className="text-[11px] bg-amber-100/80 px-1 rounded">LIVEKIT_RECORDING_ENABLED=true</code>
              ).
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <Label>Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_ROOM_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-[#0E8F3D] hover:bg-[#0a7a34] w-full sm:w-auto"
            onClick={createRoom}
            disabled={creating}
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create room
          </Button>
          </div>
        </CardContent>
        {lastInvite && (
          <CardContent className="pt-0">
            <Label className="text-xs">Invite link (agents use dashboard menu)</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={lastInvite} className="text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  void navigator.clipboard.writeText(lastInvite)
                  toast.success("Copied")
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          ) : active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active voice rooms</p>
          ) : (
            <ul className="space-y-3">
              {active.map((room) => (
                <li
                  key={room.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{room.region}</p>
                    <p className="text-xs text-muted-foreground truncate">{room.room_name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-[#0E8F3D]/10 text-[#0E8F3D] border-[#0E8F3D]/30">
                        {room.participant_count ?? 0} participants
                      </Badge>
                      <Badge variant="outline">Live</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openControl(room)}>
                    <Settings2 className="h-4 w-4 mr-1" />
                    Open control panel
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Past rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No ended rooms yet</p>
          ) : (
            <ul className="space-y-2">
              {past.slice(0, 20).map((room) => (
                <li
                  key={room.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{room.region}</p>
                    <p className="text-xs text-muted-foreground">
                      {room.ended_at
                        ? new Date(room.ended_at).toLocaleString()
                        : new Date(room.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadRecording(room)}>
                    <Download className="h-4 w-4 mr-1" />
                    Download recording
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {controlRoom && controlToken && (
        <VoiceRoomAdminControl
          roomId={controlRoom.id}
          roomName={controlRoom.room_name}
          token={controlToken.token}
          serverUrl={controlToken.serverUrl}
          onClose={() => {
            setControlRoom(null)
            setControlToken(null)
          }}
          onEnded={() => {
            setControlRoom(null)
            setControlToken(null)
            void load()
          }}
        />
      )}
    </div>
  )
}
