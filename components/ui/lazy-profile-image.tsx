"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type Props = {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  rounded?: "full" | "xl" | "lg" | "none"
}

const roundedClass = {
  full: "rounded-full",
  xl: "rounded-xl",
  lg: "rounded-lg",
  none: "",
}

export function LazyProfileImage({ src, alt, width, height, className, rounded = "full" }: Props) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className={cn("relative overflow-hidden shrink-0 bg-[#e8f5ec]", roundedClass[rounded], className)}
      style={{ width, height }}
    >
      {!loaded && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 animate-pulse bg-gradient-to-br from-[#e8f5ec] to-[#c8e6d0]",
            roundedClass[rounded],
          )}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={cn(
          "object-cover transition-opacity duration-300",
          roundedClass[rounded],
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={{ width, height }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
