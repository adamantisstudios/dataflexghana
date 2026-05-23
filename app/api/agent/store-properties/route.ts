import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAgentPropertyCatalog, isAgentStorefrontSuspended } from "@/lib/property-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  const agentId = request.nextUrl.searchParams.get("agentId") || user.id
  if (user.role === "agent" && agentId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  if (await isAgentStorefrontSuspended(agentId)) {
    return NextResponse.json({
      own: [],
      platform: [],
      suspended: true,
    })
  }

  try {
    const catalog = await getAgentPropertyCatalog(agentId)
    return NextResponse.json({ ...catalog, suspended: false })
  } catch (err) {
    console.error("store-properties:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load properties" },
      { status: 500 },
    )
  }
})
