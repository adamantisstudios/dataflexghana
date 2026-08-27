import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { FASHION_ASSET_BASE, formatFashionProduct } from "@/lib/fashion-catalog"
import { getAdminClient } from "@/lib/supabase-base"
import { sanitizeSearchTerm } from "@/lib/postgrest-search"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const search = sanitizeSearchTerm(searchParams.get("search"))
    const category = searchParams.get("category") || ""
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)

    const db = getAdminClient()

    if (id) {
      const productId = parseInt(id, 10)
      if (Number.isNaN(productId)) {
        return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
      }

      const { data: product, error } = await db
        .from("fashion_products")
        .select(`*, fashion_categories(name)`)
        .eq("id", productId)
        .eq("status", "active")
        .single()

      if (error || !product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        product: formatFashionProduct(product as Record<string, unknown>),
        asset_base_url: FASHION_ASSET_BASE,
      })
    }

    let query = db
      .from("fashion_products")
      .select(`*, fashion_categories(name)`, { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,product_code.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq("category_id", parseInt(category, 10))
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: products, count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      products: (products || []).map((p) => formatFashionProduct(p as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      asset_base_url: FASHION_ASSET_BASE,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
