import { notFound } from "next/navigation"
import { resolveStoreSegmentToAgentId } from "@/lib/storefront-server"
import { getPublicStorefrontResponse } from "@/lib/storefront-public"
import { StorefrontWholesaleCartClient } from "@/components/storefront/StorefrontWholesaleCartClient"

const RESERVED_SEGMENTS = new Set(["not-available", "payment-failed", "invalid-agent"])

type PageProps = {
  params: Promise<{ segment: string }>
}

export default async function StoreCartPage({ params }: PageProps) {
  const { segment } = await params

  if (RESERVED_SEGMENTS.has(segment)) {
    notFound()
  }

  const agentId = await resolveStoreSegmentToAgentId(segment)
  if (!agentId) {
    notFound()
  }

  const storefront = await getPublicStorefrontResponse(agentId)
  if (storefront.unavailable) {
    notFound()
  }

  return (
    <StorefrontWholesaleCartClient
      agentId={agentId}
      storeSegment={segment}
      initialProfile={storefront.profile}
    />
  )
}
