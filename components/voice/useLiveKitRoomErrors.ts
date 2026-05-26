"use client"

import { useCallback, useEffect, useRef } from "react"
import { RoomEvent, type Room } from "livekit-client"
import { toast } from "sonner"
import { isTransientLiveKitError } from "@/lib/livekit-error-utils"

const SUBSCRIPTION_FAIL_GRACE_MS = 5000

/**
 * Suppresses transient LiveKit subscription/permission toasts that resolve once tracks subscribe.
 * Shows a toast only if the error persists past the grace window.
 */
export function useLiveKitRoomErrors(room: Room | undefined) {
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const clearPending = useCallback((key: string) => {
    const t = pendingRef.current.get(key)
    if (t) clearTimeout(t)
    pendingRef.current.delete(key)
  }, [])

  const scheduleErrorToast = useCallback(
    (key: string, message: string) => {
      clearPending(key)
      const timer = setTimeout(() => {
        pendingRef.current.delete(key)
        toast.error(message)
      }, SUBSCRIPTION_FAIL_GRACE_MS)
      pendingRef.current.set(key, timer)
    },
    [clearPending],
  )

  const handleRoomError = useCallback(
    (message: string) => {
      if (isTransientLiveKitError(message)) {
        scheduleErrorToast(`room:${message.slice(0, 40)}`, message)
        return
      }
      toast.error(message)
    },
    [scheduleErrorToast],
  )

  useEffect(() => {
    if (!room) return

    const onTrackSubscribed = () => {
      pendingRef.current.forEach((_, key) => {
        if (key.startsWith("sub:") || key.startsWith("room:")) clearPending(key)
      })
    }

    const onSubscriptionFailed = (
      trackSid: string,
      _reason?: unknown,
    ) => {
      const key = `sub:${trackSid}`
      scheduleErrorToast(
        key,
        "Could not subscribe to a video track. Retrying…",
      )
    }

    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed)
    room.on(RoomEvent.TrackSubscriptionFailed, onSubscriptionFailed)

    return () => {
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed)
      room.off(RoomEvent.TrackSubscriptionFailed, onSubscriptionFailed)
      pendingRef.current.forEach((t) => clearTimeout(t))
      pendingRef.current.clear()
    }
  }, [room, clearPending, scheduleErrorToast])

  useEffect(
    () => () => {
      pendingRef.current.forEach((t) => clearTimeout(t))
      pendingRef.current.clear()
    },
    [],
  )

  return { handleRoomError }
}
