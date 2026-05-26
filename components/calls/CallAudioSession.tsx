"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionState } from "livekit-client"
import { isTransientLiveKitError } from "@/lib/livekit-error-utils"
import { useLiveKitRoomErrors } from "@/components/voice/useLiveKitRoomErrors"

export type CallAudioControls = {
  elapsed: number
  isMuted: boolean
  toggleMute: () => void
  connected: boolean
}

const CallAudioControlsContext = createContext<CallAudioControls | null>(null)

export function useCallAudioControls(): CallAudioControls | null {
  return useContext(CallAudioControlsContext)
}

function CallAudioSessionInner({ children }: { children: ReactNode }) {
  const room = useRoomContext()
  useLiveKitRoomErrors(room)
  const connectionState = useConnectionState()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const [elapsed, setElapsed] = useState(0)
  const [controls, setControls] = useState<CallAudioControls | null>(null)

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [connectionState])

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      void localParticipant.setCameraEnabled(false)
      void localParticipant.setMicrophoneEnabled(true)
    }
  }, [connectionState, localParticipant])

  useEffect(() => {
    setControls({
      elapsed,
      isMuted: !isMicrophoneEnabled,
      toggleMute: () => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled),
      connected: connectionState === ConnectionState.Connected,
    })
  }, [elapsed, isMicrophoneEnabled, connectionState, localParticipant])

  return (
    <CallAudioControlsContext.Provider value={controls}>
      <RoomAudioRenderer />
      {children}
    </CallAudioControlsContext.Provider>
  )
}

type SessionProps = {
  token: string
  serverUrl: string
  sessionKey: string
  children: ReactNode
}

/** Single LiveKit audio room — mount once per call; UI via useCallAudioControls(). */
export function CallAudioSession({ token, serverUrl, sessionKey, children }: SessionProps) {
  return (
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
      <CallAudioSessionInner>{children}</CallAudioSessionInner>
    </LiveKitRoom>
  )
}
