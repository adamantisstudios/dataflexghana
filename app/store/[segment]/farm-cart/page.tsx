import { notFound } from "next/navigation"
import { resolveStoreSegmentToAgentId } from "@/lib/storefront-server"
import { FarmersFriendCart } from "@/components/farmers/FarmersFriendCart"

type PageProps = { params: Promise<{ segment: string }> }

export default async function StoreFarmCartPage({ params }: PageProps) {
  const { segment } = await params
  const agentId = await resolveStoreSegmentToAgentId(segment)
  if (!agentId) notFound()

  return (
    <FarmersFriendCart
      agentId={agentId}
      storeSegment={segment}
      backHref={`/store/${encodeURIComponent(segment)}`}
    />
  )
}
