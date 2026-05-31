"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  resolveDatingPhotoUrl,
  type DatingPhotoRef,
} from "@/lib/dating/dating-photo-client"
import { cn } from "@/lib/utils"

type Props = {
  photo: DatingPhotoRef
  alt?: string
  className?: string
}

/** Loads dating photos with cookie auth; falls back to Bearer fetch if <img> fails. */
export function DatingPhotoImage({ photo, alt = "", className }: Props) {
  const primarySrc = resolveDatingPhotoUrl(photo)
  const [src, setSrc] = useState(primarySrc)
  const triedAuthFetch = useRef(false)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    setSrc(primarySrc)
    triedAuthFetch.current = false
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [primarySrc, photo.id])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  const loadWithAuth = useCallback(async () => {
    if (triedAuthFetch.current) return
    triedAuthFetch.current = true
    try {
      const res = await fetch(`/api/agent/dating/photos/${photo.id}/serve`, {
        headers: getAgentAuthHeaders(),
        credentials: "same-origin",
      })
      if (!res.ok) return
      const blob = await res.blob()
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setSrc(url)
    } catch {
      /* keep broken state */
    }
  }, [photo.id])

  return (
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      onError={() => void loadWithAuth()}
    />
  )
}
