import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    }

    console.log("🛒 Fetching voucher products for agent...")
    console.log("🌍 Environment:", process.env.NODE_ENV)
    console.log("🔗 Request URL:", request.url)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("✅ Using service role for reliable data access")

    const { count, error: countError } = await supabaseAdmin
      .from("e_products")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("❌ Error checking e_products table:", countError)

      if (countError.code === "42P01" || countError.message?.includes("does not exist")) {
        console.log("⚠️ e_products table does not exist")
        return NextResponse.json(
          {
            success: true,
            products: [],
            total: 0,
            debug: {
              message: "e_products table does not exist - run the table creation script",
              tableExists: false,
            },
          },
          { headers },
        )
      }

      return NextResponse.json(
        { error: "Database error while checking products", details: countError.message },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        },
      )
    }

    console.log(`📊 Found ${count} total products in e_products table`)

    let query = supabaseAdmin
      .from("e_products")
      .select("*")
      .eq("status", "published")
      .gt("quantity", 0) // Only show items with stock
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
          error: "Failed to fetch products",
          products: [], // Always provide empty array for graceful fallback
          total: 0,
          details: error instanceof Error ? error.message : "Unknown error",
          debug: {
            errorCode: error.code,
            hint: error.hint,
            message: error.message,
          },
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

    console.log("✅ Products fetched successfully:", {
      count: (data || []).length,
      products: data?.map((p) => ({ id: p.id, title: p.title, status: p.status, quantity: p.quantity })),
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
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
          totalInTable: count,
          publishedProducts: (data || []).length,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development",
          vercelEnv: process.env.VERCEL_ENV || "development",
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
      { headers },
    )
  } catch (error) {
    console.error("❌ API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        products: [], // Always provide empty array for graceful fallback
        total: 0,
        details: error instanceof Error ? error.message : "Unknown error",
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
