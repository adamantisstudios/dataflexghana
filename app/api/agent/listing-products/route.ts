import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import {
  countAgentProducts,
  getAgentActiveSubscription,
  agentCanListProducts,
} from "@/lib/listing-packages-server"
import { getActiveAgentFeatures } from "@/lib/listing-package-utils"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user) => {
  const agentId = request.nextUrl.searchParams.get("agentId") || user.id
  if (user.role === "agent" && agentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = getAdminClient()
  const { data, error } = await db
    .from("agent_products")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const products = (data || []).map((p) => ({
    ...p,
    price: Number(p.price),
    images: Array.isArray(p.images) ? p.images : [],
    view_count: Number(p.view_count ?? 0),
    listing_type: p.listing_type === "service" ? "service" : "product",
  }))

  return NextResponse.json({ success: true, products })
})

export const POST = withUnifiedAuth(async (request: NextRequest, user) => {
  if (user.role !== "agent") {
    return NextResponse.json({ error: "Agents only" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const title = String(body.title ?? "").trim()
    const description = body.description ? String(body.description).trim() : null
    const price = Number(body.price)
    const category = body.category ? String(body.category).trim() : null
    const listing_type = String(body.listing_type ?? "product").trim().toLowerCase()
    const momo_number = String(body.momo_number ?? "").trim()
    const momo_name = String(body.momo_name ?? "").trim()
    const rawImages = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : []

    if (!title || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Title and valid price are required" }, { status: 400 })
    }
    if (!momo_number || !momo_name) {
      return NextResponse.json({ error: "MoMo number and account name are required" }, { status: 400 })
    }
    if (listing_type !== "product" && listing_type !== "service") {
      return NextResponse.json({ error: "listing_type must be product or service" }, { status: 400 })
    }
    if (rawImages.length === 0) {
      return NextResponse.json({ error: "At least one product image is required" }, { status: 400 })
    }

    const canList = await agentCanListProducts(user.id)
    if (!canList) {
      return NextResponse.json({ error: "Your listing section has been disabled by admin" }, { status: 403 })
    }

    const sub = await getAgentActiveSubscription(user.id)
    const features = getActiveAgentFeatures(sub)
    const maxImages = Math.max(1, Number(features.max_images) || 1)
    const images = rawImages.slice(0, maxImages)

    const used = await countAgentProducts(user.id, true)
    const maxListings = Math.max(0, Number(features.max_listings ?? sub?.package?.max_listings ?? 0))
    if (used >= maxListings) {
      return NextResponse.json(
        { error: `Maximum ${maxListings} active listings for your package` },
        { status: 400 },
      )
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("agent_products")
      .insert({
        agent_id: user.id,
        subscription_id: sub?.id ?? null,
        title,
        description,
        price,
        images,
        momo_number,
        momo_name,
        category,
        listing_type,
        is_active: true,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, product: data })
  } catch (e) {
    console.error("[listing-products POST]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
})
