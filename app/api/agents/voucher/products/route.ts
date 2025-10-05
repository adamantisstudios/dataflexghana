import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    }

    console.log("🛒 [FALLBACK] Fetching voucher products via agents endpoint...")

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // First check if table exists and has data
    const { count, error: countError } = await supabaseAdmin
      .from("e_products")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("❌ Error checking e_products table:", countError)

      if (countError.code === "42P01" || countError.message?.includes("does not exist")) {
        console.log("⚠️ e_products table does not exist, returning empty array")
        return NextResponse.json(
          {
            success: false,
            products: [],
            total: 0,
            error: "e_products table does not exist",
          },
          { headers },
        )
      }

      return NextResponse.json(
        {
          success: false,
          products: [],
          total: 0,
          error: "Database error while checking products",
          details: countError.message,
        },
        { status: 500, headers },
      )
    }

    console.log(`📊 Found ${count} total products in e_products table`)

    let query = supabaseAdmin
      .from("e_products")
      .select("*")
      .eq("status", "published") // Strict published status filter
      .gt("quantity", 0) // Ensure items have stock
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("❌ Error fetching products:", error)
      return NextResponse.json(
        {
          success: false,
          products: [],
          total: 0,
          error: "Failed to fetch products",
          details: error.message,
        },
        { headers },
      )
    }

    console.log("✅ Products fetched successfully:", {
      count: (data || []).length,
      products: data?.map((p) => ({ id: p.id, title: p.title, status: p.status, quantity: p.quantity })),
    })

    return NextResponse.json(
      {
        success: true,
        products: data || [],
        total: count || 0,
        pagination: {
          limit,
          offset,
          hasMore: (data || []).length === limit,
        },
        debug: {
          endpoint: "fallback",
          timestamp: new Date().toISOString(),
        },
      },
      { headers },
    )
  } catch (error) {
    console.error("❌ API error:", error)
    return NextResponse.json(
      {
        success: false,
        products: [],
        total: 0,
        error: "Internal server error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
