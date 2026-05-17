import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

function formatProduct(p: Record<string, unknown>) {
  let timelineDays = (p.estimated_timeline_days as number) || 0
  if (!timelineDays && p.completion_time) {
    const match = String(p.completion_time).match(/\d+/)
    timelineDays = match ? parseInt(match[0], 10) : 0
  }

  const categories = p.fashion_categories as { name?: string } | null

  return {
    id: p.id,
    product_name: p.title,
    product_code: p.product_code || `PROD-${p.id}`,
    description: p.description,
    category_id: p.category_id,
    category_name: categories?.name || "Unknown",
    base_price: parseFloat(String(p.base_price)),
    fabric_cost_included: p.include_fabric_cost,
    completion_time: `${timelineDays} days`,
    estimated_timeline_days: timelineDays,
    express_charge: parseFloat(String(p.express_sewing_charge || p.express_charge || 0)),
    commission_amount: parseFloat(String(p.commission_amount || 0)),
    image_urls: (p.image_urls as string[]) || [],
    image_paths: (p.image_paths as string[]) || [],
    status: p.status,
    created_at: p.created_at,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)

    const supabase = getAdminClient()

    if (id) {
      const productId = parseInt(id, 10)
      if (Number.isNaN(productId)) {
        return NextResponse.json({ success: false, error: "Invalid product ID" }, { status: 400 })
      }

      const { data: product, error } = await supabase
        .from("fashion_products")
        .select(`*, fashion_categories(name)`)
        .eq("id", productId)
        .eq("status", "active")
        .single()

      if (error || !product) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: formatProduct(product) })
    }

    let query = supabase
      .from("fashion_products")
      .select(`*, fashion_categories(name)`, { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq("category_id", parseInt(category, 10))
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: products, count, error } = await query

    if (error) {
      throw error
    }

    const formatted = (products || []).map((p) => formatProduct(p))

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: unknown) {
    console.error("Error fetching products:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch products"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
