import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getStorefrontPageMetadata } from "@/lib/storefront-server"
import { buildStorefrontPageMetadata } from "@/lib/storefront-pwa-metadata"
import { buildStorefrontPathUrl, getStorefrontOrigin } from "@/lib/storefront-utils"

type LayoutProps = {
  children: ReactNode
  params: Promise<{ agentId: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { agentId } = await params
  const meta = await getStorefrontPageMetadata(agentId)

  if (!meta) {
    return { title: "Store Not Available" }
  }

  const origin = getStorefrontOrigin()
  const url = buildStorefrontPathUrl(origin, meta.storeSlug || agentId)

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

export default function PublicAgentSandboxLayout({ children }: { children: ReactNode }) {
  return children
}
