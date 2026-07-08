import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { getPhotoVerificationStatus } from "@/lib/photo-verification-status"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)))
    const filter = searchParams.get("filter") || "pending"
    const search = (searchParams.get("search") || "").trim()
    const offset = (page - 1) * limit
    const db = getAdminClient()

    const { data, error } = await db
      .from("agents")
      .select(
        "id, full_name, phone_number, email, profile_image_url, profile_verified, profession, exact_location, isapproved, created_at",
      )
      .not("profile_image_url", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const agents = (data || []).filter((a) => String(a.profile_image_url ?? "").trim())

    const verified_count = agents.filter((a) => getPhotoVerificationStatus(a) === "verified").length
    const pending_count = agents.filter((a) => getPhotoVerificationStatus(a) === "pending").length
    const unverified_count = agents.filter((a) => getPhotoVerificationStatus(a) === "unverified").length
    const q = search.toLowerCase()
    const filteredAgents = agents
      .filter((agent) => {
        const status = getPhotoVerificationStatus(agent)
        if (filter !== "all" && status !== filter) return false
        if (!q) return true
        return [agent.full_name, agent.email, agent.phone_number]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => {
        const weight = (agent: (typeof agents)[number]) => {
          const status = getPhotoVerificationStatus(agent)
          if (status === "pending") return 0
          if (status === "unverified") return 1
          return 2
        }
        return weight(a) - weight(b)
      })

    const total = filteredAgents.length
    const pagedAgents = filteredAgents.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      agents: pagedAgents,
      total: agents.length,
      filtered_total: total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
      verified_count,
      pending_count,
      unverified_count,
    })
  } catch (e) {
    console.error("[admin/photo-verification GET]", e)
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 })
  }
}
