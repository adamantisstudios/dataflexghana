import type { Metadata } from "next"
import { Suspense } from "react"
import { getStorefrontPageMetadata } from "@/lib/storefront-server"
import { STOREFRONT_PUBLIC_BASE } from "@/lib/storefront-utils"
import PublicAgentStorefront from "./storefront-client"

const STOREFRONT_ORIGIN = "https://referralpowerhouse.vercel.app"
const OG_IMAGE_PATH = "/whatsapp-channel.jpg"

type PageProps = {
  params: Promise<{ agentId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { agentId } = await params
  const meta = await getStorefrontPageMetadata(agentId)

  const title = meta?.storeName || "Agent Store"
  const description =
    meta?.businessInfo?.trim().slice(0, 200) ||
    `Shop data bundles and referral services at ${title}.`
  const imageUrl = `${STOREFRONT_ORIGIN}${OG_IMAGE_PATH}`
  const url = meta?.storeSlug
    ? `${STOREFRONT_PUBLIC_BASE}/${meta.storeSlug}`
    : `${STOREFRONT_PUBLIC_BASE}/${agentId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Referral Powerhouse",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
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

export default function PublicAgentStorefrontPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
          Loading store…
        </div>
      }
    >
      <PublicAgentStorefront />
    </Suspense>
  )
}
