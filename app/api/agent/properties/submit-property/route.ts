import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface PropertySubmissionBody {
  title: string
  description?: string
  category: string
  price: number | string
  currency: string
  location: string
  bedrooms?: number | string
  bathrooms?: number | string
  square_feet?: number | string
  commission?: number | string
  image_urls: string[]
  agent_id: string
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase admin client using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const body = (await request.json()) as PropertySubmissionBody
    const {
      title,
      description,
      category,
      price,
      currency,
      location,
      bedrooms,
      bathrooms,
      square_feet,
      commission,
      image_urls,
      agent_id,
    } = body

    // Validate required fields (only title, category, price, currency are required)
    if (!title || !category || price === undefined || !currency || !agent_id) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, price, currency, agent_id" },
        { status: 400 },
      )
    }

    // Validate price is a positive number
    const parsedPrice = parseFloat(String(price))
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 },
      )
    }

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json(
        { error: "At least one property image is required" },
        { status: 400 },
      )
    }

    // Verify agent exists and is approved
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, isapproved, can_publish_properties")
      .eq("id", agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found. Invalid agent ID." },
        { status: 404 },
      )
    }

    // Check if agent is approved or has explicit permission to publish
    const hasPermission = agent.isapproved === true || agent.can_publish_properties === true
    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "Your agent account is not authorized to publish properties. Please contact support.",
        },
        { status: 403 },
      )
    }

    // Parse commission if provided
    const parsedCommission = commission ? parseFloat(String(commission)) : 0

    // Build details object for JSONB column
    const details = {
      bedrooms: bedrooms ? parseInt(String(bedrooms)) : 0,
      bathrooms: bathrooms ? parseInt(String(bathrooms)) : 0,
      size: square_feet ? parseInt(String(square_feet)) : 0,
    }

    // Insert property with is_approved = false (pending) and set published_by_agent_id
    const propertyPayload = {
      title: title.trim(),
      description: description?.trim() || "",
      category,
      price: parsedPrice,
      currency: currency,
      location: location?.trim() || "",
      details: details,
      commission: parsedCommission,
      image_urls: image_urls,
      is_approved: false, // Set to pending
      published_by_agent_id: agent_id,
    }

    const { data, error } = await supabase
      .from("properties")
      .insert([propertyPayload])
      .select()

    if (error) {
      // Handle foreign key constraint errors
      if (error.code === "23503") {
        return NextResponse.json(
          { 
            error: "Invalid property data or agent reference. Please ensure all required fields are valid and try again.",
            details: error.message 
          },
          { status: 400 },
        )
      }

      // Handle other constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A property with this title already exists. Please use a different title." },
          { status: 409 },
        )
      }

      // Handle unique constraint errors
      if (error.code === "23514") {
        return NextResponse.json(
          { error: "One or more property fields contain invalid values. Please check and try again." },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: "Failed to submit property. Please check your input and try again.", details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Property submitted successfully! Admin will review and approve it.",
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
