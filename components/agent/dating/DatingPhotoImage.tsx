"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  isDatingPhotoServeUrl,
  resolveDatingPhotoUrl,
  type DatingPhotoRef,
} from "@/lib/dating/dating-photo-client"
import { cn } from "@/lib/utils"

type Props = {
  photo: DatingPhotoRef
  alt?: string
  className?: string
}

/**
 * Dating images use either a public r2.dev URL or the authenticated serve API.
 * <img> cannot send Bearer tokens — serve URLs are loaded via fetch + blob URL.
 */
export function DatingPhotoImage({ photo, alt = "", className }: Props) {
  const resolvedUrl = resolveDatingPhotoUrl(photo)
  const needsAuthFetch = isDatingPhotoServeUrl(resolvedUrl)
  const [src, setSrc] = useState<string | null>(needsAuthFetch ? null : resolvedUrl)
  const blobUrlRef = useRef<string | null>(null)

  const loadWithAuth = useCallback(async () => {
    try {
      const res = await fetch(resolvedUrl, {
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
      /* keep placeholder */
    }
  }, [resolvedUrl])

  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }

    if (needsAuthFetch) {
      setSrc(null)
      void loadWithAuth()
    } else {
      setSrc(resolvedUrl)
    }
  }, [resolvedUrl, needsAuthFetch, loadWithAuth, photo.id])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  if (!src) {
    return (
      <div
        className={cn(className, "animate-pulse bg-gray-200")}
        aria-hidden
        role="presentation"
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      onError={() => {
        if (!needsAuthFetch) void loadWithAuth()
      }}
    />
  )
}
