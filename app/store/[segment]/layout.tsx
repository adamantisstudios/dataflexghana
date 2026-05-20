import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getStorefrontPageMetadata, resolveStoreSegmentToAgentId } from "@/lib/storefront-server"
import { buildStorefrontPageMetadata } from "@/lib/storefront-pwa-metadata"
import { buildStorefrontPathUrl, getStorefrontOrigin } from "@/lib/storefront-utils"

const RESERVED_SEGMENTS = new Set(["not-available", "payment-failed", "invalid-agent"])

type LayoutProps = {
  children: ReactNode
  params: Promise<{ segment: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { segment } = await params
  if (RESERVED_SEGMENTS.has(segment)) {
    return { title: "Store" }
  }

  const agentId = await resolveStoreSegmentToAgentId(segment)
  if (!agentId) {
    return { title: "Store Not Available" }
  }

  const meta = await getStorefrontPageMetadata(agentId)
  if (!meta) {
    return { title: "Store Not Available" }
  }

  const origin = getStorefrontOrigin()
  const url = buildStorefrontPathUrl(origin, meta.storeSlug || segment)

  return buildStorefrontPageMetadata(
    {
      agentId,
      storeName: meta.storeName,
      businessInfo: meta.businessInfo,
      storeSlug: meta.storeSlug,
    },
    url,
    origin,
  )
}

export default function StoreSegmentLayout({ children }: { children: ReactNode }) {
  return children
}
