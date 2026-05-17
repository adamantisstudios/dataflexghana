import { type NextRequest, NextResponse } from "next/server"
import { resolveStoreSegmentToAgentId } from "@/lib/storefront-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug")?.trim()
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 })
    }

    const agentId = await resolveStoreSegmentToAgentId(slug)
    if (!agentId) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    return NextResponse.json({ agentId })
  } catch (error) {
    console.error("resolve-slug:", error)
    return NextResponse.json({ error: "Failed to resolve slug" }, { status: 500 })
  }
}
