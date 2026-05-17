import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import { providerDbValues, type BundleNetwork } from "@/lib/storefront-utils"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl
    const provider = searchParams.get("provider") as BundleNetwork | null
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))

    if (!provider) {
      return NextResponse.json({ error: "provider is required (MTN, Telecel, AirtelTigo)" }, { status: 400 })
    }

    const db = getAdminClient()
    const values = providerDbValues(provider)
    const offset = (page - 1) * limit

    let query = db
      .from("data_bundles")
      .select("id, name, provider, size_gb, price, validity_months, image_url, is_active", { count: "exact" })
      .eq("is_active", true)
      .in("provider", values)
      .order("size_gb", { ascending: true })

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bundles: data || [],
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    })
  } catch (error) {
    console.error("store-bundles GET:", error)
    return NextResponse.json({ error: "Failed to load bundles" }, { status: 500 })
  }
})
