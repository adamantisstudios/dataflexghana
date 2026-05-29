"use client"

export type CameraPermissionResult =
  | { ok: true }
  | { ok: false; message: string; denied: boolean }

/** Portrait-only camera constraints — no landscape fallback. */
function captureConstraints(): MediaStreamConstraints {
  return {
    video: {
      width: { ideal: 1080 },
      height: { ideal: 1920 },
      aspectRatio: { ideal: 9 / 16 },
      facingMode: "user",
    },
    audio: false,
  }
}

/** Prompt for camera permission before LiveKit publishes video. */
export async function requestCameraAccess(
  _isMobile?: boolean,
): Promise<CameraPermissionResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      denied: false,
      message: "Camera is not supported in this browser.",
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(captureConstraints())
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
