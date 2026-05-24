"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { detectPlatformFromEmbed, prepareAgentFeedEmbed } from "@/lib/tutorial-embed"

interface ChannelEmbedVideoDisplayProps {
  id: string
  title: string
  embedCode: string
  platform?: string
  createdAt?: string
}

export function ChannelEmbedVideoDisplay({
  id,
  title,
  embedCode,
  platform,
  createdAt,
}: ChannelEmbedVideoDisplayProps) {
  const preparedEmbed = useMemo(() => prepareAgentFeedEmbed(embedCode), [embedCode])
  const detectedPlatform = platform || detectPlatformFromEmbed(embedCode) || "vimeo"

  if (!preparedEmbed) {
    return (
      <div className="p-4 text-center text-sm text-red-600 bg-red-50 rounded-lg">
        Invalid embed code. Only Vimeo and YouTube iframes are supported.
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="px-3 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs bg-[#0E8F3D]/10 text-[#0E8F3D] capitalize">
            {detectedPlatform} embed
          </Badge>
          {createdAt && (
            <span className="text-xs text-gray-500">{new Date(createdAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      <div
        className="relative w-full max-w-xs mx-auto aspect-[9/16] bg-black rounded-lg overflow-hidden [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
        dangerouslySetInnerHTML={{ __html: preparedEmbed }}
      />
    </div>
  )
}
