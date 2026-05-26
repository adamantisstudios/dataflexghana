"use client"

import { useCallback, useEffect, useState } from "react"
import type { RoomOptions } from "livekit-client"

/** Phone: portrait 9:16. Desktop/tablet (≥768px): landscape 16:9. */
export function detectVoiceVideoMobile(): boolean {
  if (typeof window === "undefined") return false
  if (window.innerWidth < 768) return true
  const ua = navigator.userAgent || ""
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) && window.innerWidth < 1024
}

export function voiceVideoAspectClass(isMobile: boolean): string {
  return isMobile ? "aspect-[9/16]" : "aspect-video"
}

export function voiceVideoCaptureDefaults(isMobile: boolean) {
  return {
    resolution: isMobile
      ? { width: 720, height: 1280, frameRate: 30 }
      : { width: 1280, height: 720, frameRate: 30 },
    facingMode: "user" as const,
  }
}

export function voiceLiveKitRoomOptions(isMobile: boolean): Partial<RoomOptions> {
  return {
    publishDefaults: { simulcast: false },
    videoCaptureDefaults: voiceVideoCaptureDefaults(isMobile),
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
    aspectClass: voiceVideoAspectClass(isMobile),
    roomOptions: voiceLiveKitRoomOptions(isMobile),
  }
}
