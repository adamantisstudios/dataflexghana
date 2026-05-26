"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionState } from "livekit-client"
import { Mic, MicOff } from "lucide-react"
import { isTransientLiveKitError } from "@/lib/livekit-error-utils"
import { useLiveKitRoomErrors } from "@/components/voice/useLiveKitRoomErrors"

type Props = {
  token: string
  serverUrl: string
  onDisconnected?: () => void
  renderControls: (ctx: {
    elapsed: number
    isMuted: boolean
    toggleMute: () => void
    connected: boolean
  }) => ReactNode
}

function CallAudioInner({
  onDisconnected,
  renderControls,
}: Omit<Props, "token" | "serverUrl">) {
  const room = useRoomContext()
  useLiveKitRoomErrors(room)
  const connectionState = useConnectionState()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [connectionState])

  useEffect(() => {
    if (connectionState === ConnectionState.Disconnected) {
      onDisconnected?.()
    }
  }, [connectionState, onDisconnected])

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      void localParticipant.setCameraEnabled(false)
      void localParticipant.setMicrophoneEnabled(true)
    }
  }, [connectionState, localParticipant])

  const connected = connectionState === ConnectionState.Connected

  return (
    <>
      <RoomAudioRenderer />
      {renderControls({
        elapsed,
        isMuted: !isMicrophoneEnabled,
        toggleMute: () => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled),
        connected,
      })}
    </>
  )
}

/** Audio-only LiveKit room for agent↔admin support calls. */
export function CallLiveKitAudio({ token, serverUrl, onDisconnected, renderControls }: Props) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video={false}
      onError={(e) => {
        if (!isTransientLiveKitError(e.message)) {
          console.error("[call-audio]", e.message)
        }
      }}
      className="contents"
    >
      <CallAudioInner onDisconnected={onDisconnected} renderControls={renderControls} />
    </LiveKitRoom>
  )
}

export function CallMuteButton({
  isMuted,
  onToggle,
}: {
  isMuted: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
        isMuted ? "bg-slate-600 text-white" : "bg-emerald-500 text-white"
      }`}
      title={isMuted ? "Unmute" : "Mute"}
    >
      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  )
}
