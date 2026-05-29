"use client"

import { Badge } from "@/components/ui/badge"
import type { AgentProfileFields } from "@/lib/agent-profile-completion"
import {
  getPhotoVerificationStatus,
  photoVerificationStatusLabel,
} from "@/lib/photo-verification-status"

type Props = {
  agent: AgentProfileFields
  className?: string
}

export function AdminAgentVerificationBadge({ agent, className }: Props) {
  const status = getPhotoVerificationStatus(agent)
  if (status === "verified") {
    return (
      <Badge
        className={`bg-emerald-100 text-[#0E8F3D] border-emerald-200 text-[10px] ${className ?? ""}`}
      >
        {photoVerificationStatusLabel(status)}
      </Badge>
    )
  }
  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className={`bg-blue-50 text-blue-800 border-blue-200 text-[10px] ${className ?? ""}`}
      >
        {photoVerificationStatusLabel(status)}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`bg-amber-50 text-amber-800 border-amber-200 text-[10px] ${className ?? ""}`}
    >
      {photoVerificationStatusLabel(status)}
    </Badge>
  )
}
