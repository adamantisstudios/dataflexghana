import { type NextRequest, NextResponse } from "next/server"
import { getPublicInfluencerDetail, listPublicApprovedInfluencers } from "@/lib/influencer-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const profileId = request.nextUrl.searchParams.get("profileId")?.trim()
    if (profileId) {
      const detail = await getPublicInfluencerDetail(profileId)
      if (!detail) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, profile: detail })
    }

    const influencers = await listPublicApprovedInfluencers()
    return NextResponse.json({ success: true, influencers })
  } catch (e) {
    console.error("[public influencers]", e)
    return NextResponse.json({ error: "Failed to load influencers" }, { status: 500 })
  }
}
