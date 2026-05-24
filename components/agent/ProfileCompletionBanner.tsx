"use client"

import Link from "next/link"
import { AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AGENT_PROFILE_PRIVACY_NOTICE } from "@/lib/agent-profile-completion"

export function ProfileCompletionBanner() {
  return (
    <div
      className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 shadow-sm"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-2">
          <h2 className="font-bold text-amber-900 text-base sm:text-lg">Complete Your Profile</h2>
          <p className="text-sm text-amber-800 leading-relaxed">
            Your information helps build a credible community and is kept private and secure. Complete your profile to
            unlock full platform benefits.
          </p>
          <p className="text-xs text-amber-700/90">{AGENT_PROFILE_PRIVACY_NOTICE}</p>
          <Button
            asChild
            className="mt-1 bg-[#0E8F3D] hover:bg-[#35B24A] text-white"
          >
            <Link href="/agent/settings">
              Go to Settings
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
