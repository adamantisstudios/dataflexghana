"use client"

import Link from "next/link"
import { ShieldCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMissingAgentProfileFields, type AgentProfileFields } from "@/lib/agent-profile-completion"

export function ProfileVerificationBar({ agent }: { agent?: AgentProfileFields | null }) {
  const missing = getMissingAgentProfileFields(agent)
  const hasApprovedPhoto = Boolean(agent?.profile_verified)
  const missingText = missing.length > 0 ? missing.join(", ") : "your remaining details"

  return (
    <div
      className="sticky top-14 z-30 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm"
      role="status"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
          <ShieldCheck className="h-5 w-5 text-[#0E8F3D] shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm text-emerald-900 leading-snug">
            {hasApprovedPhoto
              ? "Your photo has been approved. Please complete "
              : "Complete "}
            <strong>{missingText}</strong> to keep the community trusted and unlock full verified status.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="shrink-0 bg-[#0E8F3D] hover:bg-[#35B24A] text-white w-full sm:w-auto"
        >
          <Link href="/agent/settings">
            Complete profile
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
