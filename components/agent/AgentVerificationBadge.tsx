"use client"

import { Badge } from "@/components/ui/badge"
import { isAgentProfileVerified, type AgentProfileFields } from "@/lib/agent-profile-completion"

type Props = {
  agent: AgentProfileFields | null | undefined
  className?: string
}

export function AgentVerificationBadge({ agent, className }: Props) {
  const verified = isAgentProfileVerified(agent)

  if (verified) {
    return (
      <Badge
        className={`bg-[#0E8F3D]/90 text-white border-[#35B24A] text-[10px] sm:text-xs font-medium ${className ?? ""}`}
      >
        Verified
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`bg-amber-50 text-amber-800 border-amber-300 text-[10px] sm:text-xs font-medium ${className ?? ""}`}
    >
      Unverified
    </Badge>
  )
}
