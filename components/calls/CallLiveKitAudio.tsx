"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
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
  sessionKey: string
  /** Called when the remote party ends the call (detect via app state, not transient disconnect). */
  onRemoteEnded?: () => void
  renderControls: (ctx: {
    elapsed: number
    isMuted: boolean
    toggleMute: () => void
    connected: boolean
  }) => ReactNode
}

function CallAudioInner({
  renderControls,
}: {
  renderControls: Props["renderControls"]
}) {
  const room = useRoomContext()
  useLiveKitRoomErrors(room)
  const connectionState = useConnectionState()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const [elapsed, setElapsed] = useState(0)
  const micEnabledRef = useRef(false)

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [connectionState])

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || micEnabledRef.current) return
    micEnabledRef.current = true
    void localParticipant.setCameraEnabled(false)
    void localParticipant.setMicrophoneEnabled(true)
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
export function CallLiveKitAudio({
  token,
  serverUrl,
  sessionKey,
  renderControls,
}: Props) {
  if (!token || !serverUrl) return null

  return (
    <div className="sr-only" aria-hidden>
      <LiveKitRoom
        key={sessionKey}
        token={token}
        serverUrl={serverUrl}
        connect
        audio
        video={false}
        options={{
          disconnectOnPageLeave: false,
          publishDefaults: { simulcast: false },
        }}
        onError={(e) => {
          if (!isTransientLiveKitError(e.message)) {
            console.error("[call-audio]", e.message)
          }
        }}
      >
        <CallAudioInner renderControls={renderControls} />
      </LiveKitRoom>
    </div>
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
