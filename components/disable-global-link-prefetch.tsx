"use client"

import { useRouter } from "next/navigation"

/** No-op Next.js router prefetch to reduce background RSC/data requests from <Link>. */
export function DisableGlobalLinkPrefetch() {
  useRouter().prefetch = () => {}
  return null
}
