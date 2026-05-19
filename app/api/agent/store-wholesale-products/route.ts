import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const search = (searchParams.get("search") || "").trim()
    const offset = (page - 1) * limit

    const db = getAdminClient()
    let query = db
      .from("wholesale_products")
      .select("id, name, description, price, image_urls, category, quantity, is_active", { count: "exact" })
      .eq("is_active", true)
      .gt("quantity", 0)
      .order("name", { ascending: true })

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const products = (data || []).map((p) => {
      const images = (p.image_urls as string[] | null) || []
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price ?? 0),
        category: p.category,
        quantity: p.quantity,
        image_url: images[0] || null,
      }
    })

    const total = count ?? 0
    return NextResponse.json({
      products,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error("store-wholesale-products:", error)
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 })
  }
})
