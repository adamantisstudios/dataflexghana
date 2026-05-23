import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { listActiveAdPackages, toPublicAdPackage } from "@/lib/advertising-server"
import { getStoreSettings } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId") || user.id
    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const packages = await listActiveAdPackages()
    const settings = await getStoreSettings(agentId)
    const visibleIds = new Set(
      settings
        .filter((s) => s.item_type === "ad_package" && s.is_visible)
        .map((s) => s.item_id),
    )

    return NextResponse.json({
      success: true,
      packages: packages.map((p) => ({
        ...toPublicAdPackage(p),
        is_on_storefront: visibleIds.has(p.id),
      })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load packages" },
      { status: 500 },
    )
  }
})
