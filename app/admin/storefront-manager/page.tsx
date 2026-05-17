"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Redirect legacy route to admin dashboard tab */
export default function StorefrontManagerPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin?tab=storefront-manager")
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Opening Storefront Manager…</p>
    </div>
  )
}
