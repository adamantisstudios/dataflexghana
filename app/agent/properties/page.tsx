"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/** Bookmark fallback — unified real estate flow lives in Referral Hub */
export default function AgentPropertiesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/agent/referralhub?hubTab=marketplace&marketplaceTab=real-estate")
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="text-sm text-slate-600">Opening Real Estate in Referral Hub…</p>
    </div>
  )
}
