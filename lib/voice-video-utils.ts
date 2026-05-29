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

/** Always request portrait 9:16 capture for live conferences and channel streams. */
export function voiceVideoCaptureDefaults(_isMobile?: boolean) {
  return {
    resolution: { width: 1080, height: 1920, frameRate: 24 },
    facingMode: "user" as const,
    aspectRatio: 9 / 16,
  }
}

export function voiceLiveKitRoomOptions(isMobile: boolean): Partial<RoomOptions> {
  const capture = voiceVideoCaptureDefaults(isMobile)
  return {
    disconnectOnPageLeave: false,
    publishDefaults: { simulcast: false },
    videoCaptureDefaults: {
      resolution: capture.resolution,
      facingMode: capture.facingMode,
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
    aspectClass: voiceVideoAspectClass(isMobile),
    objectFitClass: voiceVideoObjectFitClass(isMobile),
    roomOptions: voiceLiveKitRoomOptions(isMobile),
  }
}
