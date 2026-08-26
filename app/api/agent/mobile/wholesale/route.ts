import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { AGENT_MOMO } from "@/lib/agent-mobile"
import { WHOLESALE_CATEGORIES } from "@/lib/wholesale"

export const dynamic = "force-dynamic"

function parseVariants(raw: unknown): Array<{ type: string; values: string[] }> {
  if (!raw) return []
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? (raw as Array<{ type: string; values: string[] }>) : []
}

function mapProduct(p: Record<string, unknown>) {
  const images = Array.isArray(p.image_urls) ? (p.image_urls as string[]) : []
  return {
    ...p,
    price: Number(p.price ?? 0),
    quantity: Number(p.quantity ?? 0),
    commission_value: Number(p.commission_value ?? 0),
    image_urls: images,
    variants: parseVariants(p.variants),
  }
}

/** GET: catalog | my-products | orders depending on `view` query */
export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as {
    id: string
    isapproved?: boolean
    can_publish_products?: boolean
    can_update_products?: boolean
    phone_number?: string
    wallet_balance?: number
  }
  const db = getAdminClient()
  const view = request.nextUrl.searchParams.get("view") || "catalog"
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10))
  const limit = Math.min(24, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "12", 10)))
  const search = (request.nextUrl.searchParams.get("search") || "").trim()
  const category = (request.nextUrl.searchParams.get("category") || "").trim()
  const priceBand = (request.nextUrl.searchParams.get("price") || "all").trim()
  const status = (request.nextUrl.searchParams.get("status") || "").trim()
  const offset = (page - 1) * limit

  if (view === "meta") {
    return NextResponse.json({
      success: true,
      categories: WHOLESALE_CATEGORIES,
      momo: AGENT_MOMO,
      permissions: {
        can_publish_products: agent.isapproved === true && agent.can_publish_products === true,
        can_update_products: agent.can_update_products === true,
        isapproved: agent.isapproved === true,
        can_publish_products_flag: agent.can_publish_products === true,
      },
      agent: {
        id: agent.id,
        phone_number: agent.phone_number,
        wallet_balance: Number(agent.wallet_balance ?? 0),
      },
    })
  }

  if (view === "orders") {
    const { data, error } = await db
      .from("wholesale_orders")
      .select(
        "*, wholesale_products(id, name, price, image_urls, category, delivery_time, commission_value)",
      )
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, orders: data || [] })
  }

  if (view === "my-products") {
    let query = db
      .from("wholesale_products")
      .select("*", { count: "exact" })
      .eq("submitted_by_agent_id", agent.id)
      .order("created_at", { ascending: false })

    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    if (category && category !== "All") query = query.eq("category", category)
    if (status === "published") query = query.eq("is_active", true)
    if (status === "unpublished" || status === "pending") query = query.eq("is_active", false)

    const { data, error, count } = await query.range(offset, offset + limit - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      products: (data || []).map((p) => mapProduct(p as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      },
      permissions: {
        can_publish_products: agent.isapproved === true && agent.can_publish_products === true,
        can_update_products: agent.can_update_products === true,
      },
      categories: WHOLESALE_CATEGORIES,
    })
  }

  // catalog
  let query = db
    .from("wholesale_products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .gt("quantity", 0)
    .order("created_at", { ascending: false })

  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  if (category && category !== "All") query = query.eq("category", category)

  if (priceBand === "under50") query = query.lt("price", 50)
  else if (priceBand === "50-200") query = query.gte("price", 50).lte("price", 200)
  else if (priceBand === "200-500") query = query.gte("price", 200).lte("price", 500)
  else if (priceBand === "over500") query = query.gt("price", 500)

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // refresh wallet for checkout UX
  const { data: agentRow } = await db
    .from("agents")
    .select("wallet_balance, phone_number")
    .eq("id", agent.id)
    .maybeSingle()

  return NextResponse.json({
    success: true,
    products: (data || []).map((p) => mapProduct(p as Record<string, unknown>)),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    },
    categories: WHOLESALE_CATEGORIES,
    momo: AGENT_MOMO,
    agent: {
      id: agent.id,
      phone_number: agentRow?.phone_number ?? agent.phone_number,
      wallet_balance: Number(agentRow?.wallet_balance ?? agent.wallet_balance ?? 0),
    },
  })
}

/** PUT: update own product (sets is_active=false for re-approval) */
export async function PUT(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string; can_update_products?: boolean }
  if (agent.can_update_products !== true) {
    return NextResponse.json({ error: "You do not have permission to update products" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const productId = String(body.product_id ?? "").trim()
  if (!productId) return NextResponse.json({ error: "product_id is required" }, { status: 400 })

  const db = getAdminClient()
  const { data: existing } = await db
    .from("wholesale_products")
    .select("id, submitted_by_agent_id")
    .eq("id", productId)
    .maybeSingle()

  if (!existing || existing.submitted_by_agent_id !== agent.id) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const update: Record<string, unknown> = {
    is_active: false,
    updated_at: new Date().toISOString(),
  }
  if (body.name != null) update.name = String(body.name).trim()
  if (body.description != null) update.description = String(body.description).trim()
  if (body.category != null) update.category = String(body.category).trim()
  if (body.price != null) update.price = Number(body.price)
  if (body.commission_value != null) update.commission_value = Number(body.commission_value)
  if (body.quantity != null) update.quantity = parseInt(String(body.quantity), 10)
  if (body.delivery_time != null) update.delivery_time = String(body.delivery_time).trim()
  if (Array.isArray(body.image_urls)) update.image_urls = body.image_urls
  if (Array.isArray(body.variants)) update.variants = body.variants

  const { data, error } = await db
    .from("wholesale_products")
    .update(update)
    .eq("id", productId)
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, product: mapProduct(data as Record<string, unknown>) })
}

/** DELETE: remove own product */
export async function DELETE(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const productId = request.nextUrl.searchParams.get("id")?.trim()
  if (!productId) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const db = getAdminClient()
  const { data: existing } = await db
    .from("wholesale_products")
    .select("id, submitted_by_agent_id")
    .eq("id", productId)
    .maybeSingle()

  if (!existing || existing.submitted_by_agent_id !== agent.id) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const { error } = await db.from("wholesale_products").delete().eq("id", productId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
