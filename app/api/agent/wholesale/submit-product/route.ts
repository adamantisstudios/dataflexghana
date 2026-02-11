import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Create Supabase admin client using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const body = await request.json()
    const {
      name,
      description,
      category,
      price,
      commission_value,
      quantity,
      delivery_time,
      image_urls,
      agent_id,
    } = body

    console.log("[v0] Submitting product for agent:", agent_id)

    // Validate required fields
    if (!name || !category || !price || !quantity || !agent_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    // Get the default admin user ID from auth.users
    const { data: adminUser, error: adminError } = await supabase.auth.admin.listUsers()
    
    if (adminError || !adminUser?.users || adminUser.users.length === 0) {
      console.error("[v0] Error fetching admin user:", adminError)
      return NextResponse.json(
        { error: "System configuration error. Please contact support." },
        { status: 500 },
      )
    }

    // Use the first admin user's ID (typically the main admin)
    const adminUserId = adminUser.users[0].id

    // Insert product with is_active = false (unpublished) and created_by as admin
    const { data, error } = await supabase
      .from("wholesale_products")
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || "",
          category,
          price: parseFloat(price),
          commission_value: parseFloat(commission_value) || 0,
          quantity: parseInt(quantity),
          delivery_time: delivery_time || "3-5 business days",
          image_urls: image_urls || [],
          is_active: false,
          created_by: adminUserId,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Database error inserting product:", error)

      // Handle foreign key constraint errors
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Invalid agent reference. Please contact admin support." },
          { status: 400 },
        )
      }

      // Handle other constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A product with this name already exists" },
          { status: 409 },
        )
      }

      return NextResponse.json(
        { error: error.message || "Failed to submit product" },
        { status: 500 },
      )
    }

    console.log("[v0] Product submitted successfully:", data?.[0]?.id)

    return NextResponse.json(
      {
        success: true,
        message: "Product submitted successfully! Admin will review and publish it.",
        data: data?.[0],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error in submit-product route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
