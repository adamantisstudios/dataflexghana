import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { listActiveWritingServices, toPublicWritingService } from "@/lib/writing-server"
import { getStoreSettings } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId") || user.id
    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const services = await listActiveWritingServices()
    const settings = await getStoreSettings(agentId)
    const visibleIds = new Set(
      settings
        .filter((s) => s.item_type === "writing_service" && s.is_visible)
        .map((s) => s.item_id),
    )

    return NextResponse.json({
      success: true,
      services: services.map((s) => ({
        ...toPublicWritingService(s),
        is_on_storefront: visibleIds.has(s.id),
      })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load writing services" },
      { status: 500 },
    )
  }
})
