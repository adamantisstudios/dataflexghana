import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { mapFarmListingRow } from "@/lib/farm-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const status = request.nextUrl.searchParams.get("status")
    const db = getAdminClient()

    let query = db
      .from("farm_listings")
      .select("*, agents(full_name, phone_number)")
      .order("created_at", { ascending: false })

    if (status === "pending") {
      query = query.eq("is_published", false)
    } else if (status === "published") {
      query = query.eq("is_published", true)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    const listings = (data || []).map((row) => {
      const listing = mapFarmListingRow(row as Record<string, unknown>)
      const agent = row.agents as { full_name?: string; phone_number?: string } | null
      return {
        ...listing,
        agent_name: agent?.full_name ?? null,
        agent_phone: agent?.phone_number ?? null,
      }
    })

    return NextResponse.json({ success: true, data: listings })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load listings" },
      { status: 500 },
    )
  }
}
