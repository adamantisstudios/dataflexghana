import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { mapFarmListingRow } from "@/lib/farm-server"

export const dynamic = "force-dynamic"

function listingIdFromPath(request: NextRequest): string {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean)
  return parts[parts.length - 1] || ""
}

export const PATCH = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const id = listingIdFromPath(request)
    const body = await request.json()
    const db = getAdminClient()

    const { data: existing, error: fetchErr } = await db
      .from("farm_listings")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }
    if (user.role === "agent" && existing.agent_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    const agentEditable = [
      "produce_name",
      "farmer_name",
      "farmer_phone",
      "farmer_location",
      "quantity_available",
      "unit",
      "negotiated_price",
      "photos",
      "harvest_date",
      "notes",
    ] as const

    for (const key of agentEditable) {
      if (body[key] !== undefined) {
        if (key === "photos" && Array.isArray(body.photos)) {
          updates.photos = body.photos.slice(0, 5).map(String)
        } else {
          updates[key] = body[key]
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    if (existing.is_published) {
      return NextResponse.json(
        { error: "Published listings cannot be edited. Contact admin to unpublish first." },
        { status: 400 },
      )
    }

    const { data, error } = await db.from("farm_listings").update(updates).eq("id", id).select("*").single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, listing: mapFarmListingRow(data as Record<string, unknown>) })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    )
  }
})

export const DELETE = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const id = listingIdFromPath(request)
    const db = getAdminClient()

    const { data: existing } = await db.from("farm_listings").select("agent_id, is_published").eq("id", id).maybeSingle()

    if (!existing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    if (user.role === "agent" && existing.agent_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    if (existing.is_published) {
      return NextResponse.json({ error: "Unpublish listing before deleting" }, { status: 400 })
    }

    const { error } = await db.from("farm_listings").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    )
  }
})
