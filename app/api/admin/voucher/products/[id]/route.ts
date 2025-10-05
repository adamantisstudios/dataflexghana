import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = params.id
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

    // CRITICAL FIX: Use service role client to bypass RLS for admin access
    const { createClient } = require("@supabase/supabase-js")
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Update the product
    const { data, error } = await serviceSupabase
      .from("e_products")
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        price: numPrice,
        quantity: numQuantity,
        status: status || "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return NextResponse.json({ error: "Failed to update product", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      product: data,
      message: "Product updated successfully",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = params.id

    // CRITICAL FIX: Use service role client to bypass RLS for admin access
    const { createClient } = require("@supabase/supabase-js")
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Check if product has any orders
    const { data: orders, error: ordersError } = await serviceSupabase
      .from("e_orders")
      .select("id")
      .eq("product_id", productId)
      .limit(1)

    if (ordersError) {
      console.error("Error checking orders:", ordersError)
      return NextResponse.json({ error: "Failed to check product orders" }, { status: 500 })
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete product with existing orders. Consider hiding it instead." },
        { status: 400 },
      )
    }

    // Delete the product
    const { error } = await serviceSupabase.from("e_products").delete().eq("id", productId)

    if (error) {
      console.error("Error deleting product:", error)
      return NextResponse.json({ error: "Failed to delete product", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = params.id

    // CRITICAL FIX: Use service role client to bypass RLS for admin access
    const { createClient } = require("@supabase/supabase-js")
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Get product details
    const { data, error } = await serviceSupabase.from("e_products").select("*").eq("id", productId).single()

    if (error) {
      console.error("Error fetching product:", error)
      return NextResponse.json({ error: "Failed to fetch product", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
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
