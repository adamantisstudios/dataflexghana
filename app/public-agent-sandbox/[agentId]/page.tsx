"use client"

import { Suspense } from "react"
import PublicAgentStorefront from "./storefront-client"

export default function PublicAgentStorefrontPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading store…</div>}>
      <PublicAgentStorefront />
    </Suspense>
  )
}
