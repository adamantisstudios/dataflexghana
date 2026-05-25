import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
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

    return NextResponse.json({
      success: true,
      agents,
      total: agents.length,
      verified_count: agents.filter((a) => a.profile_verified === true).length,
      unverified_count: agents.filter((a) => a.profile_verified !== true).length,
    })
  } catch (e) {
    console.error("[admin/photo-verification GET]", e)
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 })
  }
}
