import { type NextRequest, NextResponse } from "next/server"
import { listPublishedFarmListings } from "@/lib/farm-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || undefined
    const location = request.nextUrl.searchParams.get("location") || undefined
    const agentId = request.nextUrl.searchParams.get("agentId") || undefined

    const listings = await listPublishedFarmListings({ search, location, agentId })

    return NextResponse.json({ success: true, listings })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load listings" },
      { status: 500 },
    )
  }
}
