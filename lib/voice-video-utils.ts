"use client"

import { useCallback, useEffect, useState } from "react"
import type { RoomOptions } from "livekit-client"

export function detectVoiceVideoMobile(): boolean {
  if (typeof window === "undefined") return false
  if (window.innerWidth < 768) return true
  const ua = navigator.userAgent || ""
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}

export function voiceLiveKitRoomOptions(_isMobile: boolean): Partial<RoomOptions> {
  return {
    disconnectOnPageLeave: false,
    publishDefaults: { simulcast: false },
    videoCaptureDefaults: {
      resolution: { width: 720, height: 1280, frameRate: 30 },
      facingMode: "user",
    },
  }
}

export function useVoiceDeviceLayout() {
  const [isMobile, setIsMobile] = useState(false)

  const refresh = useCallback(() => {
    setIsMobile(detectVoiceVideoMobile())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener("resize", refresh)
    return () => window.removeEventListener("resize", refresh)
  }, [refresh])

  return {
    isMobile,
    roomOptions: voiceLiveKitRoomOptions(isMobile),
  }
}
