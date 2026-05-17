import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { checkStoreSlugAvailable } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  const slug = request.nextUrl.searchParams.get("slug") || ""
  const agentId = request.nextUrl.searchParams.get("agentId") || user.id

  if (user.role === "agent" && agentId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const result = await checkStoreSlugAvailable(slug, agentId)
  return NextResponse.json(result)
})
