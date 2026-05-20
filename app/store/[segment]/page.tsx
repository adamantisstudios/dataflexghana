import { notFound } from "next/navigation"
import { Suspense } from "react"
import { resolveStoreSegmentToAgentId } from "@/lib/storefront-server"
import { getPublicStorefrontResponse } from "@/lib/storefront-public"
import PublicAgentStorefront from "@/app/public-agent-sandbox/[agentId]/storefront-client"

/** Static routes under /store — must not be treated as slugs */
const RESERVED_SEGMENTS = new Set(["not-available", "payment-failed", "invalid-agent"])

type PageProps = {
  params: Promise<{ segment: string }>
}

function StoreUnavailableMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">This store is not available yet</h1>
        <p className="text-slate-600">
          The owner may still be setting up their storefront, or this link is no longer active.
          Please check back later or contact the agent directly.
        </p>
      </div>
    </div>
  )
}

export default async function StorePage({ params }: PageProps) {
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
    return <StoreUnavailableMessage />
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
          Loading store…
        </div>
      }
    >
      <PublicAgentStorefront
        agentId={agentId}
        storeSegment={segment}
        initialProfile={storefront.profile}
        initialBundles={storefront.bundles}
        initialServices={storefront.services}
        initialWholesaleProducts={storefront.wholesaleProducts}
        initialComplianceForms={storefront.complianceForms}
      />
    </Suspense>
  )
}
