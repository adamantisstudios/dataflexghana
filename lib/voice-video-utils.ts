"use client"

import { useCallback, useEffect, useState } from "react"
import type { RoomOptions } from "livekit-client"
import { LIVE_CAMERA_VIDEO_CONSTRAINTS } from "@/lib/live-camera-constraints"

/** Narrow viewport / mobile UA — used for layout only (not capture constraints). */
export function detectVoiceVideoMobile(): boolean {
  if (typeof window === "undefined") return false
  if (window.innerWidth < 768) return true
  const ua = navigator.userAgent || ""
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}

export function voiceVideoAspectClass(isMobile: boolean): string {
  return isMobile ? "aspect-[9/16] max-h-[min(85dvh,720px)]" : "aspect-[9/16] max-h-[min(70vh,720px)]"
}

/** @deprecated Use globals.css `.video-wrapper video` — kept for hook compatibility. */
export function voiceVideoObjectFitClass(_isMobile?: boolean): string {
  return ""
}

export function voiceVideoCaptureDefaults() {
  return {
    resolution: { width: 720, height: 720, frameRate: 30 },
    facingMode: "user" as const,
  }
}

export function voiceLiveKitRoomOptions(): Partial<RoomOptions> {
  const capture = voiceVideoCaptureDefaults()
  return {
    disconnectOnPageLeave: false,
    publishDefaults: { simulcast: false },
    videoCaptureDefaults: {
      resolution: capture.resolution,
      facingMode: capture.facingMode,
    },
  }
}

/** Browser permission probe — same ideals as LiveKit capture. */
export function voiceCameraPermissionConstraints(): MediaStreamConstraints {
  return { video: LIVE_CAMERA_VIDEO_CONSTRAINTS, audio: false }
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
    roomOptions: voiceLiveKitRoomOptions(),
  }
}
