"use client"

import { voiceVideoCaptureDefaults } from "@/lib/voice-video-utils"

export type CameraPermissionResult =
  | { ok: true }
  | { ok: false; message: string; denied: boolean }

function captureConstraints(isMobile: boolean): MediaStreamConstraints {
  const { facingMode } = voiceVideoCaptureDefaults(isMobile)
  const portraitWidth = 1080
  const portraitHeight = 1920
  return {
    video: {
      width: { ideal: portraitWidth, min: isMobile ? 720 : 640 },
      height: { ideal: portraitHeight, min: isMobile ? 1280 : 480 },
      aspectRatio: { ideal: 9 / 16 },
      facingMode,
    },
    audio: false,
  }
}

/** Prompt for camera permission before LiveKit publishes video. */
export async function requestCameraAccess(isMobile: boolean): Promise<CameraPermissionResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      denied: false,
      message: "Camera is not supported in this browser.",
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(captureConstraints(isMobile))
    stream.getTracks().forEach((t) => t.stop())
    return { ok: true }
  } catch (err) {
    const denied =
      err instanceof DOMException &&
      (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")

    if (denied) {
      return {
        ok: false,
        denied: true,
        message:
          "Camera permission is blocked. Allow camera for this site in your browser settings, then tap the camera button again.",
      }
    }

    if (err instanceof DOMException && err.name === "NotFoundError") {
      return {
        ok: false,
        denied: false,
        message: "No camera was found on this device.",
      }
    }

    return {
      ok: false,
      denied: false,
      message:
        err instanceof Error ? err.message : "Could not access the camera. Check permissions and try again.",
    }
  }
}

export function cameraPermissionToastMessage(result: Extract<CameraPermissionResult, { ok: false }>): string {
  return result.message
}
