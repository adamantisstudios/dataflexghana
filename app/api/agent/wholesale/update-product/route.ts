import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product_id,
      agent_id,
      name,
      description,
      price,
      commission_value,
      quantity,
      images,
      category,
      variants,
    } = body

    if (!product_id || !agent_id) {
      return NextResponse.json(
        { error: "Product ID and Agent ID are required" },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    // First, verify the product exists and belongs to the agent
    const { data: product, error: fetchError } = await supabaseAdmin
      .from("wholesale_products")
      .select("*")
      .eq("id", product_id)
      .eq("submitted_by_agent_id", agent_id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: "Product not found or you do not have permission to edit it" },
        { status: 404 }
      )
    }

    // Verify agent has update permission
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("can_update_products")
      .eq("id", agent_id)
      .single()

    if (agentError || !agent?.can_update_products) {
      return NextResponse.json(
        { error: "You do not have permission to update products" },
        { status: 403 }
      )
    }

    // Build update object with only editable fields
    const updateData: Record<string, any> = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (commission_value !== undefined) updateData.commission_value = commission_value
    if (quantity !== undefined) updateData.quantity = quantity
    if (images !== undefined) updateData.images = images
    if (category !== undefined) updateData.category = category
    if (variants !== undefined) updateData.variants = variants

    // Important: Don't allow agent to change is_active (status) - only admin can
    updateData.updated_at = new Date().toISOString()

    // Update the product
    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from("wholesale_products")
      .update(updateData)
      .eq("id", product_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating product:", updateError)
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error in update-product endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
