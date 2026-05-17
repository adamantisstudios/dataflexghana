import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl
    const search = (searchParams.get("search") || "").trim()
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)))
    const offset = (page - 1) * limit

    const db = getAdminClient()
    let query = db
      .from("services")
      .select("id, title, description, commission_amount, product_cost, image_url, image_urls, service_type", {
        count: "exact",
      })
      .eq("service_type", "referral")
      .order("title", { ascending: true })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const services = (data || []).map((s) => {
      const images = (s.image_urls as string[] | null) || []
      return {
        ...s,
        image_url: (s.image_url as string | null) || images[0] || null,
        cost: Number(s.product_cost ?? s.commission_amount ?? 0),
      }
    })

    return NextResponse.json({
      success: true,
      services,
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    })
  } catch (error) {
    console.error("store-services GET:", error)
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 })
  }
})
