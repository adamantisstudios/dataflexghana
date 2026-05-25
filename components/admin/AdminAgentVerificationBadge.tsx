"use client"

import { Badge } from "@/components/ui/badge"
import { isAgentProfileVerified, type AgentProfileFields } from "@/lib/agent-profile-completion"

type Props = {
  agent: AgentProfileFields
  className?: string
}

export function AdminAgentVerificationBadge({ agent, className }: Props) {
  if (isAgentProfileVerified(agent)) {
    return (
      <Badge
        className={`bg-emerald-100 text-[#0E8F3D] border-emerald-200 text-[10px] ${className ?? ""}`}
      >
        Verified
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`bg-amber-50 text-amber-800 border-amber-200 text-[10px] ${className ?? ""}`}
    >
      Unverified
    </Badge>
  )
}
