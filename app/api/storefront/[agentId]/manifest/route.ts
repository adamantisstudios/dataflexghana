import { NextResponse } from "next/server"
import { getStorefrontPageMetadata } from "@/lib/storefront-server"
import { STOREFRONT_PWA_ICON } from "@/lib/storefront-pwa-metadata"
import { isUuid } from "@/lib/storefront-utils"

type RouteContext = {
  params: Promise<{ agentId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { agentId: rawAgentId } = await context.params
  const agentId = rawAgentId?.trim()

  if (!agentId || !isUuid(agentId)) {
    return NextResponse.json({ error: "Invalid agent" }, { status: 404 })
  }

  const meta = await getStorefrontPageMetadata(agentId)
  if (!meta) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 })
  }

  const segment = meta.storeSlug || agentId
  const storePath = `/store/${encodeURIComponent(segment)}`
  const shortName =
    meta.storeName.length > 12 ? `${meta.storeName.slice(0, 12).trim()}…` : meta.storeName

  const manifest = {
    name: meta.storeName,
    short_name: shortName,
    description:
      meta.businessInfo?.trim().slice(0, 200) ||
      `Shop data bundles and more at ${meta.storeName}.`,
    start_url: storePath,
    scope: storePath,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#3B82F6",
    lang: "en-GH",
    icons: [
      {
        src: STOREFRONT_PWA_ICON,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: STOREFRONT_PWA_ICON,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  })
}
