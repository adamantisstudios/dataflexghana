"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ensureHttpsImageUrl } from "@/lib/image-url"

interface ImageWithFallbackProps {
  src: string | undefined | null
  alt: string
  fallbackSrc?: string
  className?: string
  onClick?: () => void
  onError?: () => void
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  className,
  onClick,
  onError,
}: ImageWithFallbackProps) {
  const secureSrc = ensureHttpsImageUrl(src) || fallbackSrc
  const [imgSrc, setImgSrc] = useState(secureSrc)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
    setImgSrc(ensureHttpsImageUrl(src) || fallbackSrc)
  }, [src, fallbackSrc])

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true)
      setImgSrc(fallbackSrc)
      onError?.()
    }
  }

  const handleLoad = () => {
    setHasError(false)
  }

  // Check if URL is valid
  const isValidUrl = (url: string | undefined | null): boolean => {
    if (!url || typeof url !== 'string') return false
    try {
      new URL(url)
      return true
    } catch {
      // Check if it's a relative path
      return url.startsWith('/') || url.startsWith('./') || url.startsWith('../')
    }
  }

  const finalSrc = isValidUrl(src) ? imgSrc : fallbackSrc

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={cn("transition-opacity duration-200", className)}
      onClick={onClick}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  )
}
