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
import { Copy, Loader2, Phone, RefreshCw, Settings2, Download, Radio, Users, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
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

const RECORDINGS_PAGE_SIZE = 12

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`rounded-lg bg-slate-200 animate-pulse ${className ?? "h-16"}`} />
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
  const [pastPage, setPastPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      if (data.recordingWarning) toast.warning(data.recordingWarning)
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

  const deleteRecording = async (room: VoiceRoom) => {
    if (
      !window.confirm(
        `Delete this conference recording for ${room.region}? This removes the database entry and LiveKit egress files.`,
      )
    ) {
      return
    }
    setDeletingId(room.id)
    try {
      const res = await fetch(`/api/admin/voice-rooms/${room.id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast.success("Recording deleted")
      setPastPage(1)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingId(null)
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
  const past = rooms
    .filter((r) => !r.is_active)
    .sort((a, b) => {
      const ta = new Date(a.ended_at || a.created_at).getTime()
      const tb = new Date(b.ended_at || b.created_at).getTime()
      return tb - ta
    })

  const pastTotalPages = Math.max(1, Math.ceil(past.length / RECORDINGS_PAGE_SIZE))
  const safePastPage = Math.min(pastPage, pastTotalPages)
  const pastPageRooms = past.slice(
    (safePastPage - 1) * RECORDINGS_PAGE_SIZE,
    safePastPage * RECORDINGS_PAGE_SIZE,
  )

  const cardClass = "border-blue-200 bg-white/95 text-slate-900 shadow-md"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-xl">
          Invitation-only Agent Conferences by region. Agents join from their dashboard menu. The live
          control panel opens in immersive dark mode.
        </p>
        <div className="flex gap-2">
          <Link href="/admin/voice-rooms">
            <Button variant="outline" size="sm" className="text-gray-900 border-gray-300 bg-white">
              Full page
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="text-gray-900 border-gray-300 bg-white"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-blue-900">
            <Phone className="h-4 w-4 text-emerald-600" />
            Create room
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!recordingEnabled && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
              Recording is disabled. Set{" "}
              <code className="text-[11px] bg-amber-100 px-1 rounded">LIVEKIT_RECORDING_ENABLED=true</code> to enable
              egress.
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
              className="bg-[#0E8F3D] hover:bg-[#0a7a34] text-white w-full sm:w-auto h-11"
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
            <Label className="text-xs text-muted-foreground">Invite link</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={lastInvite} className="text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 text-gray-900"
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

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="text-base text-blue-900 flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-600" />
            Active rooms
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <SkeletonBlock />
              <SkeletonBlock />
            </div>
          ) : active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active voice rooms</p>
          ) : (
            <ul className="space-y-3">
              {active.map((room) => (
                <li
                  key={room.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-100 p-4 bg-emerald-50/50"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-900">{room.region}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{room.room_name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <Users className="h-3 w-3 mr-1" />
                        {room.participant_count ?? 0} in room
                      </Badge>
                      <Badge variant="outline" className="border-emerald-400 text-emerald-700 animate-pulse">
                        Live
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#0E8F3D] hover:bg-[#0a7a34] text-white h-11 shrink-0"
                    onClick={() => openControl(room)}
                  >
                    <Settings2 className="h-4 w-4 mr-1" />
                    Open control panel
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="text-base text-blue-900">Download recordings</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {past.length} ended conference{past.length === 1 ? "" : "s"} · {RECORDINGS_PAGE_SIZE} per page
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonBlock className="h-24" />
          ) : past.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No ended rooms yet</p>
          ) : (
            <>
              <ul className="space-y-2">
                {pastPageRooms.map((room) => (
                  <li
                    key={room.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{room.region}</p>
                      <p className="text-xs text-muted-foreground truncate">{room.room_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.ended_at
                          ? new Date(room.ended_at).toLocaleString()
                          : new Date(room.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-900 border-gray-300 bg-white h-10"
                        onClick={() => downloadRecording(room)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 border-red-200 bg-white h-10 hover:bg-red-50"
                        disabled={deletingId === room.id}
                        onClick={() => void deleteRecording(room)}
                      >
                        {deletingId === room.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {pastTotalPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 text-gray-900"
                    disabled={safePastPage <= 1}
                    onClick={() => setPastPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  {Array.from({ length: pastTotalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      type="button"
                      size="sm"
                      variant={pageNum === safePastPage ? "default" : "outline"}
                      className={
                        pageNum === safePastPage
                          ? "h-9 min-w-9 bg-[#0E8F3D] hover:bg-[#0a7a34]"
                          : "h-9 min-w-9 text-gray-900"
                      }
                      onClick={() => setPastPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 text-gray-900"
                    disabled={safePastPage >= pastTotalPages}
                    onClick={() => setPastPage((p) => Math.min(pastTotalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {controlRoom && controlToken && (
        <VoiceRoomAdminControl
          roomId={controlRoom.id}
          roomName={controlRoom.room_name}
          token={controlToken.token}
          serverUrl={controlToken.serverUrl}
          recordingEnabled={recordingEnabled}
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
