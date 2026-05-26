"use client"

import { useEffect, useRef, useState } from "react"

/** Detect landscape camera feed inside a 9:16 portrait frame (common on phones). */
export function usePortraitVideoLayout(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [landscapeFeed, setLandscapeFeed] = useState(false)

  useEffect(() => {
    if (!active) {
      setLandscapeFeed(false)
      return
    }

    const root = containerRef.current
    if (!root) return

    const measure = (video: HTMLVideoElement) => {
      const { videoWidth: w, videoHeight: h } = video
      if (w > 0 && h > 0) {
        setLandscapeFeed(w > h * 1.05)
      }
    }

    const bindVideo = (video: HTMLVideoElement) => {
      const onMeta = () => measure(video)
      video.addEventListener("loadedmetadata", onMeta)
      video.addEventListener("resize", onMeta)
      if (video.readyState >= 1) onMeta()
      return () => {
        video.removeEventListener("loadedmetadata", onMeta)
        video.removeEventListener("resize", onMeta)
      }
    }

    const cleanups: Array<() => void> = []
    const scan = () => {
      cleanups.forEach((fn) => fn())
      cleanups.length = 0
      const video = root.querySelector("video")
      if (video) cleanups.push(bindVideo(video))
    }

    scan()
    const obs = new MutationObserver(scan)
    obs.observe(root, { childList: true, subtree: true })

    return () => {
      obs.disconnect()
      cleanups.forEach((fn) => fn())
    }
  }, [active])

  return { containerRef, landscapeFeed }
}
