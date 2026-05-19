import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getStorefrontPageMetadata, resolveStoreSegmentToAgentId } from "@/lib/storefront-server"
import { getStorefrontPublicBase } from "@/lib/storefront-utils"
import PublicAgentStorefront from "@/app/public-agent-sandbox/[agentId]/storefront-client"

const STOREFRONT_ORIGIN = "https://referralpowerhouse.vercel.app"
const OG_IMAGE_PATH = "/whatsapp-channel.jpg"

/** Static routes under /store — must not be treated as slugs */
const RESERVED_SEGMENTS = new Set(["not-available", "payment-failed", "invalid-agent"])

type PageProps = {
  params: Promise<{ segment: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segment } = await params
  if (RESERVED_SEGMENTS.has(segment)) {
    return { title: "Store" }
  }

  const agentId = await resolveStoreSegmentToAgentId(segment)
  if (!agentId) {
    return { title: "Store Not Available" }
  }

  const meta = await getStorefrontPageMetadata(agentId)
  const title = meta?.storeName || "Agent Store"
  const description =
    meta?.businessInfo?.trim().slice(0, 200) ||
    `Shop data bundles and referral services at ${title}.`
  const imageUrl = `${STOREFRONT_ORIGIN}${OG_IMAGE_PATH}`
  const storeBase = getStorefrontPublicBase()
  const url = meta?.storeSlug
    ? `${storeBase}/${meta.storeSlug}`
    : `${storeBase}/${segment}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Referral Powerhouse",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      locale: "en_GH",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function StoreBySlugPage({ params }: PageProps) {
  const { segment } = await params

  if (RESERVED_SEGMENTS.has(segment)) {
    redirect("/store/not-available")
  }

  const agentId = await resolveStoreSegmentToAgentId(segment)

  if (!agentId) {
    redirect("/store/not-available")
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
          Loading store…
        </div>
      }
    >
      <PublicAgentStorefront agentId={agentId} storeSegment={segment} />
    </Suspense>
  )
}
