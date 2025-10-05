import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing required Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request) {
  try {
    const agentData = { id: "sample-agent-id" } // Sample agent data for demonstration purposes

    console.log("🛒 Fallback route: Fetching voucher products...")

    // First check if table exists
    const { count, error: countError } = await supabase.from("e_products").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("❌ Error checking e_products table:", countError)

      if (countError.code === "42P01" || countError.message?.includes("does not exist")) {
        console.log("⚠️ e_products table does not exist, returning empty array")

        return NextResponse.json({
          success: true,
          products: [],
          total: 0,
          debug: {
            agentId: agentData.id,
            fallback: true,
            message: "No products available - e_products table not found",
          },
        })
      }

      return NextResponse.json(
        { error: "Database error while checking products", details: countError.message },
        { status: 500 },
      )
    }

    console.log(`📊 Found ${count} total products in e_products table`)

    // Try to fetch published products using service role client
    const { data, error } = await supabase
      .from("e_products")
      .select("*")
      .eq("status", "published")
      .gt("quantity", 0) // Only show items with stock
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products", details: error.message }, { status: 500 })
    }

    // Process and return the fetched products
    const products = data || []
    const total = products.length

    console.log("✅ Fallback route: Products fetched successfully:", {
      count: products.length,
      total,
    })

    return NextResponse.json({
      success: true,
      products,
      total,
      debug: {
        agentId: agentData.id,
        fallback: true,
        message: "Products fetched successfully via fallback route",
      },
    })
  } catch (error) {
    console.error("❌ Fallback route error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        products: [],
        total: 0,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
