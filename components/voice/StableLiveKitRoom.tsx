"use client"

import { useEffect, useState } from "react"
import { LiveKitRoom, type LiveKitRoomProps } from "@livekit/components-react"

/**
 * Defers LiveKit connect until after mount so React Strict Mode / quick remounts
 * do not trigger immediate "client initiated disconnect".
 */
export function StableLiveKitRoom({
  connect: connectProp = true,
  ...props
}: LiveKitRoomProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setMounted(true)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [])

  return <LiveKitRoom {...props} connect={Boolean(connectProp && mounted)} />
}
