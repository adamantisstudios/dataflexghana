"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { getDatingPhotoServePath } from "@/lib/dating/dating-photo-client"
import { getStoredAgent } from "@/lib/unified-auth-system"
import { cn } from "@/lib/utils"

type Props = {
  photoId: string
  alt?: string
  className?: string
  /** Full-size viewer: watermark, anti-screenshot deterrents, DevTools blur. */
  protected?: boolean
}

function buildWatermarkLabel(): string {
  const agent = getStoredAgent()
  if (!agent) return "DataFlex · Logged session"
  const parts = [agent.full_name, agent.email, agent.phone_number].filter(Boolean)
  return parts.join(" · ") || `Agent ${agent.id.slice(0, 8)}`
}

function useDevToolsOpen(): boolean {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const threshold = 160
    const check = () => {
      const widthGap = window.outerWidth - window.innerWidth > threshold
      const heightGap = window.outerHeight - window.innerHeight > threshold
      setOpen(widthGap || heightGap)
    }
    check()
    const id = window.setInterval(check, 1500)
    window.addEventListener("resize", check)
    return () => {
      window.clearInterval(id)
      window.removeEventListener("resize", check)
    }
  }, [])

  return open
}

/**
 * Loads dating photos via authenticated serve API (Bearer + cookies).
 * Optional protection overlay for full-size views.
 */
export function DatingPhotoImage({
  photoId,
  alt = "",
  className,
  protected: isProtected = false,
}: Props) {
  const serveUrl = getDatingPhotoServePath(photoId)
  const [src, setSrc] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const devToolsOpen = useDevToolsOpen()
  const watermark = useMemo(() => buildWatermarkLabel(), [])

  const loadWithAuth = useCallback(async () => {
    try {
      const res = await fetch(serveUrl, {
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
      /* placeholder */
    }
  }, [serveUrl])

  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setSrc(null)
    void loadWithAuth()
  }, [photoId, loadWithAuth])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  const showProtection = isProtected && devToolsOpen

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
    <div
      className={cn("relative overflow-hidden", className)}
      onContextMenu={(e) => {
        if (isProtected) e.preventDefault()
      }}
      style={{
        userSelect: isProtected ? "none" : undefined,
        WebkitUserSelect: isProtected ? "none" : undefined,
      }}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover",
          showProtection && "blur-md scale-105",
        )}
        draggable={false}
        onError={() => void loadWithAuth()}
      />

      {isProtected && (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
            aria-hidden
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="absolute whitespace-nowrap text-[10px] font-medium text-black/[0.03]"
                style={{
                  transform: "rotate(-24deg)",
                  left: `${(i % 4) * 28 - 8}%`,
                  top: `${Math.floor(i / 4) * 32 + 5}%`,
                }}
              >
                {watermark}
              </span>
            ))}
          </div>
          {showProtection && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 px-4 text-center text-xs font-medium text-white">
              Developer tools detected. Close DevTools to view photos. Your session is logged.
            </div>
          )}
        </>
      )}
    </div>
  )
}
