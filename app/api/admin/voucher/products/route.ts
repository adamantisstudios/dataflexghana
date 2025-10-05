import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    let adminUser

    // First try cookie authentication
    const adminCookie = request.cookies.get("admin_user")
    if (adminCookie) {
      try {
        adminUser = JSON.parse(adminCookie.value)
      } catch (parseError) {
        // Continue to header check
      }
    }

    // If no cookie auth, try header authentication
    if (!adminUser) {
      const authHeader = request.headers.get("X-Admin-Auth")
      if (authHeader) {
        try {
          adminUser = JSON.parse(authHeader)
        } catch (parseError) {
          return NextResponse.json({ error: "Invalid admin authentication format" }, { status: 401 })
        }
      }
    }

    // If no authentication found
    if (!adminUser || !adminUser.id) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Verify admin exists and is active
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("id, email, is_active")
      .eq("id", adminUser.id)
      .eq("is_active", true)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json({ error: "Admin not found or inactive" }, { status: 401 })
    }

    // First check if table exists and has data
    const { count, error: countError } = await supabaseAdmin
      .from("e_products")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error checking e_products table:", countError)

      // If table doesn't exist, return empty array
      if (countError.code === "42P01" || countError.message?.includes("does not exist")) {
        return NextResponse.json({
          success: true,
          products: [],
          total: 0,
          message: "e_products table does not exist",
        })
      }

      return NextResponse.json(
        { error: "Database error while checking products", details: countError.message },
        { status: 500 },
      )
    }

    const { data, error } = await supabaseAdmin.from("e_products").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products", details: error.message }, { status: 500 })
    }

    console.log("✅ Admin products fetched successfully:", {
      total: (data || []).length,
      published: data?.filter((p) => p.status === "published").length || 0,
      hidden: data?.filter((p) => p.status === "hidden").length || 0,
      outOfStock: data?.filter((p) => p.status === "out_of_stock").length || 0,
    })

    return NextResponse.json({
      success: true,
      products: data || [],
      total: (data || []).length,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    let adminUser

    // First try cookie authentication
    const adminCookie = request.cookies.get("admin_user")
    if (adminCookie) {
      try {
        adminUser = JSON.parse(adminCookie.value)
      } catch (parseError) {
        // Continue to header check
      }
    }

    // If no cookie auth, try header authentication
    if (!adminUser) {
      const authHeader = request.headers.get("X-Admin-Auth")
      if (authHeader) {
        try {
          adminUser = JSON.parse(authHeader)
        } catch (parseError) {
          return NextResponse.json({ error: "Invalid admin authentication format" }, { status: 401 })
        }
      }
    }

    // If no authentication found
    if (!adminUser || !adminUser.id) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Verify admin exists and is active
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("id, email, is_active")
      .eq("id", adminUser.id)
      .eq("is_active", true)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json({ error: "Admin not found or inactive" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, image_url, price, quantity, status } = body

    // Validate required fields
    if (!title || price === undefined || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields: title, price, quantity" }, { status: 400 })
    }

    // Validate data types
    const numPrice = Number.parseFloat(price)
    const numQuantity = Number.parseInt(quantity)

    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 })
    }

    if (isNaN(numQuantity) || numQuantity < 0) {
      return NextResponse.json({ error: "Quantity must be a non-negative integer" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("e_products")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        price: numPrice,
        quantity: numQuantity,
        status: status || "published",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return NextResponse.json({ error: "Failed to create product", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      product: data,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
