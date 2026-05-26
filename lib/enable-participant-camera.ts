"use client"

import type { LocalParticipant } from "livekit-client"
import { requestCameraAccess } from "@/lib/camera-permission"

export type EnableCameraResult = { ok: true } | { ok: false; message: string; denied?: boolean }

/** Request browser permission, then toggle LiveKit camera publish. */
export async function setParticipantCameraEnabled(
  localParticipant: LocalParticipant,
  enabled: boolean,
  isMobile: boolean,
): Promise<EnableCameraResult> {
  if (!enabled) {
    await localParticipant.setCameraEnabled(false)
    return { ok: true }
  }

  const perm = await requestCameraAccess(isMobile)
  if (!perm.ok) {
    return { ok: false, message: perm.message, denied: perm.denied }
  }

  try {
    await localParticipant.setCameraEnabled(true)
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Could not start the camera. Allow camera access and try again.",
    }
  }
}
