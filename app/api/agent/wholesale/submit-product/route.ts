import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface ProductVariant {
  type: string
  values: string[]
}

interface ProductSubmissionBody {
  name: string
  description: string
  category: string
  price: number | string
  commission_value?: number | string
  quantity: number | string
  delivery_time?: string
  image_urls: string[]
  agent_id: string
  variants?: ProductVariant[]
  variant_metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase admin client using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const body = (await request.json()) as ProductSubmissionBody
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
      variants,
      variant_metadata,
    } = body

    // Validate required fields
    if (!name || !category || price === undefined || !quantity || !agent_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, price, quantity, agent_id" },
        { status: 400 },
      )
    }

    // Validate price and quantity are positive numbers
    const parsedPrice = parseFloat(String(price))
    const parsedQuantity = parseInt(String(quantity))

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 },
      )
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
        { status: 400 },
      )
    }

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json(
        { error: "At least one product image is required" },
        { status: 400 },
      )
    }

    // Verify agent exists and is approved
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, isapproved, can_publish_products")
      .eq("id", agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found. Invalid agent ID." },
        { status: 404 },
      )
    }

    // Check if agent is approved or has explicit permission to publish
    // Allow if either isapproved is true OR can_publish_products is true
    const hasPermission = agent.isapproved === true || agent.can_publish_products === true
    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "Your agent account is not authorized to publish products. Please contact support.",
        },
        { status: 403 },
      )
    }

    // Prepare variants JSON
    const variantsJson = variants && variants.length > 0 ? JSON.stringify(variants) : null

    // Insert product with is_active = false (unpublished) and submitted_by_agent_id to track who submitted it
    const { data, error } = await supabase
      .from("wholesale_products")
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || "",
          category,
          price: parsedPrice,
          commission_value: parseFloat(String(commission_value)) || 0,
          quantity: parsedQuantity,
          delivery_time: delivery_time || "3-5 business days",
          image_urls: image_urls,
          variants: variantsJson,
          variant_metadata: variant_metadata || null,
          is_active: false,
          submitted_by_agent_id: agent_id,
        },
      ])
      .select()

    if (error) {
      // Handle foreign key constraint errors
      if (error.code === "23503") {
        return NextResponse.json(
          { 
            error: "Invalid product data or agent reference. Please ensure all required fields are valid and try again.",
            details: error.message 
          },
          { status: 400 },
        )
      }

      // Handle other constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A product with this name already exists. Please use a different product name." },
          { status: 409 },
        )
      }

      // Handle unique constraint errors
      if (error.code === "23514") {
        return NextResponse.json(
          { error: "One or more product fields contain invalid values. Please check and try again." },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: "Failed to submit product. Please check your input and try again." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product submitted successfully! Admin will review and publish it.",
        data: data?.[0],
      },
      { status: 201 },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    )
  }
}
