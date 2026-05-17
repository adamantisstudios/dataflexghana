import { type NextRequest, NextResponse } from "next/server"
import { resolveStoreSegmentToAgentId } from "@/lib/storefront-server"
import { isUuid } from "@/lib/storefront-utils"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug")?.trim()
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 })
    }

    if (isUuid(slug)) {
      const agentId = await resolveStoreSegmentToAgentId(slug)
      if (!agentId) {
        return NextResponse.json({ agentId: null, found: false })
      }
      return NextResponse.json({ agentId, found: true, resolvedBy: "uuid" })
    }

    const agentId = await resolveStoreSegmentToAgentId(slug)
    if (!agentId) {
      return NextResponse.json({ agentId: null, found: false })
    }

    return NextResponse.json({ agentId, found: true, resolvedBy: "slug" })
  } catch (error) {
    console.error("resolve-slug:", error)
    return NextResponse.json({ error: "Failed to resolve slug" }, { status: 500 })
  }
}
