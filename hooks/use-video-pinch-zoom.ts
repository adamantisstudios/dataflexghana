"use client"

import { useCallback, useRef, useState, type RefObject } from "react"

const MIN_SCALE = 1
const MAX_SCALE = 2.5
const DOUBLE_TAP_MS = 320

/** Pinch + double-tap zoom on the video inner wrapper (agent viewer). */
export function useVideoPinchZoom(enabled: boolean, _targetRef?: RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1)
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const lastTapRef = useRef(0)

  const clamp = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v))

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        pinchRef.current = { dist: Math.hypot(dx, dy), scale }
      } else if (e.touches.length === 1) {
        const now = Date.now()
        if (now - lastTapRef.current < DOUBLE_TAP_MS) {
          setScale((s) => (s > 1.05 ? 1 : 1.45))
          lastTapRef.current = 0
        } else {
          lastTapRef.current = now
        }
      }
    },
    [enabled, scale],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || e.touches.length !== 2 || !pinchRef.current) return
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const ratio = dist / pinchRef.current.dist
      setScale(clamp(pinchRef.current.scale * ratio))
    },
    [enabled],
  )

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null
  }, [])

  const resetZoom = useCallback(() => setScale(1), [])

  return {
    scale,
    resetZoom,
    touchHandlers: enabled
      ? {
          onTouchStart,
          onTouchMove,
          onTouchEnd,
          onTouchCancel: onTouchEnd,
        }
      : {},
  }
}
