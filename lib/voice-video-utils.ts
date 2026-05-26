"use client"

import { useCallback, useEffect, useState } from "react"
import type { RoomOptions } from "livekit-client"

/** Phone / narrow view: portrait 9:16 (TikTok-style live). Desktop: 16:9 Meet-style. */
export function detectVoiceVideoMobile(): boolean {
  if (typeof window === "undefined") return false
  if (window.innerWidth < 768) return true
  const ua = navigator.userAgent || ""
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}

export function voiceVideoAspectClass(isMobile: boolean): string {
  return isMobile ? "aspect-[9/16] max-h-[min(85dvh,720px)]" : "aspect-video max-h-[min(70vh,720px)]"
}

/** Mobile live: fill vertical frame (TikTok). Desktop conference: letterbox (Meet). */
export function voiceVideoObjectFitClass(isMobile: boolean): string {
  return isMobile ? "object-cover object-center" : "object-contain object-center"
}

export function voiceVideoCaptureDefaults(isMobile: boolean) {
  return {
    resolution: isMobile
      ? { width: 720, height: 1280, frameRate: 24 }
      : { width: 1280, height: 720, frameRate: 24 },
    facingMode: "user" as const,
  }
}

export function voiceLiveKitRoomOptions(isMobile: boolean): Partial<RoomOptions> {
  return {
    disconnectOnPageLeave: false,
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
    objectFitClass: voiceVideoObjectFitClass(isMobile),
    roomOptions: voiceLiveKitRoomOptions(isMobile),
  }
}
