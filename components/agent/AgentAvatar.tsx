"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getAgentInitials } from "@/lib/agent-profile-completion"

type Props = {
  name?: string | null
  imageUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: { box: "h-8 w-8", text: "text-xs", img: 32 },
  md: { box: "h-10 w-10", text: "text-sm", img: 40 },
  lg: { box: "h-14 w-14", text: "text-base", img: 56 },
}

export function AgentAvatar({ name, imageUrl, size = "md", className }: Props) {
  const s = sizeMap[size]
  const initials = getAgentInitials(name)
  const [loaded, setLoaded] = useState(false)

  if (imageUrl?.trim()) {
    return (
      <div
        className={cn(s.box, "relative rounded-full overflow-hidden shrink-0 bg-[#e8f5ec] border-2 border-white/30", className)}
      >
        {!loaded && <div className="absolute inset-0 animate-pulse bg-[#c8e6d0]" />}
        <Image
          src={imageUrl}
          alt={name ? `${name} profile` : "Agent profile"}
          width={s.img}
          height={s.img}
          loading="lazy"
          className={cn("object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          onLoad={() => setLoaded(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        s.box,
        s.text,
        "rounded-full bg-[#0E8F3D] text-white font-semibold flex items-center justify-center border-2 border-white/30 shrink-0",
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}
