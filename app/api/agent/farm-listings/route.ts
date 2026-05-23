import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { mapFarmListingRow } from "@/lib/farm-server"
import { computeRetailPrice } from "@/lib/farm-types"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId") || user.id
    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("farm_listings")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const listings = (data || []).map((r) => mapFarmListingRow(r as Record<string, unknown>))

    const ids = listings.map((l) => l.id)
    let counts: Record<string, number> = {}
    if (ids.length > 0) {
      const { data: orders } = await db.from("farm_orders").select("listing_id").in("listing_id", ids)
      for (const o of orders || []) {
        const lid = String(o.listing_id)
        counts[lid] = (counts[lid] || 0) + 1
      }
    }

    return NextResponse.json({
      success: true,
      listings: listings.map((l) => ({ ...l, order_count: counts[l.id] || 0 })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load listings" },
      { status: 500 },
    )
  }
})

export const POST = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const agentId = body.agentId || user.id
    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const produce_name = String(body.produce_name ?? "").trim()
    const farmer_name = String(body.farmer_name ?? "").trim()
    const farmer_phone = String(body.farmer_phone ?? "").trim()
    const negotiated_price = Number(body.negotiated_price)
    const quantity_available = Number(body.quantity_available)

    if (!produce_name || !farmer_name || !farmer_phone) {
      return NextResponse.json({ error: "Produce, farmer name, and phone are required" }, { status: 400 })
    }
    if (!Number.isFinite(negotiated_price) || negotiated_price <= 0) {
      return NextResponse.json({ error: "Valid negotiated price is required" }, { status: 400 })
    }
    if (!Number.isFinite(quantity_available) || quantity_available <= 0) {
      return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 })
    }

    const photos = Array.isArray(body.photos) ? body.photos.slice(0, 5).map(String) : []

    const row = {
      agent_id: agentId,
      farmer_name,
      farmer_phone,
      farmer_location: body.farmer_location ? String(body.farmer_location).trim() : null,
      produce_name,
      quantity_available,
      unit: String(body.unit || "kg").trim(),
      negotiated_price,
      admin_markup: 0,
      retail_price: computeRetailPrice(negotiated_price, 0),
      photos,
      harvest_date: body.harvest_date || null,
      notes: body.notes ? String(body.notes).trim() : null,
      is_published: false,
      is_fulfilled: false,
    }

    const db = getAdminClient()
    const { data, error } = await db.from("farm_listings").insert(row).select("*").single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, listing: mapFarmListingRow(data as Record<string, unknown>) })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create listing" },
      { status: 500 },
    )
  }
})
