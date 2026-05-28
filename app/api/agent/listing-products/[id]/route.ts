import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const sessionAgentId = getAuthAgentId(auth)
  if (!sessionAgentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.title != null) updates.title = String(body.title).trim()
    if (body.description !== undefined) {
      updates.description = body.description ? String(body.description).trim() : null
    }
    if (body.price != null) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 })
      }
      updates.price = price
    }
    if (body.category !== undefined) {
      updates.category = body.category ? String(body.category).trim() : null
    }
    if (body.listing_type !== undefined) {
      const listingType = String(body.listing_type).trim().toLowerCase()
      if (listingType !== "product" && listingType !== "service") {
        return NextResponse.json({ error: "listing_type must be product or service" }, { status: 400 })
      }
      updates.listing_type = listingType
    }
    if (body.momo_number != null) updates.momo_number = String(body.momo_number).trim()
    if (body.momo_name != null) updates.momo_name = String(body.momo_name).trim()
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)
    if (Array.isArray(body.images)) {
      updates.images = body.images.map(String).filter(Boolean).slice(0, 2)
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("agent_products")
      .update(updates)
      .eq("id", id)
      .eq("agent_id", sessionAgentId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, product: data })
  } catch (e) {
    console.error("[listing-products PATCH]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const sessionAgentId = getAuthAgentId(auth)
  if (!sessionAgentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const db = getAdminClient()
  const { error } = await db.from("agent_products").delete().eq("id", id).eq("agent_id", sessionAgentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
