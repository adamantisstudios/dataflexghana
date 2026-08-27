import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { sanitizeSearchTerm } from "@/lib/postgrest-search"

export const dynamic = "force-dynamic"

const PROPERTY_CATEGORIES = [
  "Houses for Sale",
  "Houses for Rent",
  "Apartments / Flats",
  "Commercial Properties",
  "Land for Sale",
  "New Developments / Estates",
  "Short Stay / Airbnb-style Rentals",
  "Luxury Properties",
  "Industrial Properties",
  "Serviced / Shared Spaces",
]

function mapProperty(row: Record<string, unknown>) {
  const details = (row.details && typeof row.details === "object" ? row.details : {}) as Record<
    string,
    unknown
  >
  const images = Array.isArray(row.image_urls) ? (row.image_urls as string[]) : []
  return {
    ...row,
    price: Number(row.price ?? 0),
    commission: Number(row.commission ?? 0),
    currency: row.currency || "GHS",
    image_urls: images,
    bedrooms: Number(details.bedrooms ?? row.bedrooms ?? 0),
    bathrooms: Number(details.bathrooms ?? row.bathrooms ?? 0),
    square_feet: Number(details.size ?? details.square_feet ?? row.square_feet ?? 0),
    is_approved: row.is_approved === true,
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as {
    id: string
    isapproved?: boolean
    can_publish_properties?: boolean
    can_update_properties?: boolean
  }
  const db = getAdminClient()
  const search = sanitizeSearchTerm(request.nextUrl.searchParams.get("search"))
  const category = (request.nextUrl.searchParams.get("category") || "").trim()
  const status = (request.nextUrl.searchParams.get("status") || "").trim()

  let query = db
    .from("properties")
    .select("*")
    .eq("published_by_agent_id", agent.id)
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (category && category !== "All") query = query.eq("category", category)
  if (status === "approved") query = query.eq("is_approved", true)
  if (status === "pending") query = query.eq("is_approved", false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    properties: (data || []).map((p) => mapProperty(p as Record<string, unknown>)),
    categories: PROPERTY_CATEGORIES,
    permissions: {
      can_publish_properties: agent.can_publish_properties === true,
      can_update_properties: agent.can_update_properties === true,
      isapproved: agent.isapproved === true,
    },
  })
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string; can_update_properties?: boolean }
  if (agent.can_update_properties !== true) {
    return NextResponse.json({ error: "You do not have permission to update properties" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const propertyId = String(body.property_id ?? "").trim()
  if (!propertyId) return NextResponse.json({ error: "property_id is required" }, { status: 400 })

  const db = getAdminClient()
  const { data: existing } = await db
    .from("properties")
    .select("id, published_by_agent_id, details, image_urls")
    .eq("id", propertyId)
    .maybeSingle()

  if (!existing || existing.published_by_agent_id !== agent.id) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 })
  }

  const prevDetails =
    existing.details && typeof existing.details === "object"
      ? (existing.details as Record<string, unknown>)
      : {}

  const details = {
    bedrooms:
      body.bedrooms != null ? parseInt(String(body.bedrooms), 10) || 0 : Number(prevDetails.bedrooms ?? 0),
    bathrooms:
      body.bathrooms != null
        ? parseInt(String(body.bathrooms), 10) || 0
        : Number(prevDetails.bathrooms ?? 0),
    size:
      body.square_feet != null
        ? parseInt(String(body.square_feet), 10) || 0
        : Number(prevDetails.size ?? 0),
  }

  const update: Record<string, unknown> = {
    is_approved: false,
    details,
    updated_at: new Date().toISOString(),
  }
  if (body.title != null) update.title = String(body.title).trim()
  if (body.description != null) update.description = String(body.description).trim()
  if (body.category != null) update.category = String(body.category).trim()
  if (body.price != null) update.price = Number(body.price)
  if (body.currency != null) update.currency = String(body.currency).trim() || "GHS"
  if (body.location != null) update.location = String(body.location).trim()
  if (body.commission != null) update.commission = Number(body.commission)
  if (Array.isArray(body.image_urls)) update.image_urls = body.image_urls

  const { data, error } = await db
    .from("properties")
    .update(update)
    .eq("id", propertyId)
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, property: mapProperty(data as Record<string, unknown>) })
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const id = request.nextUrl.searchParams.get("id")?.trim()
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const db = getAdminClient()
  const { data: existing } = await db
    .from("properties")
    .select("id, published_by_agent_id, is_approved")
    .eq("id", id)
    .maybeSingle()

  if (!existing || existing.published_by_agent_id !== agent.id) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 })
  }

  // Mirror site: approved listings cannot be deleted by agent while approved
  if (existing.is_approved === true) {
    return NextResponse.json(
      { error: "Approved properties cannot be deleted. Contact admin if needed." },
      { status: 403 },
    )
  }

  const { error } = await db.from("properties").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
