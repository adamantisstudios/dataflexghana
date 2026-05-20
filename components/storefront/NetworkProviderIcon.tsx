"use client"

import Image from "next/image"
import { getNetworkProviderImage } from "@/lib/network-provider-icons"
import { cn } from "@/lib/utils"

type Props = {
  provider: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE = {
  sm: "h-6 w-6",
  md: "h-8 w-8 sm:h-10 sm:w-10",
  lg: "h-10 w-10",
} as const

export function NetworkProviderIcon({ provider, size = "md", className }: Props) {
  return (
    <span
      className={cn(
        "relative inline-block shrink-0 rounded-lg overflow-hidden shadow-sm border border-emerald-200/80",
        SIZE[size],
        className,
      )}
    >
      <Image
        src={getNetworkProviderImage(provider)}
        alt={`${provider} logo`}
        fill
        className="object-cover"
        sizes={size === "sm" ? "24px" : "40px"}
      />
    </span>
  )
}
